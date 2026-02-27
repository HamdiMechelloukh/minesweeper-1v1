import React from 'react';
import { Cell as CellType } from '../types/game';
import Cell from './Cell';
import '../styles/Board.css';

interface BoardProps {
  grid: CellType[][];
  onCellClick?: (row: number, col: number) => void;
  onCellRightClick?: (row: number, col: number) => void;
  onCellChord?: (row: number, col: number) => void;
  readOnly?: boolean;
}

const Board: React.FC<BoardProps> = ({ grid, onCellClick, onCellRightClick, onCellChord, readOnly }) => {
  const handleCellClick = (row: number, col: number) => {
    if (!readOnly && onCellClick) {
      onCellClick(row, col);
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (!readOnly && onCellRightClick) {
      onCellRightClick(row, col);
    }
  };

  const handleCellChord = (row: number, col: number) => {
    if (!readOnly && onCellChord) {
      onCellChord(row, col);
    }
  };

  return (
    <div className="board">
      {grid.map((row, rIndex) => (
        <div key={rIndex} className="board-row">
          {row.map((cell, cIndex) => (
            <Cell
              key={`${rIndex}-${cIndex}`}
              cell={cell}
              onClick={() => handleCellClick(rIndex, cIndex)}
              onContextMenu={(e) => handleCellRightClick(e, rIndex, cIndex)}
              onChord={() => handleCellChord(rIndex, cIndex)}
              readOnly={readOnly}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
