import React from 'react';
import { Player } from '../types/game';
import '../styles/PlayerInfo.css';

interface PlayerInfoProps {
  player: Player;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player }) => {
  // Deterministic icon based on player ID or name hash is complex without context.
  // We'll use a default icon or alternate if we could distinguish.
  // For now, let's just use player_1_icon for everyone or random.
  // But React component shouldn't be random on render.
  // Let's assume passed player index? No.
  
  return (
    <div className={`player-info ${player.gameOver ? 'game-over' : ''}`}>
      <img src="/assets/player_1_icon.svg" alt="Player Icon" className="player-icon" />
      <div className="player-name">{player.name}</div>
      <div className="player-score">Score: {player.score}</div>
      {player.gameOver && <div className="game-over-text">Game Over</div>}
    </div>
  );
};

export default PlayerInfo;
