namespace BingoTodo.Features.Statistics.Services;

using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Boards.Services;
using BingoTodo.Features.Statistics.Models;
using BingoTodo.Features.Users.Models;
using MongoDB.Driver;
using Achievements = Models.Achievements;

public static class UpdateDefinitionBuilderForAchievements
{
    public static UpdateDefinition<Statistics> UpdateAchievementsInStatistics(
        UpdateDefinition<Statistics>? update,
        Achievements achievements
    )
    {
        update ??= new UpdateDefinitionBuilder<Statistics>().Inc(x => x.DeletedBoardsManually, 0);

        if (achievements.FirstCleared3x3Board != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstCleared3x3Board,
                achievements.FirstCleared3x3Board
            );
        }
        if (achievements.FirstCleared4x4Board != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstCleared4x4Board,
                achievements.FirstCleared4x4Board
            );
        }
        if (achievements.FirstCleared5x5Board != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstCleared5x5Board,
                achievements.FirstCleared5x5Board
            );
        }
        if (achievements.FirstBingoAtLastChance4x4 != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstBingoAtLastChance4x4,
                achievements.FirstBingoAtLastChance4x4
            );
        }
        if (achievements.FirstBingoAtLastChance5x5 != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstBingoAtLastChance5x5,
                achievements.FirstBingoAtLastChance5x5
            );
        }
        if (achievements.FirstBingoReached != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstBingoReached,
                achievements.FirstBingoReached
            );
        }
        if (achievements.FirstEarnedReward != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstEarnedReward,
                achievements.FirstEarnedReward
            );
        }
        if (achievements.FirstClearedBeforeDeadline != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstClearedBeforeDeadline,
                achievements.FirstClearedBeforeDeadline
            );
        }
        if (achievements.FirstClearedAfterDeadline != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstClearedAfterDeadline,
                achievements.FirstClearedAfterDeadline
            );
        }
        if (achievements.FirstCompleteWithGameModeSwitch != 0)
        {
            update = update.Inc(
                x => x.Achievements.FirstCompleteWithGameModeSwitch,
                achievements.FirstCompleteWithGameModeSwitch
            );
        }

        return update;
    }

    public static UpdateDefinition<User> SetAchievementsForUser(
        UpdateDefinition<User>? update,
        Achievements achievements,
        DateTime dateToUse,
        Guid userId
    )
    {
        update ??= new UpdateDefinitionBuilder<User>().Set(x => x.Id, userId);

        if (achievements.FirstCleared3x3Board == 1)
        {
            update = update.Set(x => x.Achievements.FirstCleared3x3BoardAt, dateToUse);
        }
        if (achievements.FirstCleared4x4Board == 1)
        {
            update = update.Set(x => x.Achievements.FirstCleared4x4BoardAt, dateToUse);
        }
        if (achievements.FirstCleared5x5Board == 1)
        {
            update = update.Set(x => x.Achievements.FirstCleared5x5BoardAt, dateToUse);
        }
        if (achievements.FirstBingoAtLastChance4x4 == 1)
        {
            update = update.Set(x => x.Achievements.FirstBingoAtLastChance4x4At, dateToUse);
        }
        if (achievements.FirstBingoAtLastChance5x5 == 1)
        {
            update = update.Set(x => x.Achievements.FirstBingoAtLastChance5x5At, dateToUse);
        }
        if (achievements.FirstBingoReached == 1)
        {
            update = update.Set(x => x.Achievements.FirstBingoReachedAt, dateToUse);
        }
        if (achievements.FirstEarnedReward == 1)
        {
            update = update.Set(x => x.Achievements.FirstEarnedRewardAt, dateToUse);
        }
        if (achievements.FirstClearedBeforeDeadline == 1)
        {
            update = update.Set(x => x.Achievements.FirstClearedBeforeDeadlineAt, dateToUse);
        }
        if (achievements.FirstClearedAfterDeadline == 1)
        {
            update = update.Set(x => x.Achievements.FirstClearedAfterDeadlineAt, dateToUse);
        }
        if (achievements.FirstCompleteWithGameModeSwitch == 1)
        {
            update = update.Set(x => x.Achievements.FirstCompleteWithGameModeSwitchAt, dateToUse);
        }

        return update;
    }

    public static Achievements? MapAchievements(
        BoardAnalyticsEvent? mainEvent,
        BoardMongo board,
        Users.Models.Achievements achieved,
        TimeProvider timeProvider
    )
    {
        var isComplete =
            board.TraditionalGame.CompletedAtUtc != null || board.TodoGame.CompletedAtUtc != null;
        var hasStrike = ReachedBingoService.ReachedStrike(board.Cells);
        var hasReward =
            board.TraditionalGame.CompletionReward is not null
            || board.TodoGame.CompletionReward is not null;
        var completingTodo =
            mainEvent is not null
            && (
                mainEvent == BoardAnalyticsEvent.CompletedTodo
                || mainEvent == BoardAnalyticsEvent.CompletedTodoAfterTraditional
            );
        var completing =
            mainEvent is not null
            && (
                completingTodo
                || mainEvent == BoardAnalyticsEvent.CompletedTraditional
                || mainEvent == BoardAnalyticsEvent.FromTodoToTraditionalCompletes
            );
        var hasDeadline = board.TodoGame.CompletionDeadlineUtc != null;
        var beforeDeadline =
            hasDeadline && board.TodoGame.CompletionDeadlineUtc > timeProvider.GetUtcNow();

        var achievements = new Achievements
        {
            FirstCleared3x3Board =
                achieved.FirstCleared3x3BoardAt is null && completingTodo && board.Cells.Length == 9
                    ? 1
                    : 0,
            FirstCleared4x4Board =
                achieved.FirstCleared4x4BoardAt is null
                && completingTodo
                && board.Cells.Length == 16
                    ? 1
                    : 0,
            FirstCleared5x5Board =
                achieved.FirstCleared5x5BoardAt is null
                && completingTodo
                && board.Cells.Length == 25
                    ? 1
                    : 0,
            FirstBingoAtLastChance4x4 =
                achieved.FirstBingoAtLastChance4x4At is null
                && !hasStrike
                && board.Cells.Count(c => c.CheckedAtUtc is null) == 4
                    ? 1
                    : 0,
            FirstBingoAtLastChance5x5 =
                achieved.FirstBingoAtLastChance5x5At is null
                && !hasStrike
                && board.Cells.Count(c => c.CheckedAtUtc is null) == 5
                    ? 1
                    : 0,
            FirstBingoReached = achieved.FirstBingoReachedAt is null && hasStrike ? 1 : 0,
            FirstEarnedReward =
                achieved.FirstEarnedRewardAt is null && completing && hasReward ? 1 : 0,
            FirstClearedBeforeDeadline =
                achieved.FirstClearedBeforeDeadlineAt is null
                && completingTodo
                && hasDeadline
                && beforeDeadline
                    ? 1
                    : 0,
            FirstClearedAfterDeadline =
                achieved.FirstClearedAfterDeadlineAt is null
                && completingTodo
                && hasDeadline
                && !beforeDeadline
                    ? 1
                    : 0,
            FirstCompleteWithGameModeSwitch =
                achieved.FirstCompleteWithGameModeSwitchAt is null
                && mainEvent is not null
                && mainEvent == BoardAnalyticsEvent.FromTodoToTraditionalCompletes
                    ? 1
                    : 0,
        };

        return achievements.ReachedAll ? null : achievements;
    }

    public static Achievements MapAchievementsForDelete(Users.Models.Achievements achieved)
    {
        return new Achievements
        {
            FirstCleared3x3Board = achieved.FirstCleared3x3BoardAt is null ? 0 : -1,
            FirstCleared4x4Board = achieved.FirstCleared4x4BoardAt is null ? 0 : -1,
            FirstCleared5x5Board = achieved.FirstCleared5x5BoardAt is null ? 0 : -1,
            FirstBingoAtLastChance4x4 = achieved.FirstBingoAtLastChance4x4At is null ? 0 : -1,
            FirstBingoAtLastChance5x5 = achieved.FirstBingoAtLastChance5x5At is null ? 0 : -1,
            FirstBingoReached = achieved.FirstBingoReachedAt is null ? 0 : -1,
            FirstEarnedReward = achieved.FirstEarnedRewardAt is null ? 0 : -1,
            FirstClearedBeforeDeadline = achieved.FirstClearedBeforeDeadlineAt is null ? 0 : -1,
            FirstClearedAfterDeadline = achieved.FirstClearedAfterDeadlineAt is null ? 0 : -1,
            FirstCompleteWithGameModeSwitch = achieved.FirstCompleteWithGameModeSwitchAt is null
                ? 0
                : -1,
        };
    }
}
