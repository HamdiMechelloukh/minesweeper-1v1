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

// ---------------------------------------------------------------------------
// Logical solvability checker + solvable board generator
// ---------------------------------------------------------------------------

/**
 * Simulates a constraint-propagation solver starting from (startRow, startCol).
 * Returns true if the board can be fully solved without guessing.
 *
 * Techniques used:
 *  1. Basic: if remaining mines == 0 → all unknown neighbors are safe
 *            if remaining mines == |unknowns| → all are mines
 *  2. Subset: if constraint A ⊆ constraint B, deduce info from B − A
 */
function isBoardSolvable(grid: Cell[][], startRow: number, startCol: number): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const key = (r: number, c: number) => r * cols + c; // numeric key for speed

  const revealed = new Uint8Array(rows * cols); // 1 = revealed
  const flagged  = new Uint8Array(rows * cols); // 1 = flagged as mine

  // BFS reveal: reveal safe cells, expanding through 0-cells
  function bfsReveal(startR: number, startC: number) {
    const queue: number[] = [key(startR, startC)];
    let head = 0;
    while (head < queue.length) {
      const k = queue[head++];
      if (revealed[k]) continue;
      const r = Math.floor(k / cols);
      const c = k % cols;
      if (grid[r][c].hasMine) continue;
      revealed[k] = 1;
      if (grid[r][c].minesAround === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const nr = r + i, nc = c + j;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const nk = key(nr, nc);
              if (!revealed[nk] && !flagged[nk]) queue.push(nk);
            }
          }
        }
      }
    }
  }

  bfsReveal(startRow, startCol);

  // Constraint: a set of unknown-cell keys that contains exactly `mines` mines
  interface Constraint { cells: number[]; mines: number; }

  let changed = true;
  while (changed) {
    changed = false;

    // Build constraint list from all revealed numbered cells
    const constraints: Constraint[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = key(r, c);
        if (!revealed[k] || grid[r][c].minesAround === 0) continue;
        const unknown: number[] = [];
        let flagCount = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const nr = r + i, nc = c + j;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const nk = key(nr, nc);
            if (flagged[nk]) flagCount++;
            else if (!revealed[nk]) unknown.push(nk);
          }
        }
        const remaining = grid[r][c].minesAround - flagCount;
        if (unknown.length > 0) constraints.push({ cells: unknown, mines: remaining });
      }
    }

    // Pass 1 — basic deductions
    for (const { cells, mines } of constraints) {
      if (mines === 0) {
        for (const k of cells) {
          if (!revealed[k]) { bfsReveal(Math.floor(k / cols), k % cols); changed = true; }
        }
      } else if (mines === cells.length) {
        for (const k of cells) {
          if (!flagged[k]) { flagged[k] = 1; changed = true; }
        }
      }
    }

    // Pass 2 — subset deductions (only if pass 1 made no progress)
    if (!changed) {
      for (let i = 0; i < constraints.length && !changed; i++) {
        const a = constraints[i];
        const setA = new Set(a.cells);
        for (let j = 0; j < constraints.length && !changed; j++) {
          if (i === j) continue;
          const b = constraints[j];
          // Check b ⊆ a
          if (b.cells.length >= a.cells.length) continue;
          if (!b.cells.every(k => setA.has(k))) continue;
          const diff = a.cells.filter(k => !new Set(b.cells).has(k));
          const diffMines = a.mines - b.mines;
          if (diffMines < 0 || diffMines > diff.length) continue;
          if (diffMines === 0) {
            for (const k of diff) {
              if (!revealed[k]) { bfsReveal(Math.floor(k / cols), k % cols); changed = true; }
            }
          } else if (diffMines === diff.length) {
            for (const k of diff) {
              if (!flagged[k]) { flagged[k] = 1; changed = true; }
            }
          }
        }
      }
    }
  }

  // Board is solvable only if every safe cell was reached
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c].hasMine && !revealed[key(r, c)]) return false;
    }
  }
  return true;
}

/**
 * Generates a board that is always logically solvable from (safeRow, safeCol).
 * Retries up to maxAttempts times; falls back to a random safe-zone board if
 * no solvable board is found within the attempt limit (extremely rare).
 */
export function generateSolvableBoard(
  rows: number, cols: number, mines: number,
  safeRow: number, safeCol: number,
  maxAttempts = 200
): Cell[][] {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = generateBoardWithSafeZone(rows, cols, mines, safeRow, safeCol);
    if (isBoardSolvable(grid, safeRow, safeCol)) {
      if (attempt > 0) console.log(`[Board] Solvable board found after ${attempt + 1} attempts`);
      return grid;
    }
  }
  console.warn(`[Board] Fallback after ${maxAttempts} attempts — using random board`);
  return generateBoardWithSafeZone(rows, cols, mines, safeRow, safeCol);
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
