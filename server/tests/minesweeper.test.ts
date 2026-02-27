import { expect } from 'chai';
import { generateEmptyBoard, generateBoardWithSafeZone, revealCell, cycleFlag, chordReveal, checkWinCondition } from '../src/game/minesweeper';
import { Cell } from '../src/types/game';

describe('Minesweeper Game Logic', () => {
    const rows = 5;
    const cols = 5;
    const mines = 5;
    let board: Cell[][];

    beforeEach(() => {
        // Safe zone at center (2,2) to guarantee reproducible non-mine area
        board = generateBoardWithSafeZone(rows, cols, mines, 2, 2);
    });

    it('should generate a board with the correct dimensions and number of mines', () => {
        expect(board).to.have.length(rows);
        board.forEach(row => expect(row).to.have.length(cols));

        const totalMines = board.flat().filter(cell => cell.hasMine).length;
        expect(totalMines).to.equal(mines);
    });

    it('should guarantee safe zone around first click', () => {
        // No mine in the 3x3 around (2,2)
        for (let r = 1; r <= 3; r++) {
            for (let c = 1; c <= 3; c++) {
                expect(board[r][c].hasMine, `cell (${r},${c}) should not be a mine`).to.be.false;
            }
        }
    });

    it('should generate an empty board', () => {
        const empty = generateEmptyBoard(3, 4);
        expect(empty).to.have.length(3);
        empty.forEach(row => {
            expect(row).to.have.length(4);
            row.forEach(cell => {
                expect(cell.hasMine).to.be.false;
                expect(cell.revealed).to.be.false;
                expect(cell.flagged).to.be.false;
            });
        });
    });

    it('should reveal a non-mine cell correctly', () => {
        // Center cell (2,2) is always safe
        const result = revealCell(board, 2, 2);
        expect(result.updatedGrid[2][2].revealed).to.be.true;
        expect(result.hitMine).to.be.false;
        expect(result.revealedCount).to.be.greaterThan(0);
    });

    it('should set hitMine to true if a mine is revealed', () => {
        let r = 0, c = 0;
        while (!board[r][c].hasMine) {
            c++;
            if (c >= cols) { c = 0; r++; }
            if (r >= rows) throw new Error('No mine cell found');
        }
        const result = revealCell(board, r, c);
        expect(result.updatedGrid[r][c].revealed).to.be.true;
        expect(result.hitMine).to.be.true;
    });

    it('should not reveal a flagged cell', () => {
        cycleFlag(board, 2, 2); // flag (2,2) — safe zone, so it's not a mine
        const result = revealCell(board, 2, 2);
        expect(result.updatedGrid[2][2].revealed).to.be.false;
    });

    it('should cycle: empty → flag → questioned → empty', () => {
        const cell = board[0][0];

        // empty → flag
        const r1 = cycleFlag(board, cell.row, cell.col);
        expect(r1.flagged).to.be.true;
        expect(r1.questioned).to.be.false;
        expect(board[cell.row][cell.col].flagged).to.be.true;

        // flag → ?
        const r2 = cycleFlag(board, cell.row, cell.col);
        expect(r2.flagged).to.be.false;
        expect(r2.questioned).to.be.true;
        expect(board[cell.row][cell.col].questioned).to.be.true;

        // ? → empty
        const r3 = cycleFlag(board, cell.row, cell.col);
        expect(r3.flagged).to.be.false;
        expect(r3.questioned).to.be.false;
        expect(board[cell.row][cell.col].flagged).to.be.false;
        expect(board[cell.row][cell.col].questioned).to.be.false;
    });

    it('should not cycle a revealed cell', () => {
        revealCell(board, 2, 2);
        const r = cycleFlag(board, 2, 2);
        expect(r.flagged).to.be.false;
        expect(r.questioned).to.be.false;
    });

    it('should chord-reveal neighbors when flag count matches cell number', () => {
        // Build a controlled 3x3 board: center is 1, one mine at (0,0)
        const g = generateEmptyBoard(3, 3);
        g[0][0].hasMine = true;
        // Recalculate minesAround
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (g[r][c].hasMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const nr = r + i; const nc = c + j;
                        if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3 && g[nr][nc].hasMine) count++;
                    }
                }
                g[r][c].minesAround = count;
            }
        }
        // Reveal center
        g[1][1].revealed = true;
        // Flag the mine
        g[0][0].flagged = true;
        // Chord on center (minesAround=1, 1 flag adjacent)
        const result = chordReveal(g, 1, 1);
        expect(result.hitMine).to.be.false;
        expect(result.revealedCells.length).to.be.greaterThan(0);
    });

    it('should check win condition correctly for a partial board', () => {
        const totalSafeCells = (rows * cols) - mines;
        expect(checkWinCondition(board, totalSafeCells)).to.be.false;
    });

    it('should check win condition when all safe cells are revealed', () => {
        const totalSafeCells = (rows * cols) - mines;
        const testGrid: Cell[][] = JSON.parse(JSON.stringify(board));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!testGrid[r][c].hasMine) testGrid[r][c].revealed = true;
            }
        }
        expect(checkWinCondition(testGrid, totalSafeCells)).to.be.true;
    });

    it('should return false when only some safe cells are revealed', () => {
        const totalSafeCells = (rows * cols) - mines;
        const testGrid: Cell[][] = JSON.parse(JSON.stringify(board));
        let revealed = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!testGrid[r][c].hasMine && revealed < Math.floor(totalSafeCells / 2)) {
                    testGrid[r][c].revealed = true;
                    revealed++;
                }
            }
        }
        expect(checkWinCondition(testGrid, totalSafeCells)).to.be.false;
    });
});
