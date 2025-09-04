namespace BingoTodo.Features.Boards.Services;

using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Statistics.Models;
using BingoTodo.Features.Statistics.Services;
using BingoTodo.Features.Users.Models;
using BingoTodo.Features.Users.Services;
using MongoDB.Driver;
using Achievements = Statistics.Models.Achievements;

public class BoardSaveService(
    BoardDataService boardDataService,
    UserService userService,
    GlobalStatisticsService statisticsService,
    TimeProvider timeProvider
)
{
    /// <summary>
    /// Creates the board, creates the user if doesn't exist
    /// and updates both the global and user statistics
    /// </summary>
    public async Task<string> CreateAsync(
        BoardPOST request,
        Common.Models.User user,
        CancellationToken cancellationToken
    )
    {
        var board = MapPostPayloadToDBModel(request, user.Id, timeProvider);
        await boardDataService.CreateAsync(board, cancellationToken);
        await UpdateCreationStatistics(user, board, cancellationToken);

        return board.Id;
    }

    /// <summary>
    /// Updates the board (excluding the Cells) if the DB state differs
    /// and updates both the global and user statistics if there was an update
    /// </summary>
    /// <returns>
    /// null or "conflict" if LastChangedAt isn't the same in the DB as in the board
    /// </returns>
    public async Task<string?> UpdateExcludingCellsAsync(
        string id,
        BoardMongo board,
        BoardPUT payload,
        DateTime originalLastChangedDate,
        CancellationToken cancellationToken
    )
    {
        var analyticsEvent = MapCreatePayloadAndGetEvent(board, payload, timeProvider);

        var result = await boardDataService.UpdateAsync(
            id,
            board,
            originalLastChangedDate,
            cancellationToken
        );

        if (result.MatchedCount == 0)
        {
            return "conflict"; // it might be deleted as well, but then a retry will tell the user that
        }

        await UpdateStatistics(analyticsEvent, board, cancellationToken);

        return null;
    }

    /// <summary>
    /// Updates only the Cells in the board if the given indexes are not checked yet.
    /// Updates both the global and user statistics if there was an update.
    /// </summary>
    /// <returns>
    /// null or "conflict" if LastChangedAt isn't the same in the DB as in the board
    /// </returns>
    public async Task<string?> UpdateCellsAsync(
        string id,
        BoardMongo board,
        int?[] indexes,
        CancellationToken cancellationToken
    )
    {
        var updateDate = timeProvider.GetUtcNow().UtcDateTime;
        var originalLastChangedDate = board.LastChangedAtUtc;
        var didUpdate = UpdateCells(board, indexes, updateDate);
        if (!didUpdate)
        {
            return null;
        }

        board.LastChangedAtUtc = updateDate;
        var didComplete = SetCompletedDateIfApplicable(board, updateDate);

        var result = await boardDataService.UpdateAsync(
            id,
            board,
            originalLastChangedDate,
            cancellationToken
        );

        if (result.MatchedCount == 0)
        {
            return "conflict"; // it might be deleted as well, but then a retry will tell the user that
        }

        var analyticsEvent = BoardAnalyticsEvent.CellCheck;
        if (didComplete)
        {
            // csharpier-ignore
            analyticsEvent =
                board.TodoGame.CompletedAtUtc != null
                && board.TraditionalGame.CompletedAtUtc != null
                    ? BoardAnalyticsEvent.CompletedTodoAfterTraditional
                    : board.TodoGame.CompletedAtUtc != null
                        ? BoardAnalyticsEvent.CompletedTodo
                        : BoardAnalyticsEvent.CompletedTraditional;
        }

        await UpdateStatistics(analyticsEvent, board, cancellationToken);

        return null;
    }

    /// <summary>
    /// Removes the given board and updates the global statistics
    /// </summary>
    public async Task RemoveAsync(string id, CancellationToken cancellationToken)
    {
        var board = await boardDataService.GetAsync(id);
        if (board != null)
        {
            await boardDataService.RemoveAsync(id, cancellationToken);
            var update = UpdateDefinitionBuilderForStatistics.GetDeletedGameStatisticsUpdate(
                [board],
                true
            );
            await statisticsService.Update(update, cancellationToken);
        }
    }

    /// <summary>
    /// Removes all boards of the user, the user and updates the global statistics
    /// </summary>
    public async Task RemoveAllAsync(Guid userId, CancellationToken cancellationToken)
    {
        var boards = await boardDataService.GetAllAsync(userId);
        if (boards.Count != 0)
        {
            await boardDataService.RemoveAllAsync(userId, cancellationToken);
        }

        var update = UpdateDefinitionBuilderForStatistics.GetDeletedGameStatisticsUpdate(
            [.. boards],
            false
        );
        await statisticsService.Update(update, cancellationToken);
        await userService.RemoveAsync(userId, cancellationToken);
    }

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

    private static BoardMongo MapPostPayloadToDBModel(
        BoardPOST request,
        Guid userId,
        TimeProvider timeProvider
    )
    {
        var createDate = timeProvider.GetUtcNow().UtcDateTime;

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
            CreatedBy = userId,
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

        return board;
    }

    private static BoardAnalyticsEvent? MapCreatePayloadAndGetEvent(
        BoardMongo board,
        BoardPUT payload,
        TimeProvider timeProvider
    )
    {
        var updateDate = timeProvider.GetUtcNow().UtcDateTime;
        BoardAnalyticsEvent? analyticsEvent = null;
        if (board.GameMode != payload.GameMode)
        {
            if (board.TraditionalGame.CompletedAtUtc is not null)
            {
                analyticsEvent =
                    payload.GameMode == GameMode.traditional
                        ? BoardAnalyticsEvent.FromTodoToTraditionalCompleted
                    : payload.GameMode == GameMode.todo
                        ? BoardAnalyticsEvent.FromTraditionalCompletedToTodoInProgress
                    : analyticsEvent;
            }
            else
            {
                analyticsEvent =
                    payload.GameMode == GameMode.traditional
                        ? BoardAnalyticsEvent.FromTodoToTraditionalInProgress
                    : payload.GameMode == GameMode.todo
                        ? BoardAnalyticsEvent.FromTraditionalToTodoInProgress
                    : analyticsEvent;
            }
        }
        CalculateUpdateFields(board, payload.GameMode, updateDate);

        if (
            analyticsEvent == BoardAnalyticsEvent.FromTodoToTraditionalInProgress
            && board.TraditionalGame.CompletedAtUtc is not null
        )
        {
            analyticsEvent = BoardAnalyticsEvent.FromTodoToTraditionalCompletes;
        }

        board.TraditionalGame.CompletionDeadlineUtc = payload.TraditionalGame.CompletionDeadlineUtc;
        board.TodoGame.CompletionDeadlineUtc = payload.TodoGame.CompletionDeadlineUtc;
        board.TraditionalGame.CompletionReward = payload.TraditionalGame.CompletionReward;
        board.TodoGame.CompletionReward = payload.TodoGame.CompletionReward;
        board.Name = payload.Name;
        board.GameMode = payload.GameMode;
        board.Visibility = payload.Visibility;

        board.LastChangedAtUtc = updateDate;

        return analyticsEvent;
    }

    private static bool SetCompletedDateIfApplicable(BoardMongo board, DateTime updateDate)
    {
        var allCellsChecked = board.Cells.All(x => x.CheckedAtUtc != null);

        switch (board.GameMode)
        {
            case GameMode.traditional:
                board.TraditionalGame.CompletedAtUtc =
                    allCellsChecked || ReachedBingoService.ReachedStrike(board.Cells)
                        ? updateDate
                        : null;
                return board.TraditionalGame.CompletedAtUtc != null;
            case GameMode.todo:
                board.TodoGame.CompletedAtUtc = allCellsChecked ? updateDate : null;
                return board.TodoGame.CompletedAtUtc != null;
        }
        return false;
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

    /// <summary>
    /// Updates both the global and user statistics
    /// and creates the user if it doesn't exist
    /// </summary>
    private async Task UpdateCreationStatistics(
        Common.Models.User user,
        BoardMongo board,
        CancellationToken cancellationToken
    )
    {
        var userUpdate = UpdateDefinitionBuilderForStatistics.AddStatisticsToUserUpdate(
            new UpdateDefinitionBuilder<User>().Set(x => x.Id, user.Id),
            BoardAnalyticsEvent.CreatedBoard,
            board
        );
        var userInDbBeforeUpdate = await userService.CreateOrUpdateAsync(
            userUpdate,
            new()
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
            },
            cancellationToken
        );

        var update = UpdateDefinitionBuilderForStatistics.GetStatisticsUpdate(
            userInDbBeforeUpdate is null
                ? BoardAnalyticsEvent.CreatedBoardWithUserRegistration
                : BoardAnalyticsEvent.CreatedBoard,
            board
        );

        if (update is not null)
        {
            await statisticsService.Update(update, cancellationToken);
        }
    }

    /// <summary>
    /// Updates both the global and user statistics
    /// </summary>
    private async Task UpdateStatistics(
        BoardAnalyticsEvent? analyticsEvent,
        BoardMongo board,
        CancellationToken cancellationToken
    )
    {
        var user = await userService.GetAsync(board.CreatedBy);
        if (user is null)
        {
            return;
        }

        Achievements? achievements = null;
        if (user.Achievements.ReachedAll is false)
        {
            achievements = UpdateDefinitionBuilderForAchievements.MapAchievements(
                analyticsEvent,
                board,
                user.Achievements,
                timeProvider
            );
        }

        if (analyticsEvent != null)
        {
            var update = UpdateDefinitionBuilderForStatistics.GetStatisticsUpdate(
                (BoardAnalyticsEvent)analyticsEvent,
                board
            );

            if (achievements is not null)
            {
                update = UpdateDefinitionBuilderForAchievements.UpdateAchievementsInStatistics(
                    update,
                    achievements
                );
            }

            if (update is not null)
            {
                await statisticsService.Update(update, cancellationToken);
            }

            var userUpdate = UpdateDefinitionBuilderForStatistics.UpdateUserStatistics(
                (BoardAnalyticsEvent)analyticsEvent,
                board
            );

            if (achievements is not null)
            {
                userUpdate = UpdateDefinitionBuilderForAchievements.SetAchievementsForUser(
                    userUpdate,
                    achievements,
                    board.LastChangedAtUtc,
                    board.CreatedBy
                );
            }

            if (userUpdate != null)
            {
                await userService.UpdateAsync(board.CreatedBy, userUpdate, cancellationToken);
            }
        }
    }
}
