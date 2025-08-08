import { BoardCell, BoardInfo } from '../board/board';
import { BoardCalculations } from '../calculations/board-calculations';
import { calculateDateFromNow } from '../calculations/date-calculations';
import { BingoLocalStorage } from './bingo-local';

describe('BingoLocalStorage', () => {
  let calculationService: BoardCalculations;

  beforeEach(() => {
    calculationService = new BoardCalculations();
  });

  it('should calculate first bingo date and completion date while saving a traditional board', () => {
    const board: BoardInfo = {
      Name: null,
      GameMode: 'traditional',
      CompletionDateUtc: null,
      FirstBingoReachedDateUtc: null,
      CompletionDeadlineUtc: null,
      CompletionReward: null,
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
    };

    const firstbingoDate = calculateDateFromNow(-10);
    board.Cells[0].CheckedDateUTC = firstbingoDate;
    board.Cells[1].CheckedDateUTC = calculateDateFromNow(-11);
    board.Cells[2].CheckedDateUTC = calculateDateFromNow(-12);
    BingoLocalStorage.updateBoard(board, calculationService);

    expect(board.FirstBingoReachedDateUtc).toEqual(firstbingoDate);
    expect(board.CompletionDateUtc).toEqual(firstbingoDate);
  });

  it('should calculate first bingo date and completion date while saving an in-progress todo board', () => {
    const board: BoardInfo = {
      Name: null,
      GameMode: 'todo',
      CompletionDateUtc: null,
      FirstBingoReachedDateUtc: null,
      CompletionDeadlineUtc: null,
      CompletionReward: null,
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
    };

    const firstbingoDate = calculateDateFromNow(-10);
    board.Cells[0].CheckedDateUTC = firstbingoDate;
    board.Cells[1].CheckedDateUTC = calculateDateFromNow(-11);
    board.Cells[2].CheckedDateUTC = calculateDateFromNow(-12);
    BingoLocalStorage.updateBoard(board, calculationService);

    expect(board.FirstBingoReachedDateUtc).toEqual(firstbingoDate);
    expect(board.CompletionDateUtc).toBeNull;
  });

  it('should calculate first bingo date and completion date while saving a completed todo board', () => {
    const completionDate = new Date();
    const board: BoardInfo = {
      Name: null,
      GameMode: 'todo',
      CompletionDateUtc: null,
      FirstBingoReachedDateUtc: null,
      CompletionDeadlineUtc: null,
      CompletionReward: null,
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
    };

    const firstbingoDate = calculateDateFromNow(-10);
    board.Cells[0].CheckedDateUTC = firstbingoDate;
    board.Cells[1].CheckedDateUTC = calculateDateFromNow(-11);
    board.Cells[2].CheckedDateUTC = calculateDateFromNow(-12);
    BingoLocalStorage.updateBoard(board, calculationService);

    expect(board.FirstBingoReachedDateUtc).toEqual(firstbingoDate);
    expect(board.CompletionDateUtc).toEqual(completionDate);
  });
});
