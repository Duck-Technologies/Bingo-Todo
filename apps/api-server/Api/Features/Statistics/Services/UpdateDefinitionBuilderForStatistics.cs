namespace BingoTodo.Features.Statistics.Services;

using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Statistics.Models;
using BingoTodo.Features.Users.Models;
using MongoDB.Driver;

public static class UpdateDefinitionBuilderForStatistics
{
    /// <summary>
    /// Adds increments/decrements updates to the applicable BoardStatistics fields.
    /// </summary>
    public static UpdateDefinition<User> AddStatisticsToUserUpdate(
        UpdateDefinition<User> update,
        BoardAnalyticsEvent mainEvent,
        BoardMongo board
    )
    {
        var boardStatistics = GetBoardStatisticsUpdate(mainEvent, board);

        if (boardStatistics is null)
        {
            return update;
        }

        var gameStats = new GameStatistics
        {
            Board3x3 = board.Cells.Length == 9 ? boardStatistics : new(),
            Board4x4 = board.Cells.Length == 16 ? boardStatistics : new(),
            Board5x5 = board.Cells.Length == 25 ? boardStatistics : new(),
        };

        return MapBoardStatisticsToUpdate(gameStats, update, board.Cells.Length);
    }

    /// <summary>
    /// Creates an update that increments/decrements applicable BoardStatistics fields
    /// and UserRegistrations.
    /// </summary>
    public static UpdateDefinition<Statistics>? GetStatisticsUpdate(
        BoardAnalyticsEvent mainEvent,
        BoardMongo board
    )
    {
        var boardStatistics = GetBoardStatisticsUpdate(mainEvent, board);

        if (boardStatistics is null)
        {
            return null;
        }

        var statistics = new Statistics
        {
            UserRegistrations =
                mainEvent == BoardAnalyticsEvent.CreatedBoardWithUserRegistration ? 1 : 0,
            BoardStatistics = new()
            {
                Board3x3 = board.Cells.Length == 9 ? boardStatistics : new(),
                Board4x4 = board.Cells.Length == 16 ? boardStatistics : new(),
                Board5x5 = board.Cells.Length == 25 ? boardStatistics : new(),
            },
        };

        var definition = new UpdateDefinitionBuilder<Statistics>().Inc(
            x => x.UserRegistrations,
            statistics.UserRegistrations
        );

        return MapBoardStatisticsToUpdate(
            statistics.BoardStatistics,
            definition,
            board.Cells.Length
        );
    }

    /// <summary>
    /// Creates an update that increments applicable DeletedBoardStatistics fields
    /// and DeletedBoardsManually or DeletedBoardsWithUnRegistration.
    /// Reward and Deadline properties will always be 0, because they can be removed after
    /// the board completes, so they are point in time data, and can't be calculated for sure.
    /// </summary>
    public static UpdateDefinition<Statistics> GetDeletedGameStatisticsUpdate(
        BoardMongo[] boards,
        bool isManual
    )
    {
        var gameModeStatistics = new GameStatistics()
        {
            Board3x3 = new(),
            Board4x4 = new(),
            Board5x5 = new(),
        };

        foreach (var board in boards)
        {
            // It doesn't make sense to try to map over point in time stats (like deadline, reward)
            var boardStats =
                board.Cells.Length == 9 ? gameModeStatistics.Board3x3
                : board.Cells.Length == 16 ? gameModeStatistics.Board4x4
                : gameModeStatistics.Board5x5;
            boardStats.ContinuedInTodoMode +=
                board.GameMode == GameMode.todo
                && board.TraditionalGame.CompletedAtUtc != null
                && board.TodoGame.CompletedAtUtc == null
                    ? 1
                    : 0;
            boardStats.CompletedInBothModes +=
                board.TraditionalGame.CompletedAtUtc != null
                && board.TodoGame.CompletedAtUtc != null
                    ? 1
                    : 0;
            boardStats.Todo.Completed += board.TodoGame.CompletedAtUtc != null ? 1 : 0;
            boardStats.Traditional.Completed +=
                board.TraditionalGame.CompletedAtUtc != null ? 1 : 0;
            boardStats.Todo.InProgress +=
                board.TodoGame.CompletedAtUtc is null && board.GameMode == GameMode.todo ? 1 : 0;
            boardStats.Traditional.InProgress +=
                board.TraditionalGame.CompletedAtUtc is null
                && board.GameMode == GameMode.traditional
                    ? 1
                    : 0;
        }

        return MapDeletedBoardStatisticsUpdate(
            isManual ? 1 : 0,
            !isManual ? boards.Length : 0,
            gameModeStatistics
        );
    }

