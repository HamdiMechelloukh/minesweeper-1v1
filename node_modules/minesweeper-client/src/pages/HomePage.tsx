import React, { useState } from 'react';
import '../styles/HomePage.css';

interface HomePageProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  error: string | null;
  isConnected: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onCreateRoom, onJoinRoom, error, isConnected }) => {
  const [code, setCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 4) {
      onJoinRoom(code.toUpperCase());
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1>
          <img src="/assets/home_icon.svg" alt="Home" className="home-icon" />
          Minesweeper 1v1
        </h1>
        {!isConnected && <div className="connecting-msg">Connexion au serveur...</div>}
        <div className="actions">
          <button className="btn-primary" onClick={onCreateRoom} disabled={!isConnected}>
            Créer une salle
          </button>
          <div className="separator">OU</div>
          <form onSubmit={handleJoin} className="join-form">
            <input
              type="text"
              placeholder="Code à 4 lettres"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={!isConnected}
            />
            <button type="submit" disabled={!isConnected || code.length !== 4}>
              Rejoindre
            </button>
          </form>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default HomePage;
