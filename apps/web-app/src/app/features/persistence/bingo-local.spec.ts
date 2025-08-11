import { BoardCell, BoardInfo } from '../board/board';
import { BoardCalculations } from '../calculations/board-calculations';
import { calculateDateFromNow } from '../calculations/date-calculations';
import { BingoLocalStorage } from './bingo-local';

describe('BingoLocalStorage', () => {
  let calculationService: BoardCalculations;

  beforeEach(() => {
    calculationService = new BoardCalculations();
  });

  it('should calculate completion date while saving a traditional board', () => {
    const board = new BoardInfo({
      GameMode: 'traditional',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedDateUTC: null,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    const firstbingoDate = calculateDateFromNow(-10);
    board.Cells[0].CheckedDateUTC = firstbingoDate;
    board.Cells[1].CheckedDateUTC = calculateDateFromNow(-11);
    board.Cells[2].CheckedDateUTC = calculateDateFromNow(-12);
    BingoLocalStorage.updateBoard(board, calculationService);

    expect(board.TraditionalGame.CompletionDateUtc).toEqual(firstbingoDate);
    expect(board.TodoGame.CompletionDateUtc).toBeNull();
  });

  it('shouldn\'t set completion date while saving an in-progress todo board', () => {
    const board = new BoardInfo({
      GameMode: 'todo',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedDateUTC: null,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    const firstbingoDate = calculateDateFromNow(-10);
    board.Cells[0].CheckedDateUTC = firstbingoDate;
    board.Cells[1].CheckedDateUTC = calculateDateFromNow(-11);
    board.Cells[2].CheckedDateUTC = calculateDateFromNow(-12);
    BingoLocalStorage.updateBoard(board, calculationService);

    expect(board.TodoGame.CompletionDateUtc).toBeNull();
    expect(board.TraditionalGame.CompletionDateUtc).toBeNull();
  });

  it('should calculate completion date while saving a completed todo board', () => {
    const completionDate = new Date();
    const board = new BoardInfo({
      GameMode: 'todo',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedDateUTC: completionDate,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    const firstbingoDate = calculateDateFromNow(-10);
    board.Cells[0].CheckedDateUTC = firstbingoDate;
    board.Cells[1].CheckedDateUTC = calculateDateFromNow(-11);
    board.Cells[2].CheckedDateUTC = calculateDateFromNow(-12);
    BingoLocalStorage.updateBoard(board, calculationService);

    expect(board.TraditionalGame.CompletionDateUtc).toBeNull();
    expect(board.TodoGame.CompletionDateUtc).toEqual(completionDate);
  });
});