    /// <summary>
    /// Creates an update that increments/decrements applicable BoardStatistics fields and sets the user Id
    /// </summary>
    public static UpdateDefinition<User>? UpdateUserStatistics(
        BoardAnalyticsEvent mainEvent,
        BoardMongo board
    )
    {
        var boardStatistics = GetBoardStatisticsUpdate(mainEvent, board);

        if (boardStatistics is null)
        {
            return null;
        }

        var gameStats = new GameStatistics
        {
            Board3x3 = board.Cells.Length == 9 ? boardStatistics : new(),
            Board4x4 = board.Cells.Length == 16 ? boardStatistics : new(),
            Board5x5 = board.Cells.Length == 25 ? boardStatistics : new(),
        };

        return MapBoardStatisticsToUpdate(
            gameStats,
            new UpdateDefinitionBuilder<User>().Set(x => x.Id, board.CreatedBy),
            board.Cells.Length
        );
    }

    /// <summary>
    /// Increments, decrements or leaves properties 0 on a new BoardStatistics instance
    /// based on BoardAnalyticsEvents
    /// </summary>
    private static BoardStatistics? GetBoardStatisticsUpdate(
        BoardAnalyticsEvent mainEvent,
        BoardMongo board
    )
    {
        var boardStatistics = new BoardStatistics();

        switch (mainEvent)
        {
            case BoardAnalyticsEvent.CreatedBoard:
                boardStatistics.Todo.InProgress = board.GameMode == GameMode.todo ? 1 : 0;
                boardStatistics.Traditional.InProgress =
                    board.GameMode == GameMode.traditional ? 1 : 0;
                break;
            case BoardAnalyticsEvent.CreatedBoardWithUserRegistration:
                boardStatistics.Todo.InProgress = board.GameMode == GameMode.todo ? 1 : 0;
                boardStatistics.Traditional.InProgress =
                    board.GameMode == GameMode.traditional ? 1 : 0;
                break;
            case BoardAnalyticsEvent.CompletedTodo:
                boardStatistics.Todo.Completed = 1;
                boardStatistics.Todo.InProgress = -1;
                IncrementCompletedSnapshotFields(boardStatistics.Todo, board.TodoGame);
                break;
            case BoardAnalyticsEvent.CompletedTodoAfterTraditional:
                boardStatistics.Todo.Completed = 1;
                boardStatistics.Todo.InProgress = -1;
                boardStatistics.CompletedInBothModes = 1;
                boardStatistics.ContinuedInTodoMode = -1;
                IncrementCompletedSnapshotFields(boardStatistics.Todo, board.TodoGame);
                break;
            case BoardAnalyticsEvent.CompletedTraditional:
                boardStatistics.Traditional.Completed = 1;
                boardStatistics.Traditional.InProgress = -1;
                IncrementCompletedSnapshotFields(
                    boardStatistics.Traditional,
                    board.TraditionalGame
                );
                break;
            case BoardAnalyticsEvent.FromTodoToTraditionalCompleted:
                boardStatistics.Todo.InProgress = -1;
                boardStatistics.ContinuedInTodoMode = -1;
                break;
            case BoardAnalyticsEvent.FromTodoToTraditionalCompletes:
                boardStatistics.Traditional.Completed = 1;
                boardStatistics.Todo.InProgress = -1;
                IncrementCompletedSnapshotFields(
                    boardStatistics.Traditional,
                    board.TraditionalGame
                );
                break;
            case BoardAnalyticsEvent.FromTodoToTraditionalInProgress:
                boardStatistics.Todo.InProgress = -1;
                boardStatistics.Traditional.InProgress = 1;
                break;
            case BoardAnalyticsEvent.FromTraditionalToTodoInProgress:
                boardStatistics.Traditional.InProgress = -1;
                boardStatistics.Todo.InProgress = 1;
                break;
            case BoardAnalyticsEvent.FromTraditionalCompletedToTodoInProgress:
                boardStatistics.Todo.InProgress = 1;
                boardStatistics.ContinuedInTodoMode = 1;
                break;
            default:
                return null;
        }
        return boardStatistics;
    }

