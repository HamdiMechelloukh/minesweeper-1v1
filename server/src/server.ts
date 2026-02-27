import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import roomManager from './managers/roomManager';
import gameManager from './managers/gameManager';
import { ClientMessage, ServerMessage } from './types/websocket';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

// Store player connections: playerId -> WebSocket
const connections = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  const playerId = Math.random().toString(36).substring(2, 15);
  connections.set(playerId, ws);

  // Send connected event with playerId
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
    // Find room and remove player
    const room = findRoomByPlayer(playerId);
    if (room) {
        roomManager.removePlayerFromRoom(room.id, playerId);
        // If in game, maybe notify game over?
        // Spec says: "Si un joueur se déconnecte pendant la partie, la partie continue pour l'autre joueur. Le joueur déconnecté est considéré comme ayant perdu (score 0)."
        const game = gameManager.getGameState(room.id);
        if (game && game.status === 'playing') {
            const player = game.players.find(p => p.id === playerId);
            if (player) {
                player.gameOver = true;
                player.score = 0; // Penalty
                // Check if game ends
                if (game.players.every(p => p.gameOver)) {
                    game.status = 'ended';
                    game.timerEnd = Date.now();
                    // Determine winner
                    // ...
                }
                // Notify others
                const otherPlayer = game.players.find(p => p.id !== playerId);
                if (otherPlayer) {
                    const otherWs = connections.get(otherPlayer.id);
                    if (otherWs) {
                        // Send updated state
                        sendMessage(otherWs, { type: 'game_state', payload: game });
                    }
                }
            }
        }
    }
  });
});

function handleMessage(ws: WebSocket, playerId: string, message: ClientMessage) {
  switch (message.type) {
    case 'create_room': {
      const room = roomManager.createRoom(playerId);
      roomManager.joinRoom(room.id, playerId); // Host joins automatically
      sendMessage(ws, { type: 'room_created', payload: { roomId: room.id, hostId: playerId } });
      break;
    }
    case 'join_room': {
      const { roomId } = message.payload;
      const success = roomManager.joinRoom(roomId, playerId);
      if (success) {
        const room = roomManager.getRoom(roomId);
        if (room) {
          // Notify all players in room
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
        }
      } else {
        sendMessage(ws, { type: 'error', payload: { message: 'Cannot join room' } });
      }
      break;
    }
    case 'start_game': {
      const room = findRoomByPlayer(playerId);
      if (room && room.hostId === playerId && roomManager.isRoomReadyToStart(room.id)) {
        const gameState = gameManager.startGame(room.id, Object.values(room.players));
        
        gameState.players.forEach(p => {
          const pWs = connections.get(p.id);
          if (pWs) {
            sendMessage(pWs, { type: 'game_state', payload: gameState });
          }
        });
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
          }
        }
      }
      break;
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

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
