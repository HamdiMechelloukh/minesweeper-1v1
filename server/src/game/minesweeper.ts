import { Cell } from '../types/game';

export function generateEmptyBoard(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ row: r, col: c, hasMine: false, minesAround: 0, revealed: false, flagged: false });
    }
    grid.push(row);
  }
  return grid;
}

export function generateBoardWithSafeZone(rows: number, cols: number, mines: number, safeRow: number, safeCol: number): Cell[][] {
  const grid = generateEmptyBoard(rows, cols);

  // Collect valid positions (exclude 3×3 around safe cell)
  const positions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.abs(r - safeRow) > 1 || Math.abs(c - safeCol) > 1) {
        positions.push([r, c]);
      }
    }
  }

  // Fisher-Yates shuffle, take first `mines` positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < mines; i++) {
    const [r, c] = positions[i];
    grid[r][c].hasMine = true;
  }

  // Calculate neighbor counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].hasMine) continue;
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const nr = r + i;
          const nc = c + j;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].hasMine) {
            count++;
          }
        }
      }
      grid[r][c].minesAround = count;
    }
  }

  return grid;
}

export function revealCell(grid: Cell[][], row: number, col: number): { updatedGrid: Cell[][], revealedCount: number, hitMine: boolean, revealedCells: Cell[] } {
  const cell = grid[row][col];
  const newlyRevealed: Cell[] = [];

  // Flagged cells cannot be revealed by direct click; questioned cells CAN be revealed
  if (cell.revealed || cell.flagged) {
    return { updatedGrid: grid, revealedCount: 0, hitMine: false, revealedCells: [] };
  }

  // Clear question mark when revealing
  cell.questioned = false;

  if (cell.hasMine) {
    cell.revealed = true;
    cell.exploded = true;
    newlyRevealed.push(cell);
    return { updatedGrid: grid, revealedCount: 0, hitMine: true, revealedCells: newlyRevealed };
  }

  // BFS flood fill
  const queue: Cell[] = [cell];
  cell.revealed = true;
  newlyRevealed.push(cell);

  if (cell.minesAround > 0) {
    return { updatedGrid: grid, revealedCount: 1, hitMine: false, revealedCells: newlyRevealed };
  }

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const nr = current.row + i;
        const nc = current.col + j;

        if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
          const neighbor = grid[nr][nc];
          // BFS skips flagged AND questioned neighbors
          if (!neighbor.revealed && !neighbor.flagged && !neighbor.questioned) {
            neighbor.revealed = true;
            newlyRevealed.push(neighbor);
            if (neighbor.minesAround === 0) {
              queue.push(neighbor);
            }
          }
        }
      }
    }
  }

  return { updatedGrid: grid, revealedCount: newlyRevealed.length, hitMine: false, revealedCells: newlyRevealed };
}

export function cycleFlag(grid: Cell[][], row: number, col: number): { updatedGrid: Cell[][], flagged: boolean, questioned: boolean } {
  const cell = grid[row][col];
  if (cell.revealed) {
    return { updatedGrid: grid, flagged: false, questioned: false };
  }

  if (!cell.flagged && !cell.questioned) {
    // empty → flag
    cell.flagged = true;
    cell.questioned = false;
  } else if (cell.flagged) {
    // flag → ?
    cell.flagged = false;
    cell.questioned = true;
  } else {
    // ? → empty
    cell.flagged = false;
    cell.questioned = false;
  }

  return { updatedGrid: grid, flagged: cell.flagged, questioned: cell.questioned };
}

export function chordReveal(grid: Cell[][], row: number, col: number): { updatedGrid: Cell[][], revealedCells: Cell[], hitMine: boolean } {
  const cell = grid[row][col];

  // Chord only applies to revealed numbered cells
  if (!cell.revealed || cell.minesAround === 0) {
    return { updatedGrid: grid, revealedCells: [], hitMine: false };
  }

  const rows = grid.length;
  const cols = grid[0].length;

  // Count adjacent flags
  let flagCount = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const nr = row + i;
      const nc = col + j;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].flagged) {
        flagCount++;
      }
    }
  }

  // Only chord if adjacent flag count matches the cell's number
  if (flagCount !== cell.minesAround) {
    return { updatedGrid: grid, revealedCells: [], hitMine: false };
  }

  // Reveal all unrevealed, unflagged, unquestioned neighbors
  const allRevealedCells: Cell[] = [];
  let hitMine = false;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const nr = row + i;
      const nc = col + j;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const neighbor = grid[nr][nc];
        if (!neighbor.revealed && !neighbor.flagged && !neighbor.questioned) {
          const result = revealCell(grid, nr, nc);
          allRevealedCells.push(...result.revealedCells);
          if (result.hitMine) hitMine = true;
        }
      }
    }
  }

  return { updatedGrid: grid, revealedCells: allRevealedCells, hitMine };
}

export function checkWinCondition(grid: Cell[][], totalSafeCells: number): boolean {
  let revealedSafeCells = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].revealed && !grid[r][c].hasMine) {
        revealedSafeCells++;
      }
    }
  }
  return revealedSafeCells === totalSafeCells;
}
