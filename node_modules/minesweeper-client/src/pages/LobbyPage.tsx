import React from 'react';
import { Player } from '../types/game';
import '../styles/LobbyPage.css';

interface LobbyPageProps {
  roomId: string;
  players: Player[];
  onStartGame: () => void;
  isHost: boolean;
  onExit: () => void;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ roomId, players, onStartGame, isHost, onExit }) => {
  return (
    <div className="lobby-page">
      <div className="lobby-container">
        <h1>
          <img src="/assets/lobby_icon.svg" alt="Lobby" className="lobby-icon" style={{ width: 32, height: 32, marginRight: 10, filter: 'invert(1)' }} />
          Lobby
        </h1>
        <div className="room-code">
          Code de la salle: <strong>{roomId}</strong>
        </div>
        <div className="players-list">
          {players.map((p, index) => (
            <div key={p.id} className="player-entry">
              <span className="player-number">{index + 1}.</span> {p.name} {isHost && p.id === players[0].id ? '(Host)' : ''}
            </div>
          ))}
          {players.length < 2 && (
            <div className="player-entry waiting">En attente d'un adversaire...</div>
          )}
        </div>
        <div className="actions">
          {isHost && players.length >= 2 ? (
            <button className="btn-start" onClick={onStartGame}>
              Démarrer la partie
            </button>
          ) : (
            isHost && <div className="waiting-text">En attente de joueurs...</div>
          )}
          {!isHost && <div className="waiting-text">En attente de l'hôte...</div>}
          <button className="btn-exit" onClick={onExit}>
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