    private static GameModeStatistics IncrementCompletedSnapshotFields(
        GameModeStatistics stats,
        GameDetailGET gamedetail
    )
    {
        if (gamedetail.CompletionDeadlineUtc != null && gamedetail.CompletionReward != null)
        {
            stats.CompletedWithBothDeadlineAndReward = 1;
            return stats;
        }

        if (gamedetail.CompletionDeadlineUtc != null)
        {
            stats.CompletedWithOnlyDeadline = 1;
            return stats;
        }

        if (gamedetail.CompletionReward != null)
        {
            stats.CompletedWithOnlyReward = 1;
            return stats;
        }
        return stats;
    }

    private static UpdateDefinition<Statistics> MapDeletedBoardStatisticsUpdate(
        int manualDeleteCount,
        int autoDeleteCount,
        GameStatistics gameStatistics
    )
    {
        // csharpier-ignore
        return new UpdateDefinitionBuilder<Statistics>()
        .Inc(x => x.DeletedBoardsManually, manualDeleteCount)
        .Inc(x => x.DeletedBoardsWithUnRegistration, autoDeleteCount)

        .Inc(x => x.DeletedBoardStatistics.Board3x3.CompletedInBothModes, gameStatistics.Board3x3.CompletedInBothModes)
        .Inc(x => x.DeletedBoardStatistics.Board3x3.ContinuedInTodoMode, gameStatistics.Board3x3.ContinuedInTodoMode)
        .Inc(x => x.DeletedBoardStatistics.Board3x3.Todo.Completed, gameStatistics.Board3x3.Todo.Completed)
        .Inc(x => x.DeletedBoardStatistics.Board3x3.Todo.InProgress, gameStatistics.Board3x3.Todo.InProgress)
        .Inc(x => x.DeletedBoardStatistics.Board3x3.Traditional.Completed, gameStatistics.Board3x3.Traditional.Completed)
        .Inc(x => x.DeletedBoardStatistics.Board3x3.Traditional.InProgress, gameStatistics.Board3x3.Traditional.InProgress)

        .Inc(x => x.DeletedBoardStatistics.Board4x4.CompletedInBothModes, gameStatistics.Board4x4.CompletedInBothModes)
        .Inc(x => x.DeletedBoardStatistics.Board4x4.ContinuedInTodoMode, gameStatistics.Board4x4.ContinuedInTodoMode)
        .Inc(x => x.DeletedBoardStatistics.Board4x4.Todo.Completed, gameStatistics.Board4x4.Todo.Completed)
        .Inc(x => x.DeletedBoardStatistics.Board4x4.Todo.InProgress, gameStatistics.Board4x4.Todo.InProgress)
        .Inc(x => x.DeletedBoardStatistics.Board4x4.Traditional.Completed, gameStatistics.Board4x4.Traditional.Completed)
        .Inc(x => x.DeletedBoardStatistics.Board4x4.Traditional.InProgress, gameStatistics.Board4x4.Traditional.InProgress)

        .Inc(x => x.DeletedBoardStatistics.Board5x5.CompletedInBothModes, gameStatistics.Board5x5.CompletedInBothModes)
        .Inc(x => x.DeletedBoardStatistics.Board5x5.ContinuedInTodoMode, gameStatistics.Board5x5.ContinuedInTodoMode)
        .Inc(x => x.DeletedBoardStatistics.Board5x5.Todo.Completed, gameStatistics.Board5x5.Todo.Completed)
        .Inc(x => x.DeletedBoardStatistics.Board5x5.Todo.InProgress, gameStatistics.Board5x5.Todo.InProgress)
        .Inc(x => x.DeletedBoardStatistics.Board5x5.Traditional.Completed, gameStatistics.Board5x5.Traditional.Completed)
        .Inc(x => x.DeletedBoardStatistics.Board5x5.Traditional.InProgress, gameStatistics.Board5x5.Traditional.InProgress);
    }

