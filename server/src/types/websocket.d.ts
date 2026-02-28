import { GameState, Player, PublicRoom } from './game';

export interface RevealCellEvent {
  type: 'reveal_cell';
  payload: {
    row: number;
    col: number;
  };
}

export interface FlagCellEvent {
  type: 'flag_cell';
  payload: {
    row: number;
    col: number;
  };
}

export interface ChordCellEvent {
  type: 'chord_cell';
  payload: {
    row: number;
    col: number;
  };
}

export interface StartGameEvent {
  type: 'start_game';
}

export interface SetUsernameEvent {
  type: 'set_username';
  payload: {
    username: string;
  };
}

export interface CreateRoomEvent {
  type: 'create_room';
  payload?: {
    isPublic?: boolean;
  };
}

export interface ListRoomsEvent {
  type: 'list_rooms';
}

export interface RoomsListEvent {
  type: 'rooms_list';
  payload: {
    rooms: PublicRoom[];
  };
}

export interface JoinRoomEvent {
  type: 'join_room';
  payload: {
    roomId: string;
  };
}

export interface GameStateEvent {
  type: 'game_state';
  payload: GameState;
}

export interface OpponentUpdateEvent {
  type: 'opponent_update';
  payload: {
    playerId: string;
    revealedCells: { row: number, col: number, value: number }[];
    flaggedCells: { row: number, col: number, flagged: boolean, questioned?: boolean }[];
    hitMine?: boolean;
  };
}

export interface GameOverEvent {
  type: 'game_over';
  payload: {
    winnerId: string | null;
    draw: boolean;
    scores: { playerId: string, score: number }[];
    totalTime: number;
  };
}

export interface RoomCreatedEvent {
  type: 'room_created';
  payload: {
    roomId: string;
    hostId: string;
  };
}

export interface RoomJoinedEvent {
  type: 'room_joined';
  payload: {
    roomId: string;
    players: Player[];
    isHost: boolean;
  };
}

export interface ConnectedEvent {
  type: 'connected';
  payload: {
    playerId: string;
  };
}

export interface ErrorEvent {
  type: 'error';
  payload: {
    message: string;
    code?: number;
  };
}

export type ClientMessage = RevealCellEvent | FlagCellEvent | ChordCellEvent | StartGameEvent | CreateRoomEvent | JoinRoomEvent | SetUsernameEvent | ListRoomsEvent;
export type ServerMessage = GameStateEvent | OpponentUpdateEvent | GameOverEvent | RoomCreatedEvent | RoomJoinedEvent | ConnectedEvent | ErrorEvent | RoomsListEvent;
