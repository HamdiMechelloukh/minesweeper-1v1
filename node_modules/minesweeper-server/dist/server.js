"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const roomManager_1 = __importDefault(require("./managers/roomManager"));
const gameManager_1 = __importDefault(require("./managers/gameManager"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const PORT = process.env.PORT || 3001;
// Store player connections: playerId -> WebSocket
const connections = new Map();
wss.on('connection', (ws) => {
    const playerId = Math.random().toString(36).substring(2, 15);
    connections.set(playerId, ws);
    // Send connected event with playerId
    sendMessage(ws, { type: 'connected', payload: { playerId } });
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            handleMessage(ws, playerId, data);
        }
        catch (e) {
            console.error('Invalid message format', e);
        }
    });
    ws.on('close', () => {
        connections.delete(playerId);
        // Find room and remove player
        const room = findRoomByPlayer(playerId);
        if (room) {
            roomManager_1.default.removePlayerFromRoom(room.id, playerId);
            // If in game, maybe notify game over?
            // Spec says: "Si un joueur se déconnecte pendant la partie, la partie continue pour l'autre joueur. Le joueur déconnecté est considéré comme ayant perdu (score 0)."
            const game = gameManager_1.default.getGameState(room.id);
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
function handleMessage(ws, playerId, message) {
    switch (message.type) {
        case 'create_room': {
            const room = roomManager_1.default.createRoom(playerId);
            roomManager_1.default.joinRoom(room.id, playerId); // Host joins automatically
            sendMessage(ws, { type: 'room_created', payload: { roomId: room.id, hostId: playerId } });
            break;
        }
        case 'join_room': {
            const { roomId } = message.payload;
            const success = roomManager_1.default.joinRoom(roomId, playerId);
            if (success) {
                const room = roomManager_1.default.getRoom(roomId);
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
            }
            else {
                sendMessage(ws, { type: 'error', payload: { message: 'Cannot join room' } });
            }
            break;
        }
        case 'start_game': {
            const room = findRoomByPlayer(playerId);
            if (room && room.hostId === playerId && roomManager_1.default.isRoomReadyToStart(room.id)) {
                const gameState = gameManager_1.default.startGame(room.id, Object.values(room.players));
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
        case 'flag_cell': {
            const { row, col } = message.payload;
            const game = findGameByPlayer(playerId);
            if (game) {
                const action = message.type === 'reveal_cell' ? 'reveal' : 'flag';
                const result = gameManager_1.default.handlePlayerAction(game.roomId, playerId, action, row, col);
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
                            if (pWs)
                                sendMessage(pWs, { type: 'game_over', payload });
                        });
                    }
                }
            }
            break;
        }
    }
}
function sendMessage(ws, message) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
function findRoomByPlayer(playerId) {
    return roomManager_1.default.findRoomByPlayer(playerId);
}
function findGameByPlayer(playerId) {
    return gameManager_1.default.findGameByPlayer(playerId);
}
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
