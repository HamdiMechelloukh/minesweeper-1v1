import { expect } from 'chai';
import { generateBoard, revealCell, flagCell, checkWinCondition } from '../src/game/minesweeper';
import { Cell } from '../src/types/game';

describe('Minesweeper Game Logic', () => {
    const rows = 5;
    const cols = 5;
    const mines = 5;
    let board: Cell[][];

    beforeEach(() => {
        // Use a fixed seed for deterministic board generation
        board = generateBoard(123, rows, cols, mines);
    });

    it('should generate a board with the correct dimensions and number of mines', () => {
        expect(board).to.have.length(rows);
        board.forEach(row => expect(row).to.have.length(cols));

        const totalMines = board.flat().filter(cell => cell.hasMine).length;
        expect(totalMines).to.equal(mines);
    });

    it('should reveal a cell correctly', () => {
        let revealedCell = board[0][0]; // Assuming it's not a mine for this test

        // Find a non-mine cell to reveal
        let r = 0, c = 0;
        while(board[r][c].hasMine) {
            c++;
            if (c >= cols) {
                c = 0;
                r++;
            }
            if (r >= rows) { // Should not happen with typical mine counts
                throw new Error("Could not find a non-mine cell to test revealing.");
            }
        }
        revealedCell = board[r][c];

        const result = revealCell(board, revealedCell.row, revealedCell.col);
        expect(result.updatedGrid[revealedCell.row][revealedCell.col].revealed).to.be.true;
        expect(result.hitMine).to.be.false;
        // Removed result.gameOver check as it's not part of the return type
        expect(result.revealedCount).to.be.greaterThan(0); // Should reveal at least one cell
    });

    it('should set hitMine to true if a mine is revealed', () => {
        // Find a mine cell to reveal
        let r = 0, c = 0;
        while(!board[r][c].hasMine) {
            c++;
            if (c >= cols) {
                c = 0;
                r++;
            }
            if (r >= rows) {
                throw new Error("Could not find a mine cell to test revealing.");
            }
        }
        const mineCell = board[r][c];

        const result = revealCell(board, mineCell.row, mineCell.col);
        expect(result.updatedGrid[mineCell.row][mineCell.col].revealed).to.be.true;
        expect(result.hitMine).to.be.true;
        // Removed result.gameOver check as it's not part of the return type
    });

    it('should flag and unflag a cell', () => {
        let cellToFlag = board[0][0]; // Assuming it's not a mine for this test

        // Flag the cell
        const { updatedGrid: flaggedGrid1, flagged: isFlagged1 } = flagCell(board, cellToFlag.row, cellToFlag.col);
        expect(flaggedGrid1[cellToFlag.row][cellToFlag.col].flagged).to.be.true;
        expect(isFlagged1).to.be.true;

        // Unflag the cell
        const { updatedGrid: flaggedGrid2, flagged: isFlagged2 } = flagCell(flaggedGrid1, cellToFlag.row, cellToFlag.col);
        expect(flaggedGrid2[cellToFlag.row][cellToFlag.col].flagged).to.be.false;
        expect(isFlagged2).to.be.false;
    });

    it('should not reveal a flagged cell', () => {
        let cellToFlagAndReveal = board[0][0];

        const { updatedGrid: flaggedGrid, flagged: isFlagged } = flagCell(board, cellToFlagAndReveal.row, cellToFlagAndReveal.col);
        expect(isFlagged).to.be.true;

        const result = revealCell(flaggedGrid, cellToFlagAndReveal.row, cellToFlagAndReveal.col);
        expect(result.updatedGrid[cellToFlagAndReveal.row][cellToFlagAndReveal.col].revealed).to.be.false;
    });

    it('should check win condition correctly for a partial board', () => {
        const totalSafeCells = (rows * cols) - mines;
        expect(checkWinCondition(board, totalSafeCells)).to.be.false; // Initially no win
    });

    it('should check win condition correctly when all safe cells are revealed', () => {
        const totalSafeCells = (rows * cols) - mines;
        let testGrid: Cell[][] = JSON.parse(JSON.stringify(board)); // Deep copy

        let revealedSafeCount = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!testGrid[r][c].hasMine) {
                    testGrid[r][c].revealed = true;
                    revealedSafeCount++;
                }
            }
        }
        expect(checkWinCondition(testGrid, totalSafeCells)).to.be.true;
    });

    it('should return false when only some safe cells are revealed', () => {
        const totalSafeCells = (rows * cols) - mines;
        let testGrid: Cell[][] = JSON.parse(JSON.stringify(board));

        // Reveal only half the safe cells
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
