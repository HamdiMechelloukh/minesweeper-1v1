"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minesweeper_1 = require("../game/minesweeper");
class GameManager {
    constructor() {
        this.games = new Map();
    }
    startGame(roomId, players) {
        const seed = Math.floor(Math.random() * 1000000);
        const rows = 16;
        const cols = 16;
        const mines = 40;
        // Initialize players with new grids
        const initializedPlayers = players.map(p => ({
            ...p,
            score: 0,
            gameOver: false,
            gridState: (0, minesweeper_1.generateBoard)(seed, rows, cols, mines)
        }));
        const gameState = {
            roomId,
            players: initializedPlayers,
            status: 'playing',
            seed,
            timerStart: Date.now(),
            winnerId: null,
            draw: false,
            totalSafeCells: (rows * cols) - mines,
            boardRows: rows,
            boardCols: cols,
            totalMines: mines
        };
        this.games.set(roomId, gameState);
        return gameState;
    }
    getGameState(roomId) {
        return this.games.get(roomId);
    }
    findGameByPlayer(playerId) {
        for (const game of this.games.values()) {
            if (game.players.some(p => p.id === playerId)) {
                return game;
            }
        }
        return undefined;
    }
    handlePlayerAction(roomId, playerId, action, row, col) {
        const game = this.games.get(roomId);
        if (!game || game.status !== 'playing')
            return null;
        const player = game.players.find(p => p.id === playerId);
        if (!player || player.gameOver)
            return null;
        let revealedCells = [];
        let hitMine = false;
        let flagUpdate = null;
        if (action === 'reveal') {
            const result = (0, minesweeper_1.revealCell)(player.gridState, row, col);
            player.gridState = result.updatedGrid;
            revealedCells = result.revealedCells;
            hitMine = result.hitMine;
            if (hitMine) {
                player.gameOver = true;
            }
            else {
                player.score += result.revealedCount;
                if ((0, minesweeper_1.checkWinCondition)(player.gridState, game.totalSafeCells)) {
                    player.gameOver = true;
                }
            }
        }
        else if (action === 'flag') {
            const result = (0, minesweeper_1.flagCell)(player.gridState, row, col);
            player.gridState = result.updatedGrid;
            flagUpdate = { flagged: result.flagged };
        }
        // Check if game ended
        const allFinished = game.players.every(p => p.gameOver);
        if (allFinished) {
            game.status = 'ended';
            game.timerEnd = Date.now();
            this.determineWinner(game);
        }
        return {
            gameState: game,
            userUpdate: {}, // Dummy
            opponentUpdate: {
                playerId,
                revealedCells: revealedCells.map(c => ({ row: c.row, col: c.col, value: c.minesAround })),
                flaggedCells: flagUpdate ? [{ row, col, flagged: flagUpdate.flagged }] : [],
                hitMine: hitMine || undefined
            },
            gameOver: allFinished
        };
    }
    determineWinner(game) {
        // Determine winner based on score
        const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
        if (sortedPlayers[0].score === sortedPlayers[1].score) {
            game.draw = true;
            game.winnerId = null;
        }
        else {
            game.winnerId = sortedPlayers[0].id;
            game.draw = false;
        }
    }
    removeGame(roomId) {
        this.games.delete(roomId);
    }
}
exports.default = new GameManager();
