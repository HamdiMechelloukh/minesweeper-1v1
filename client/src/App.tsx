import React, { useState } from 'react';
import { useGameWebSocket } from './hooks/useGameWebSocket';
import UsernamePage from './pages/UsernamePage';
import HomePage from './pages/HomePage';
import PublicRoomsPage from './pages/PublicRoomsPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import './styles/index.css';

type View = 'home' | 'public-rooms';

const App: React.FC = () => {
  const {
    gameState,
    roomId,
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
  } = useGameWebSocket();

  const [view, setView] = useState<View>('home');
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem('ms_username') || ''
  );

  const handleUsernameConfirm = (name: string) => {
    setUsername(name);
  };

  const handleChangeUsername = () => {
    localStorage.removeItem('ms_username');
    setUsername('');
  };

  if (!username) {
    return (
      <div className="app-root">
        <UsernamePage onConfirm={handleUsernameConfirm} />
      </div>
    );
  }

  let content: React.ReactNode;

  if (!roomId) {
    if (view === 'public-rooms') {
      content = (
        <PublicRoomsPage
          rooms={publicRooms}
          onJoinRoom={(code) => {
            joinRoom(code);
            setView('home');
          }}
          onListRooms={listRooms}
          onBack={() => setView('home')}
        />
      );
    } else {
      content = (
        <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onBrowseRooms={() => setView('public-rooms')}
          onChangeUsername={handleChangeUsername}
          username={username}
          error={error}
          isConnected={isConnected}
        />
      );
    }
  } else if (!gameState || gameState.status === 'waiting') {
    content = (
      <LobbyPage
        roomId={roomId}
        players={players}
        onStartGame={startGame}
        isHost={isHost}
        onExit={() => window.location.reload()}
      />
    );
  } else {
    if (!playerId) {
      content = <div>Connexion...</div>;
    } else {
      content = (
        <GamePage
          gameState={gameState}
          playerId={playerId}
          onReveal={revealCell}
          onFlag={flagCell}
          onChord={chordCell}
        />
      );
    }
  }

  return <div className="app-root">{content}</div>;
};

export default App;
