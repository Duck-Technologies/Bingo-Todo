namespace BingoTodo.UnitTests;

using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Statistics.Models;
using BingoTodo.UnitTests.Helpers;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Xunit.Internal;

public sealed class StatisticsTests(WebAppFixture webAppFixture) : IClassFixture<WebAppFixture>
{
    private readonly WebApplicationFactory<Program> app = webAppFixture.TestServerClient;

    [Theory]
    [InlineData(GameMode.todo, 9)]
    [InlineData(GameMode.traditional, 9)]
    [InlineData(GameMode.todo, 16)]
    [InlineData(GameMode.traditional, 16)]
    [InlineData(GameMode.todo, 25)]
    [InlineData(GameMode.traditional, 25)]
    public async Task CreatingBoardPutsItemToInprogress(GameMode gameMode, int cellCount)
    {
        //AnalyticsEvents.CreatedBoard
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var expected = new BoardStatistics
        {
            Todo = new() { InProgress = gameMode == GameMode.todo ? 1 : 0 },
            Traditional = new() { InProgress = gameMode == GameMode.traditional ? 1 : 0 },
        };

        // Act
        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = gameMode }
        );
        await client.DeleteBoardSuccess(id);

        // Assert
        var stats = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics
            {
                UserRegistrations = 1,
                DeletedBoardsManually = 1,
                BoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected : new(),
                    Board4x4 = cellCount == 16 ? expected : new(),
                    Board5x5 = cellCount == 25 ? expected : new(),
                },
                DeletedBoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected : new(),
                    Board4x4 = cellCount == 16 ? expected : new(),
                    Board5x5 = cellCount == 25 ? expected : new(),
                },
            },
            stats,
            ["Id", "Year"]
        );

        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }

    // csharpier-ignore
    public static TheoryData<GameMode, int, bool, bool> CompletingBoardUpdatesCompletedFieldsData
    {
        get
        {
            var data = new TheoryData<GameMode, int, bool, bool>();
            (new GameMode[] { GameMode.todo, GameMode.traditional }).ForEach(gameMode =>
                (new int[] { 9, 16, 25 }).ForEach(cellCount =>
                {
                    data.Add(gameMode, cellCount, true, false);
                    data.Add(gameMode, cellCount, false, true);
                    data.Add(gameMode, cellCount, true, true);
                    data.Add(gameMode, cellCount, false, false);
                })
            );
            return data;
        }
    }

    [Theory]
    [MemberData(nameof(CompletingBoardUpdatesCompletedFieldsData))]
    public async Task CompletingBoardUpdatesCompletedFields(
        GameMode gameMode,
        int cellCount,
        bool withReward,
        bool withDeadline
    )
    {
        //AnalyticsEvents.CompletedTodo && AnalyticsEvents.CompletedTraditional
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var expectedG = new GameModeStatistics
        {
            Completed = 1,
            CompletedWithBothDeadlineAndReward = withReward && withDeadline ? 1 : 0,
            CompletedWithOnlyDeadline = withDeadline && !withReward ? 1 : 0,
            CompletedWithOnlyReward = withReward && !withDeadline ? 1 : 0,
        };
        var expected = new BoardStatistics
        {
            Todo = gameMode == GameMode.todo ? expectedG : new(),
            Traditional = gameMode == GameMode.traditional ? expectedG : new(),
        };
        var expectedDeleted = new BoardStatistics
        {
            Todo = gameMode == GameMode.todo ? new() { Completed = 1 } : new(),
            Traditional = gameMode == GameMode.traditional ? new() { Completed = 1 } : new(),
        };

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = gameMode,
                CompletionDeadlineUtc = withDeadline ? DateTime.MaxValue : null,
                CompletionReward = withReward ? "reward" : null,
            }
        );

        // Act
        await client.CheckCells(id!, Enumerable.Range(0, 25).ToArray());
        await client.DeleteBoardSuccess(id!);

        // Assert
        var stats = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics
            {
                DeletedBoardsManually = 1,
                BoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected : new(),
                    Board4x4 = cellCount == 16 ? expected : new(),
                    Board5x5 = cellCount == 25 ? expected : new(),
                },
                DeletedBoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expectedDeleted : new(),
                    Board4x4 = cellCount == 16 ? expectedDeleted : new(),
                    Board5x5 = cellCount == 25 ? expectedDeleted : new(),
                },
            },
            stats,
            ["Id", "Year", "UserRegistrations"]
        );

        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }

    [Theory]
    [InlineData(GameMode.todo, 9)]
    [InlineData(GameMode.traditional, 9)]
    [InlineData(GameMode.todo, 16)]
    [InlineData(GameMode.traditional, 16)]
    [InlineData(GameMode.todo, 25)]
    [InlineData(GameMode.traditional, 25)]
    public async Task SwitchingGameModeTransfersInProgress(GameMode gameMode, int cellCount)
    {
        //AnalyticsEvents.FromTodoToTraditionalInProgress && AnalyticsEvents.FromTraditionalToTodoInProgress

        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var expected = new BoardStatistics
        {
            Todo = new() { InProgress = gameMode == GameMode.traditional ? 1 : 0 },
            Traditional = new() { InProgress = gameMode == GameMode.todo ? 1 : 0 },
        };

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = gameMode }
        );

        // Act
        await client.UpdateBoardSuccess(
            id!,
            new() { GameMode = gameMode == GameMode.todo ? GameMode.traditional : GameMode.todo }
        );
        await client.DeleteBoardSuccess(id!);

        // Assert
        var stats = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics
            {
                DeletedBoardsManually = 1,
                BoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected : new(),
                    Board4x4 = cellCount == 16 ? expected : new(),
                    Board5x5 = cellCount == 25 ? expected : new(),
                },
                DeletedBoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected : new(),
                    Board4x4 = cellCount == 16 ? expected : new(),
                    Board5x5 = cellCount == 25 ? expected : new(),
                },
            },
            stats,
            ["Id", "Year", "UserRegistrations"]
        );

        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }

    [Theory]
    [InlineData(9)]
    [InlineData(16)]
    [InlineData(25)]
    public async Task SwitchingToTraditionalWhichCompletes(int cellCount)
    {
        //AnalyticsEvents.FromTodoToTraditionalCompletes
        // && AnalyticsEvents.FromTraditionalCompletedToTodoInProgress
        // && AnalyticsEvents.FromTodoToTraditionalCompleted
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var expected1 = new BoardStatistics
        {
            Todo = new() { InProgress = 0 },
            Traditional = new() { Completed = 1, InProgress = 0 },
        };

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        await client.CheckCells(id, Enumerable.Range(0, 8).ToArray());

        // Act
        await client.UpdateBoardSuccess(id, new() { GameMode = GameMode.traditional });

        // Assert
        var stats = await webAppFixture.StatisticsService.GetAsync();

        Assert.EquivalentWithExclusions(
            new Statistics
            {
                BoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected1 : new(),
                    Board4x4 = cellCount == 16 ? expected1 : new(),
                    Board5x5 = cellCount == 25 ? expected1 : new(),
                },
            },
            stats,
            ["Id", "Year", "UserRegistrations"]
        );

        // Then switching game mode
        await client.UpdateBoardSuccess(id, new() { GameMode = GameMode.todo });

        // Then switching back results in the same stats as we had before the 2nd switch
        // (important thing is that Completed is not decreased with each switch)
        await client.UpdateBoardSuccess(id, new() { GameMode = GameMode.traditional });
        var stats2 = await webAppFixture.StatisticsService.GetAsync();
        Assert.Equivalent(stats, stats2);

        await client.DeleteBoardSuccess(id);
        var stats3 = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics
            {
                BoardStatistics = stats.BoardStatistics,
                DeletedBoardsManually = 1,
                DeletedBoardStatistics = stats.BoardStatistics,
            },
            stats3,
            ["Id", "Year", "UserRegistrations"]
        );

        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }

    [Theory]
    [InlineData(9)]
    [InlineData(16)]
    [InlineData(25)]
    public async Task SwitchingToTodoFromCompletedTraditional(int cellCount)
    {
        //AnalyticsEvents.FromTodoToTraditionalCompletes
        // && AnalyticsEvents.FromTraditionalCompletedToTodoInProgress
        // && AnalyticsEvents.FromTodoToTraditionalCompleted
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var expected = new BoardStatistics
        {
            Todo = new() { InProgress = 1 },
            Traditional = new() { Completed = 1, InProgress = 0 },
            ContinuedInTodoMode = 1,
        };

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        await client.CheckCells(id, Enumerable.Range(0, 8).ToArray());
        await client.UpdateBoardSuccess(id, new() { GameMode = GameMode.traditional });

        // Act
        await client.UpdateBoardSuccess(id, new() { GameMode = GameMode.todo });
        await client.DeleteBoardSuccess(id);

        // Assert
        var stats = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics
            {
                DeletedBoardsManually = 1,
                BoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected : new(),
                    Board4x4 = cellCount == 16 ? expected : new(),
                    Board5x5 = cellCount == 25 ? expected : new(),
                },
                DeletedBoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected : new(),
                    Board4x4 = cellCount == 16 ? expected : new(),
                    Board5x5 = cellCount == 25 ? expected : new(),
                },
            },
            stats,
            ["Id", "Year", "UserRegistrations"]
        );

        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }

    [Theory]
    [InlineData(9)]
    [InlineData(16)]
    [InlineData(25)]
    public async Task CompleteInBothModes(int cellCount)
    {
        //AnalyticsEvents.CompletedTraditional
        // && AnalyticsEvents.CompletedTodoAfterTraditional
        // && AnalyticsEvents.FromTraditionalCompletedToTodoInProgress
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var expected1 = new BoardStatistics
        {
            Todo = new() { InProgress = 1 },
            Traditional = new() { Completed = 1, InProgress = 0 },
            ContinuedInTodoMode = 1,
        };

        var expected2 = new BoardStatistics
        {
            Todo = new() { Completed = 1 },
            Traditional = new() { Completed = 1, InProgress = 0 },
            CompletedInBothModes = 1,
        };

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        // Act
        await client.CheckCells(id, Enumerable.Range(0, 8).ToArray());
        await client.UpdateBoardSuccess(id, new() { GameMode = GameMode.todo });

        // Assert
        var stats = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics
            {
                BoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected1 : new(),
                    Board4x4 = cellCount == 16 ? expected1 : new(),
                    Board5x5 = cellCount == 25 ? expected1 : new(),
                },
            },
            stats,
            ["Id", "Year", "UserRegistrations"]
        );

        // Check all cells
        await client.CheckCells(id, Enumerable.Range(0, 25).ToArray());
        await client.DeleteBoardSuccess(id);

        var stats2 = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics
            {
                DeletedBoardsManually = 1,
                BoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected2 : new(),
                    Board4x4 = cellCount == 16 ? expected2 : new(),
                    Board5x5 = cellCount == 25 ? expected2 : new(),
                },
                DeletedBoardStatistics = new()
                {
                    Board3x3 = cellCount == 9 ? expected2 : new(),
                    Board4x4 = cellCount == 16 ? expected2 : new(),
                    Board5x5 = cellCount == 25 ? expected2 : new(),
                },
            },
            stats2,
            ["Id", "Year", "UserRegistrations"]
        );

        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }

    [Fact]
    public async Task WhenTheUserCreatesMultipleBoardsItShouldntIncrementUserRegistrations()
    {
        //AnalyticsEvents.CreatedBoard
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        // Act
        await client.CreateBoardSuccess(new BoardPOST { Cells = cells });
        await client.CreateBoardSuccess(new BoardPOST { Cells = cells });
        await client.CreateBoardSuccess(new BoardPOST { Cells = cells });

        // Assert
        var stats = await webAppFixture.StatisticsService.GetAsync();
        Assert.EquivalentWithExclusions(
            new Statistics { UserRegistrations = 1 },
            stats,
            ["Id", "Year", "BoardStatistics"]
        );

        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }
}
