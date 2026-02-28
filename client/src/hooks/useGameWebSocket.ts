import { useState, useEffect } from 'react';
import { gameSocket } from '../services/websocket';
import { GameState, Player } from '../types/game';
import { ServerMessage, PublicRoom } from '../types/websocket';

export function useGameWebSocket() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);

  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined) || 'ws://localhost:3001';
    gameSocket.connect(wsUrl);
    const unsubOpen = gameSocket.onOpen(() => setIsConnected(true));

    const unsubscribe = gameSocket.onMessage((message: ServerMessage) => {
      switch (message.type) {
        case 'connected': {
          setPlayerId(message.payload.playerId);
          const storedUsername = localStorage.getItem('ms_username');
          if (storedUsername) {
            gameSocket.sendMessage({ type: 'set_username', payload: { username: storedUsername } });
          }
          break;
        }
        case 'room_created':
          setRoomId(message.payload.roomId);
          setIsHost(true);
          break;
        case 'room_joined':
          setRoomId(message.payload.roomId);
          setPlayers(message.payload.players);
          setIsHost(message.payload.isHost);
          break;
        case 'game_state':
          setGameState(message.payload);
          setPlayers(message.payload.players);
          break;
        case 'opponent_update':
          setGameState(prevState => {
            if (!prevState) return null;
            const newPlayers = [...prevState.players];
            const playerIndex = newPlayers.findIndex(p => p.id === message.payload.playerId);
            if (playerIndex !== -1) {
              const player = { ...newPlayers[playerIndex] };
              const newGrid = player.gridState.map(row => [...row]);

              message.payload.revealedCells.forEach(cellUpdate => {
                if (newGrid[cellUpdate.row] && newGrid[cellUpdate.row][cellUpdate.col]) {
                  newGrid[cellUpdate.row][cellUpdate.col] = {
                    ...newGrid[cellUpdate.row][cellUpdate.col],
                    revealed: true,
                    minesAround: cellUpdate.value
                  };
                }
              });

              message.payload.flaggedCells.forEach(cellUpdate => {
                if (newGrid[cellUpdate.row] && newGrid[cellUpdate.row][cellUpdate.col]) {
                  newGrid[cellUpdate.row][cellUpdate.col] = {
                    ...newGrid[cellUpdate.row][cellUpdate.col],
                    flagged: cellUpdate.flagged,
                    questioned: cellUpdate.questioned ?? false
                  };
                }
              });

              if (message.payload.hitMine) {
                player.gameOver = true;
              }

              player.gridState = newGrid;
              newPlayers[playerIndex] = player;

              return { ...prevState, players: newPlayers };
            }
            return prevState;
          });
          break;
        case 'game_over':
          setGameState(prevState => {
            if (!prevState) return null;
            return {
              ...prevState,
              status: 'ended',
              winnerId: message.payload.winnerId,
              draw: message.payload.draw
            };
          });
          break;
        case 'rooms_list':
          setPublicRooms(message.payload.rooms);
          break;
        case 'error':
          setError(message.payload.message);
          break;
      }
    });

    return () => {
      unsubscribe();
      unsubOpen();
      setIsConnected(false);
      gameSocket.disconnect();
    };
  }, []);

  const createRoom = (isPublic: boolean) => {
    gameSocket.sendMessage({ type: 'create_room', payload: { isPublic } });
  };

  const joinRoom = (code: string) => {
    gameSocket.sendMessage({ type: 'join_room', payload: { roomId: code } });
  };

  const startGame = () => {
    gameSocket.sendMessage({ type: 'start_game', payload: {} });
  };

  const revealCell = (row: number, col: number) => {
    gameSocket.sendMessage({ type: 'reveal_cell', payload: { row, col } });
  };

  const flagCell = (row: number, col: number) => {
    gameSocket.sendMessage({ type: 'flag_cell', payload: { row, col } });
  };

  const chordCell = (row: number, col: number) => {
    gameSocket.sendMessage({ type: 'chord_cell', payload: { row, col } });
  };

  const listRooms = () => {
    gameSocket.sendMessage({ type: 'list_rooms' });
  };

  return {
    roomId,
    gameState,
    players,
    isHost,
    error,
    playerId,
    isConnected,
    publicRooms,
    createRoom,
    joinRoom,
    startGame,
    revealCell,
    flagCell,
    chordCell,
    listRooms
  };
}