    private static UpdateDefinition<T> MapBoardStatisticsToUpdate<T>(
        GameStatistics statistics,
        UpdateDefinition<T> definition,
        int cellCount
    )
        where T : IBoardStatistics
    {
        return cellCount switch
        {
            9 => definition
                .Inc(
                    x => x.BoardStatistics.Board3x3.CompletedInBothModes,
                    statistics.Board3x3.CompletedInBothModes
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.ContinuedInTodoMode,
                    statistics.Board3x3.ContinuedInTodoMode
                )
                // Completed/InProgress
                .Inc(
                    x => x.BoardStatistics.Board3x3.Todo.Completed,
                    statistics.Board3x3.Todo.Completed
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Todo.InProgress,
                    statistics.Board3x3.Todo.InProgress
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Traditional.Completed,
                    statistics.Board3x3.Traditional.Completed
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Traditional.InProgress,
                    statistics.Board3x3.Traditional.InProgress
                )
                // Reward/Deadline
                .Inc(
                    x => x.BoardStatistics.Board3x3.Todo.CompletedWithBothDeadlineAndReward,
                    statistics.Board3x3.Todo.CompletedWithBothDeadlineAndReward
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Todo.CompletedWithOnlyDeadline,
                    statistics.Board3x3.Todo.CompletedWithOnlyDeadline
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Todo.CompletedWithOnlyReward,
                    statistics.Board3x3.Todo.CompletedWithOnlyReward
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Traditional.CompletedWithBothDeadlineAndReward,
                    statistics.Board3x3.Traditional.CompletedWithBothDeadlineAndReward
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Traditional.CompletedWithOnlyDeadline,
                    statistics.Board3x3.Traditional.CompletedWithOnlyDeadline
                )
                .Inc(
                    x => x.BoardStatistics.Board3x3.Traditional.CompletedWithOnlyReward,
                    statistics.Board3x3.Traditional.CompletedWithOnlyReward
                ),
            16 => definition
                .Inc(
                    x => x.BoardStatistics.Board4x4.CompletedInBothModes,
                    statistics.Board4x4.CompletedInBothModes
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.ContinuedInTodoMode,
                    statistics.Board4x4.ContinuedInTodoMode
                )
                // Completed/InProgress
                .Inc(
                    x => x.BoardStatistics.Board4x4.Todo.Completed,
                    statistics.Board4x4.Todo.Completed
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.Todo.InProgress,
                    statistics.Board4x4.Todo.InProgress
                )
                //
                .Inc(
                    x => x.BoardStatistics.Board4x4.Traditional.Completed,
                    statistics.Board4x4.Traditional.Completed
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.Traditional.InProgress,
                    statistics.Board4x4.Traditional.InProgress
                )
                // Reward/Deadline
                .Inc(
                    x => x.BoardStatistics.Board4x4.Todo.CompletedWithBothDeadlineAndReward,
                    statistics.Board4x4.Todo.CompletedWithBothDeadlineAndReward
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.Todo.CompletedWithOnlyDeadline,
                    statistics.Board4x4.Todo.CompletedWithOnlyDeadline
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.Todo.CompletedWithOnlyReward,
                    statistics.Board4x4.Todo.CompletedWithOnlyReward
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.Traditional.CompletedWithBothDeadlineAndReward,
                    statistics.Board4x4.Traditional.CompletedWithBothDeadlineAndReward
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.Traditional.CompletedWithOnlyDeadline,
                    statistics.Board4x4.Traditional.CompletedWithOnlyDeadline
                )
                .Inc(
                    x => x.BoardStatistics.Board4x4.Traditional.CompletedWithOnlyReward,
                    statistics.Board4x4.Traditional.CompletedWithOnlyReward
                ),
            25 => definition
                .Inc(
                    x => x.BoardStatistics.Board5x5.CompletedInBothModes,
                    statistics.Board5x5.CompletedInBothModes
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.ContinuedInTodoMode,
                    statistics.Board5x5.ContinuedInTodoMode
                )
                // Completed/InProgress
                .Inc(
                    x => x.BoardStatistics.Board5x5.Todo.Completed,
                    statistics.Board5x5.Todo.Completed
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Todo.InProgress,
                    statistics.Board5x5.Todo.InProgress
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Traditional.Completed,
                    statistics.Board5x5.Traditional.Completed
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Traditional.InProgress,
                    statistics.Board5x5.Traditional.InProgress
                )
                // Reward/Deadline
                .Inc(
                    x => x.BoardStatistics.Board5x5.Todo.CompletedWithBothDeadlineAndReward,
                    statistics.Board5x5.Todo.CompletedWithBothDeadlineAndReward
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Todo.CompletedWithOnlyDeadline,
                    statistics.Board5x5.Todo.CompletedWithOnlyDeadline
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Todo.CompletedWithOnlyReward,
                    statistics.Board5x5.Todo.CompletedWithOnlyReward
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Traditional.CompletedWithBothDeadlineAndReward,
                    statistics.Board5x5.Traditional.CompletedWithBothDeadlineAndReward
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Traditional.CompletedWithOnlyDeadline,
                    statistics.Board5x5.Traditional.CompletedWithOnlyDeadline
                )
                .Inc(
                    x => x.BoardStatistics.Board5x5.Traditional.CompletedWithOnlyReward,
                    statistics.Board5x5.Traditional.CompletedWithOnlyReward
                ),
            _ => definition,
        };
    }
}
