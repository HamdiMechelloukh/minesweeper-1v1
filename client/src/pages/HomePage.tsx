import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';

interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  games: number;
  best_ms: number | null;
}

interface HomePageProps {
  onCreateRoom: (isPublic: boolean) => void;
  onJoinRoom: (code: string) => void;
  onBrowseRooms: () => void;
  onChangeUsername: () => void;
  username: string;
  error: string | null;
  isConnected: boolean;
}

const HomePage: React.FC<HomePageProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBrowseRooms,
  onChangeUsername,
  username,
  error,
  isConnected
}) => {
  const [code, setCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || '';
    fetch(`${apiBase}/api/leaderboard`)
      .then(r => r.json())
      .then(data => setLeaderboard(data))
      .catch(() => { /* leaderboard unavailable */ });
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 4) {
      onJoinRoom(code.toUpperCase());
    }
  };

  const handleCreate = () => {
    setShowCreateModal(false);
    onCreateRoom(isPublic);
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return '—';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="home-page">
      <div className="home-layout">
        {/* Left panel: actions */}
        <div className="home-container">
          <div className="home-header">
            <h1>
              <img src="/assets/home_icon.svg" alt="" className="home-icon" />
              Minesweeper 1v1
            </h1>
            <div className="username-display">
              <span>{username}</span>
              <button className="btn-link" onClick={onChangeUsername}>Changer</button>
            </div>
          </div>

          {!isConnected && <div className="connecting-msg">Connexion au serveur...</div>}

          <div className="actions">
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={!isConnected}
            >
              Créer une salle
            </button>

            <button
              className="btn-secondary"
              onClick={onBrowseRooms}
              disabled={!isConnected}
            >
              Salles publiques
            </button>

            <div className="separator">OU</div>

            <form onSubmit={handleJoin} className="join-form">
              <input
                type="text"
                placeholder="Code à 4 lettres"
                maxLength={4}
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                disabled={!isConnected}
              />
              <button type="submit" disabled={!isConnected || code.length !== 4}>
                Rejoindre
              </button>
            </form>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Right panel: leaderboard */}
        <div className="leaderboard-panel">
          <h2>Classement</h2>
          {leaderboard.length === 0 ? (
            <p className="lb-empty">Aucun joueur encore classé.</p>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Joueur</th>
                  <th>Victoires</th>
                  <th>Parties</th>
                  <th>Meilleur temps</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((entry, i) => (
                  <tr key={entry.username} className={entry.username === username ? 'lb-self' : ''}>
                    <td>{i + 1}</td>
                    <td>{entry.username}</td>
                    <td>{entry.wins}</td>
                    <td>{entry.games}</td>
                    <td>{formatTime(entry.best_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create room modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Créer une salle</h3>
            <label className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              Rendre la salle publique
            </label>
            <p className="modal-hint">
              {isPublic
                ? 'Votre salle sera visible dans la liste des salles publiques.'
                : 'Partagez le code de salle pour inviter un ami.'}
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleCreate}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
