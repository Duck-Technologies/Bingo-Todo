namespace BingoTodo.Features.Boards.Services;

using BingoTodo.Features.Boards.Models;

public static class ReachedBingoService
{
    private static Dictionary<int, int[][]> rowPatterns = new()
    {
        {
            9,
            [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8],
            ]
        },
        {
            16,
            [
                [0, 1, 2, 3],
                [4, 5, 6, 7],
                [8, 9, 10, 11],
                [12, 13, 14, 15],
            ]
        },
        {
            25,
            [
                [0, 1, 2, 3, 4],
                [5, 6, 7, 8, 9],
                [10, 11, 12, 13, 14],
                [15, 16, 17, 18, 19],
                [20, 21, 22, 23, 24],
            ]
        },
    };

    private static Dictionary<int, int[][]> colPatterns = new()
    {
        {
            9,
            [
                [0, 3, 6],
                [2, 5, 8],
                [1, 4, 7],
            ]
        },
        {
            16,
            [
                [0, 4, 8, 12],
                [3, 7, 11, 15],
                [2, 6, 10, 14],
                [1, 5, 9, 13],
            ]
        },
        {
            25,
            [
                [0, 5, 10, 15, 20],
                [4, 9, 14, 19, 24],
                [3, 8, 13, 18, 23],
                [2, 7, 12, 17, 22],
                [1, 6, 11, 16, 21],
            ]
        },
    };

    private static Dictionary<int, int[][]> diagonalPatterns = new()
    {
        {
            9,
            [
                [0, 4, 8],
                [2, 4, 6],
            ]
        },
        {
            16,
            [
                [0, 5, 10, 15],
                [3, 6, 9, 12],
            ]
        },
        {
            25,
            [
                [0, 6, 12, 18, 24],
                [4, 8, 12, 16, 20],
            ]
        },
    };

    public static bool ReachedStrike(BoardCellGET[] cells)
    {
        return ReachedStrikeInDiagonal(cells)
            || ReachedStrikeInRow(cells)
            || ReachedStrikeInColumn(cells);
    }

    private static bool ReachedStrikeInColumn(BoardCellGET[] cells)
    {
        return ReachedPattern(cells, colPatterns);
    }

    private static bool ReachedStrikeInRow(BoardCellGET[] cells)
    {
        return ReachedPattern(cells, rowPatterns);
    }

    private static bool ReachedStrikeInDiagonal(BoardCellGET[] cells)
    {
        return ReachedPattern(cells, diagonalPatterns);
    }

    private static bool ReachedPattern(BoardCellGET[] cells, Dictionary<int, int[][]> patterns)
    {
        int[][]? checkAgainst = null;
        switch (cells.Length)
        {
            case 9:
                checkAgainst = patterns[9];
                break;
            case 16:
                checkAgainst = patterns[16];
                break;
            case 25:
                checkAgainst = patterns[25];
                break;
        }

        if (checkAgainst is null)
        {
            throw new Exception("Pattern is only set up for 9, 16 and 25 cells.");
        }
        foreach (var pattern in checkAgainst)
        {
            if (pattern.All(i => cells[i].CheckedAtUtc != null))
            {
                return true;
            }
        }

        return false;
    }
}
