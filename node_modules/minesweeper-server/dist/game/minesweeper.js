"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBoard = generateBoard;
exports.revealCell = revealCell;
exports.flagCell = flagCell;
exports.checkWinCondition = checkWinCondition;
class Random {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}
function generateBoard(seed, rows, cols, mines) {
    const rng = new Random(seed);
    const grid = [];
    // Initialize empty grid
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                row: r,
                col: c,
                hasMine: false,
                minesAround: 0,
                revealed: false,
                flagged: false,
            });
        }
        grid.push(row);
    }
    // Place mines
    let placedMines = 0;
    while (placedMines < mines) {
        const r = Math.floor(rng.next() * rows);
        const c = Math.floor(rng.next() * cols);
        if (!grid[r][c].hasMine) {
            grid[r][c].hasMine = true;
            placedMines++;
        }
    }
    // Calculate numbers
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c].hasMine)
                continue;
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0)
                        continue;
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
function revealCell(grid, row, col) {
    const cell = grid[row][col];
    const newlyRevealed = [];
    if (cell.revealed || cell.flagged) {
        return { updatedGrid: grid, revealedCount: 0, hitMine: false, revealedCells: [] };
    }
    if (cell.hasMine) {
        cell.revealed = true;
        cell.exploded = true;
        newlyRevealed.push(cell);
        return { updatedGrid: grid, revealedCount: 0, hitMine: true, revealedCells: newlyRevealed };
    }
    // BFS for revealing
    const queue = [cell];
    cell.revealed = true;
    newlyRevealed.push(cell);
    let count = 0;
    // We process the queue. If the processed cell is a 0, we add its neighbors.
    // The initial cell is added. 
    // Wait, the queue should contain cells that are 0 and need their neighbors checked.
    // If the clicked cell is > 0, we just reveal it and stop.
    if (cell.minesAround > 0) {
        return { updatedGrid: grid, revealedCount: 1, hitMine: false, revealedCells: newlyRevealed };
    }
    // If we are here, cell.minesAround is 0.
    // Using a separate index for queue processing to avoid shifting array (though array is small enough)
    let head = 0;
    while (head < queue.length) {
        const current = queue[head++];
        // Neighbors
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0)
                    continue;
                const nr = current.row + i;
                const nc = current.col + j;
                if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
                    const neighbor = grid[nr][nc];
                    if (!neighbor.revealed && !neighbor.flagged) {
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
function flagCell(grid, row, col) {
    const cell = grid[row][col];
    if (!cell.revealed) {
        cell.flagged = !cell.flagged;
        return { updatedGrid: grid, flagged: cell.flagged };
    }
    return { updatedGrid: grid, flagged: false };
}
function checkWinCondition(grid, totalSafeCells) {
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
