import 'dotenv/config';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import roomManager from './managers/roomManager';
import gameManager from './managers/gameManager';
import { ClientMessage, ServerMessage } from './types/websocket';
import { initDb } from './db/database';
import { getTop20 } from './db/leaderboard';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

// playerId -> WebSocket
const connections = new Map<string, WebSocket>();
// playerId -> username (in-memory, cleared on disconnect)
const usernames = new Map<string, string>();

// Share usernames map with gameManager so it can persist results
gameManager.usernames = usernames;

// ─── HTTP Routes ─────────────────────────────────────────────────────────────

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const entries = await getTop20();
    res.json(entries);
  } catch (err) {
    console.error('leaderboard fetch failed:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── WebSocket ───────────────────────────────────────────────────────────────

wss.on('connection', (ws: WebSocket) => {
  const playerId = Math.random().toString(36).substring(2, 15);
  connections.set(playerId, ws);

  sendMessage(ws, { type: 'connected', payload: { playerId } });

  ws.on('message', (message: string) => {
    try {
      const data: ClientMessage = JSON.parse(message.toString());
      handleMessage(ws, playerId, data);
    } catch (e) {
      console.error('Invalid message format', e);
    }
  });

  ws.on('close', () => {
    connections.delete(playerId);
    usernames.delete(playerId);

    const room = findRoomByPlayer(playerId);
    if (room) {
      roomManager.removePlayerFromRoom(room.id, playerId);
      const game = gameManager.getGameState(room.id);
      if (game && game.status === 'playing') {
        const player = game.players.find(p => p.id === playerId);
        if (player) {
          player.gameOver = true;
          player.score = 0;
          if (game.players.every(p => p.gameOver)) {
            game.status = 'ended';
            game.timerEnd = Date.now();
          }
          const otherPlayer = game.players.find(p => p.id !== playerId);
          if (otherPlayer) {
            const otherWs = connections.get(otherPlayer.id);
            if (otherWs) {
              sendMessage(otherWs, { type: 'game_state', payload: game });
            }
          }
        }
      }
      broadcastRoomsList();
    }
  });
});

function handleMessage(ws: WebSocket, playerId: string, message: ClientMessage) {
  switch (message.type) {
    case 'set_username': {
      const { username } = message.payload;
      const sanitized = username.trim().slice(0, 16);
      usernames.set(playerId, sanitized);
      // Update player name in room if already joined
      const room = findRoomByPlayer(playerId);
      if (room && room.players[playerId]) {
        room.players[playerId].name = sanitized;
      }
      break;
    }

    case 'create_room': {
      const isPublic = message.payload?.isPublic ?? false;
      const room = roomManager.createRoom(playerId, isPublic);
      roomManager.joinRoom(room.id, playerId);
      const uname = usernames.get(playerId);
      if (uname && room.players[playerId]) {
        room.players[playerId].name = uname;
      }
      sendMessage(ws, { type: 'room_created', payload: { roomId: room.id, hostId: playerId } });
      if (isPublic) broadcastRoomsList();
      break;
    }

    case 'list_rooms': {
      sendMessage(ws, {
        type: 'rooms_list',
        payload: { rooms: roomManager.getPublicRooms(usernames) }
      });
      break;
    }

    case 'join_room': {
      const { roomId } = message.payload;
      const success = roomManager.joinRoom(roomId, playerId);
      if (success) {
        const room = roomManager.getRoom(roomId);
        if (room) {
          const uname = usernames.get(playerId);
          if (uname && room.players[playerId]) {
            room.players[playerId].name = uname;
          }
          Object.values(room.players).forEach(p => {
            const pWs = connections.get(p.id);
            if (pWs) {
              sendMessage(pWs, {
                type: 'room_joined',
                payload: {
                  roomId: room.id,
                  players: Object.values(room.players),
                  isHost: room.hostId === p.id
                }
              });
            }
          });
          if (room.isPublic) broadcastRoomsList();
        }
      } else {
        sendMessage(ws, { type: 'error', payload: { message: 'Cannot join room' } });
      }
      break;
    }

    case 'start_game': {
      const room = findRoomByPlayer(playerId);
      if (room && room.hostId === playerId && roomManager.isRoomReadyToStart(room.id)) {
        room.status = 'in-game';
        const gameState = gameManager.startGame(room.id, Object.values(room.players));
        gameState.players.forEach(p => {
          const pWs = connections.get(p.id);
          if (pWs) {
            sendMessage(pWs, { type: 'game_state', payload: gameState });
          }
        });
        if (room.isPublic) broadcastRoomsList();
      }
      break;
    }

    case 'reveal_cell':
    case 'flag_cell':
    case 'chord_cell': {
      const { row, col } = message.payload;
      const game = findGameByPlayer(playerId);
      if (game) {
        const action = message.type === 'reveal_cell' ? 'reveal' : message.type === 'flag_cell' ? 'flag' : 'chord';
        const result = gameManager.handlePlayerAction(game.roomId, playerId, action, row, col);

        if (result) {
          sendMessage(ws, { type: 'game_state', payload: result.gameState });

          const opponent = result.gameState.players.find(p => p.id !== playerId);
          if (opponent) {
            const oppWs = connections.get(opponent.id);
            if (oppWs) {
              sendMessage(oppWs, { type: 'opponent_update', payload: result.opponentUpdate });
            }
          }

          if (result.gameOver) {
            const payload = {
              winnerId: result.gameState.winnerId,
              draw: result.gameState.draw,
              scores: result.gameState.players.map(p => ({ playerId: p.id, score: p.score })),
              totalTime: (Date.now() - result.gameState.timerStart) / 1000
            };
            result.gameState.players.forEach(p => {
              const pWs = connections.get(p.id);
              if (pWs) sendMessage(pWs, { type: 'game_over', payload });
            });
            const room = roomManager.getRoom(game.roomId);
            if (room?.isPublic) broadcastRoomsList();
          }
        }
      }
      break;
    }
  }
}

function broadcastRoomsList() {
  const rooms = roomManager.getPublicRooms(usernames);
  for (const [pid, ws] of connections) {
    if (!findRoomByPlayer(pid)) {
      sendMessage(ws, { type: 'rooms_list', payload: { rooms } });
    }
  }
}

function sendMessage(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function findRoomByPlayer(playerId: string) {
  return roomManager.findRoomByPlayer(playerId);
}

function findGameByPlayer(playerId: string) {
  return gameManager.findGameByPlayer(playerId);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  if (process.env.DATABASE_URL) {
    try {
      await initDb();
      console.log('Database initialised');
    } catch (err) {
      console.error('Database init failed (continuing without DB):', err);
    }
  } else {
    console.log('DATABASE_URL not set — leaderboard disabled');
  }

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

main();
