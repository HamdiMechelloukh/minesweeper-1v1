import { GameState, Player, Cell } from '../types/game';
import { generateEmptyBoard, generateBoardWithSafeZone, revealCell, cycleFlag, chordReveal, checkWinCondition } from '../game/minesweeper';

class GameManager {
  private games: Map<string, GameState> = new Map();

  startGame(roomId: string, players: Player[]): GameState {
    const rows = 16;
    const cols = 16;
    const mines = 40;

    // Initialize players with empty grids; boards are generated lazily on first click
    const initializedPlayers = players.map(p => ({
      ...p,
      score: 0,
      gameOver: false,
      boardReady: false,
      gridState: generateEmptyBoard(rows, cols)
    }));

    const gameState: GameState = {
      roomId,
      players: initializedPlayers,
      status: 'playing',
      seed: 0,
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

  getGameState(roomId: string): GameState | undefined {
    return this.games.get(roomId);
  }

  findGameByPlayer(playerId: string): GameState | undefined {
    for (const game of this.games.values()) {
      if (game.players.some(p => p.id === playerId)) {
        return game;
      }
    }
    return undefined;
  }

  handlePlayerAction(roomId: string, playerId: string, action: 'reveal' | 'flag' | 'chord', row: number, col: number): {
    gameState: GameState;
    userUpdate: any;
    opponentUpdate: {
      playerId: string;
      revealedCells: { row: number, col: number, value: number }[];
      flaggedCells: { row: number, col: number, flagged: boolean, questioned?: boolean }[];
      hitMine?: boolean;
    };
    gameOver?: boolean;
  } | null {
    const game = this.games.get(roomId);
    if (!game || game.status !== 'playing') return null;

    const player = game.players.find(p => p.id === playerId);
    if (!player || player.gameOver) return null;

    let revealedCells: Cell[] = [];
    let hitMine = false;
    let flagUpdate: { flagged: boolean, questioned?: boolean } | null = null;

    if (action === 'reveal') {
      // Lazy board generation: generate mines on first reveal
      if (!player.boardReady) {
        player.gridState = generateBoardWithSafeZone(game.boardRows, game.boardCols, game.totalMines, row, col);
        player.boardReady = true;
      }

      const result = revealCell(player.gridState, row, col);
      player.gridState = result.updatedGrid;
      revealedCells = result.revealedCells;
      hitMine = result.hitMine;

      if (hitMine) {
        player.gameOver = true;
      } else {
        player.score += result.revealedCount;
        if (checkWinCondition(player.gridState, game.totalSafeCells)) {
          player.gameOver = true;
        }
      }
    } else if (action === 'flag') {
      const result = cycleFlag(player.gridState, row, col);
      player.gridState = result.updatedGrid;
      flagUpdate = { flagged: result.flagged, questioned: result.questioned };
    } else if (action === 'chord') {
      if (!player.boardReady) return null;

      const result = chordReveal(player.gridState, row, col);
      player.gridState = result.updatedGrid;
      revealedCells = result.revealedCells;
      hitMine = result.hitMine;

      if (hitMine) {
        player.gameOver = true;
      } else {
        player.score += revealedCells.filter(c => !c.hasMine).length;
        if (checkWinCondition(player.gridState, game.totalSafeCells)) {
          player.gameOver = true;
        }
      }
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
      userUpdate: {},
      opponentUpdate: {
        playerId,
        revealedCells: revealedCells.map(c => ({ row: c.row, col: c.col, value: c.minesAround })),
        flaggedCells: flagUpdate ? [{ row, col, flagged: flagUpdate.flagged, questioned: flagUpdate.questioned }] : [],
        hitMine: hitMine || undefined
      },
      gameOver: allFinished
    };
  }

  private determineWinner(game: GameState) {
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    if (sortedPlayers[0].score === sortedPlayers[1].score) {
      game.draw = true;
      game.winnerId = null;
    } else {
      game.winnerId = sortedPlayers[0].id;
      game.draw = false;
    }
  }

  removeGame(roomId: string) {
    this.games.delete(roomId);
  }
}

export default new GameManager();
