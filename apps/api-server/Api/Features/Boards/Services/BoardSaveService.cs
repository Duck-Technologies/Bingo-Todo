namespace BingoTodo.Features.Boards.Services;

using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Users.Services;

public class BoardSaveService(BoardDataService dataService, UserService userService)
{
    public async Task<string> CreateAsync(
        BoardPOST request,
        Common.Models.User user,
        CancellationToken token
    )
    {
        var createDate = DateTime.Now;

        var board = new BoardMongo
        {
            Name = request.Name?.Trim() ?? null,
            CreatedAtUtc = createDate,
            LastChangedAtUtc = createDate,
            GameMode = request.GameMode,
            Visibility = request.Visibility,
            Cells =
            [
                .. request.Cells.Select(x => new BoardCellGET
                {
                    Name = x.Name.Trim(),
                    CheckedAtUtc = null,
                }),
            ],
            CreatedBy = user.Id,
        };

        if (request.CompletionDeadlineUtc != null || request.CompletionReward != null)
        {
            if (board.GameMode == GameMode.todo)
            {
                board.TodoGame.CompletionDeadlineUtc = request.CompletionDeadlineUtc;
                board.TodoGame.CompletionReward = request.CompletionReward?.Trim();
            }

            if (board.GameMode == GameMode.traditional)
            {
                board.TraditionalGame.CompletionDeadlineUtc = request.CompletionDeadlineUtc;
                board.TraditionalGame.CompletionReward = request.CompletionReward?.Trim();
            }
        }

        await dataService.CreateAsync(board, token);

        var boardSize =
            board.Cells.Length == 9 ? 3
            : board.Cells.Length == 16 ? 4
            : 5;

        await userService.CreateOrUpdateAsync(
            new Users.Models.User
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Statistics = new()
                {
                    Board3x3 = new() { Created = boardSize == 3 ? 1 : 0 },
                    Board4x4 = new() { Created = boardSize == 4 ? 1 : 0 },
                    Board5x5 = new() { Created = boardSize == 5 ? 1 : 0 },
                },
            },
            token
        );
        return board.Id;
    }

    public async Task UpdateExcludingCellsAsync(
        string id,
        BoardMongo board,
        BoardPUT payload,
        CancellationToken cancellationToken
    )
    {
        var updateDate = DateTime.Now;
        CalculateUpdateFields(board!, payload.GameMode, updateDate);

        board.TraditionalGame.CompletionDeadlineUtc = payload.TraditionalGame.CompletionDeadlineUtc;
        board.TodoGame.CompletionDeadlineUtc = payload.TodoGame.CompletionDeadlineUtc;
        board.TraditionalGame.CompletionReward = payload.TraditionalGame.CompletionReward;
        board.TodoGame.CompletionReward = payload.TodoGame.CompletionReward;
        board.Name = payload.Name;
        board.GameMode = payload.GameMode;
        board.Visibility = payload.Visibility;

        board.LastChangedAtUtc = updateDate;

        await dataService.UpdateAsync(id, board, cancellationToken);
        // should also update user stats
    }

    public async Task UpdateCellsAsync(
        string id,
        BoardMongo board,
        int?[] indexes,
        CancellationToken cancellationToken
    )
    {
        var updateDate = DateTime.Now;
        var didUpdate = UpdateCells(board!, indexes, updateDate);
        if (!didUpdate)
        {
            return;
        }

        board!.LastChangedAtUtc = updateDate;
        SetCompletedDateIfApplicable(board, updateDate);

        await dataService.UpdateAsync(id, board, cancellationToken);
        // should also update user stats
    }

    public async Task RemoveAsync(string id, CancellationToken cancellationToken) =>
        await dataService.RemoveAsync(id, cancellationToken);

    private static void CalculateUpdateFields(
        BoardMongo board,
        GameMode gameMode,
        DateTime updateDate
    )
    {
        if (board.GameMode != gameMode)
        {
            board.SwitchedToTodoAfterCompleteDateUtc =
                gameMode == GameMode.todo ? updateDate : null;

            if (
                gameMode == GameMode.traditional
                && board.TraditionalGame.CompletedAtUtc is null
                && ReachedBingoService.ReachedStrike(board.Cells)
            )
            {
                board.TraditionalGame.CompletedAtUtc = updateDate;
                board.TraditionalGame.CompletedByGameModeSwitch = true;
            }
        }
    }

    private static void SetCompletedDateIfApplicable(BoardMongo board, DateTime updateDate)
    {
        var allCellsChecked = board.Cells.All(x => x.CheckedAtUtc != null);

        switch (board.GameMode)
        {
            case GameMode.traditional:
                board.TraditionalGame.CompletedAtUtc =
                    allCellsChecked || ReachedBingoService.ReachedStrike(board.Cells)
                        ? updateDate
                        : null;
                break;
            case GameMode.todo:
                board.TodoGame.CompletedAtUtc = allCellsChecked ? updateDate : null;
                break;
        }
    }

    private static bool UpdateCells(BoardMongo board, int?[] indexes, DateTime updateDate)
    {
        var didUpdate = false;

#pragma warning disable CS8629 // Nullable value type may be null.
        foreach (int idx in indexes.Where(i => i is not null && i < board.Cells.Length && i >= 0))
        {
            if (board.Cells[idx].CheckedAtUtc == null)
            {
                board.Cells[idx].CheckedAtUtc = updateDate;
                didUpdate = true;
            }
        }
#pragma warning restore CS8629 // Nullable value type may be null.

        return didUpdate;
    }
}
