export interface Cell {
  row: number;
  col: number;
  hasMine: boolean;
  minesAround: number;
  revealed: boolean;
  flagged: boolean;
  exploded?: boolean;
  questioned?: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  gameOver: boolean;
  gridState: Cell[][];
  boardReady: boolean;
  completionTime?: number;
}

export interface PublicRoom {
  id: string;
  hostName: string;
  playerCount: number;
  status: 'waiting' | 'playing';
}

export interface RoomState {
  id: string;
  hostId: string;
  players: { [playerId: string]: Player };
  status: 'waiting' | 'ready' | 'in-game' | 'ended';
  gameSeed?: number;
  isPublic: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'ended';
  seed: number;
  timerStart: number;
  timerEnd?: number;
  winnerId: string | null;
  draw: boolean;
  totalSafeCells: number;
  boardRows: number;
  boardCols: number;
  totalMines: number;
}
