"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Ensure uniqueness
        if (this.rooms.has(result)) {
            return this.generateRoomCode();
        }
        return result;
    }
    createRoom(hostId) {
        const roomId = this.generateRoomCode();
        const newRoom = {
            id: roomId,
            hostId,
            players: {},
            status: 'waiting'
        };
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    joinRoom(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        // Check if player already in room
        if (room.players[playerId])
            return true;
        if (Object.keys(room.players).length >= 2)
            return false;
        if (room.status !== 'waiting')
            return false;
        const newPlayer = {
            id: playerId,
            name: `Player ${Object.keys(room.players).length + 1}`,
            score: 0,
            gameOver: false,
            gridState: []
        };
        room.players[playerId] = newPlayer;
        return true;
    }
    removePlayerFromRoom(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (room) {
            delete room.players[playerId];
            if (Object.keys(room.players).length === 0) {
                this.rooms.delete(roomId);
            }
            else if (room.hostId === playerId) {
                // Reassign host
                room.hostId = Object.keys(room.players)[0];
            }
        }
    }
    isRoomReadyToStart(roomId) {
        const room = this.rooms.get(roomId);
        return room ? Object.keys(room.players).length === 2 : false;
    }
    findRoomByPlayer(playerId) {
        for (const room of this.rooms.values()) {
            if (room.players[playerId]) {
                return room;
            }
        }
        return undefined;
    }
}
exports.default = new RoomManager();
