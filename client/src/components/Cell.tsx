import React, { useRef } from 'react';
import { Cell as CellType } from '../types/game';
import '../styles/Cell.css';

interface CellProps {
  cell: CellType;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onChord?: () => void;
  readOnly?: boolean;
}

const Cell: React.FC<CellProps> = ({ cell, onClick, onContextMenu, onChord, readOnly }) => {
  const chordFiredRef = useRef(false);

  const getCellContent = () => {
    if (cell.flagged) {
      return <img src="/assets/flag.svg" alt="Flag" className="cell-icon" />;
    }
    if (cell.questioned) {
      return <span className="question-mark">?</span>;
    }
    if (!cell.revealed) {
      return null;
    }
    if (cell.hasMine) {
      return <img src="/assets/mine.svg" alt="Mine" className="cell-icon mine" />;
    }
    if (cell.minesAround > 0) {
      return <span className={`number n${cell.minesAround}`}>{cell.minesAround}</span>;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    // Both buttons held (left=1, right=2, both=3)
    if ((e.buttons & 3) === 3) {
      chordFiredRef.current = true;
      if (onChord) onChord();
    }
  };

  const handleClick = () => {
    if (chordFiredRef.current) {
      chordFiredRef.current = false;
      return;
    }
    if (!readOnly) onClick();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (chordFiredRef.current) {
      chordFiredRef.current = false;
      return;
    }
    if (!readOnly) onContextMenu(e);
  };

  const className = [
    'cell',
    cell.revealed ? 'revealed' : 'hidden',
    cell.flagged ? 'flagged' : '',
    cell.questioned ? 'questioned' : '',
    cell.exploded ? 'exploded' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
    >
      {getCellContent()}
    </div>
  );
};

export default Cell;
