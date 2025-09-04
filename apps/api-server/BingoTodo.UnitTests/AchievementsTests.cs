namespace BingoTodo.UnitTests;

using BingoTodo.Features.Boards.Models;
using BingoTodo.UnitTests.Helpers;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public sealed class AchievementsTests(WebAppFixture webAppFixture)
    : IClassFixture<WebAppFixture>,
        IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> app = webAppFixture.TestServerClient;

    [Theory]
    [InlineData(9, 0)]
    [InlineData(9, -1)]
    [InlineData(9, 1)]
    [InlineData(16, 0)]
    [InlineData(16, -1)]
    [InlineData(16, 1)]
    [InlineData(25, 0)]
    [InlineData(25, -1)]
    [InlineData(25, 1)]
    public async Task TodoCompletionAchievements(int cellCount, int deadline)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var request = Enumerable.Range(0, 25).ToArray();

        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = GameMode.todo,
                CompletionDeadlineUtc =
                    deadline == 0 ? null
                    : deadline == 1 ? DateTime.MaxValue
                    : webAppFixture.TimeProvider.GetUtcNow().UtcDateTime.AddMilliseconds(200),
                CompletionReward = "something",
            }
        );

        // Act
        if (deadline == -1)
        {
            await Task.Delay(205, TestContext.Current.CancellationToken);
        }
        await client.CheckCells(id!, request);

        // and repeat to check that we are not incrementing
        var id2 = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        await client.CheckCells(id2!, request);

        // Assert
        var loadResponse = await client.LoadBoardSuccess(id!);
        var stats = await webAppFixture.StatisticsService.GetAsync();
        var user = await webAppFixture.UserService.GetAsync(webAppFixture.DefaultUserId);

        // Stats asserts
        Assert.Equal(cellCount == 9 ? 1 : 0, stats!.Achievements.FirstCleared3x3Board);
        Assert.Equal(cellCount == 16 ? 1 : 0, stats.Achievements.FirstCleared4x4Board);
        Assert.Equal(cellCount == 25 ? 1 : 0, stats.Achievements.FirstCleared5x5Board);
        Assert.Equal(1, stats.Achievements.FirstBingoReached);
        Assert.Equal(deadline == 1 ? 1 : 0, stats!.Achievements.FirstClearedBeforeDeadline);
        Assert.Equal(deadline == -1 ? 1 : 0, stats.Achievements.FirstClearedAfterDeadline);
        Assert.Equal(1, stats.Achievements.FirstEarnedReward);

        // User asserts
        Assert.Equal(
            cellCount == 9 ? loadResponse!.LastChangedAtUtc : null,
            user!.Achievements.FirstCleared3x3BoardAt
        );
        Assert.Equal(
            cellCount == 16 ? loadResponse!.LastChangedAtUtc : null,
            user.Achievements.FirstCleared4x4BoardAt
        );
        Assert.Equal(
            cellCount == 25 ? loadResponse!.LastChangedAtUtc : null,
            user.Achievements.FirstCleared5x5BoardAt
        );
        Assert.Equal(loadResponse!.LastChangedAtUtc, user.Achievements.FirstBingoReachedAt);
        Assert.Equal(
            deadline == 1 ? loadResponse!.LastChangedAtUtc : null,
            user!.Achievements.FirstClearedBeforeDeadlineAt
        );
        Assert.Equal(
            deadline == -1 ? loadResponse!.LastChangedAtUtc : null,
            user.Achievements.FirstClearedAfterDeadlineAt
        );
        Assert.Equal(loadResponse!.LastChangedAtUtc, user.Achievements.FirstEarnedRewardAt);
    }

    [Theory]
    [InlineData(16)]
    [InlineData(25)]
    public async Task FirstBingoAtLastChance(int cellCount)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        int[] request =
            cellCount == 16
                ? [0, 1, 2, 4, 6, 7, 8, 9, 11, 13, 14, 15]
                : [0, 1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23, 24];

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        // Act
        await client.CheckCells(id!, request);

        // and repeat to check that we are not incrementing
        var id2 = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        await client.CheckCells(id2!, request);

        // Assert
        var loadResponse = await client.LoadBoardSuccess(id!);
        var stats = await webAppFixture.StatisticsService.GetAsync();
        var user = await webAppFixture.UserService.GetAsync(webAppFixture.DefaultUserId);

        Assert.Equal(0, stats.Achievements.FirstBingoReached);
        Assert.Null(user.Achievements.FirstBingoReachedAt);

        if (cellCount == 16)
        {
            Assert.Equal(1, stats!.Achievements.FirstBingoAtLastChance4x4);
            Assert.Equal(
                loadResponse!.LastChangedAtUtc,
                user!.Achievements.FirstBingoAtLastChance4x4At
            );
        }

        if (cellCount == 25)
        {
            Assert.Equal(1, stats!.Achievements.FirstBingoAtLastChance5x5);
            Assert.Equal(
                loadResponse!.LastChangedAtUtc,
                user!.Achievements.FirstBingoAtLastChance5x5At
            );
        }
    }

    [Fact]
    public async Task FirstCompleteWithGameModeSwitch()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var request = Enumerable.Range(0, 8).ToArray();

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        await client.CheckCells(id!, request);

        // Act
        await client.UpdateBoardSuccess(
            id!,
            new BoardPUT
            {
                GameMode = GameMode.traditional,
                TraditionalGame = new()
                {
                    CompletionDeadlineUtc = DateTime.MaxValue,
                    CompletionReward = "reward",
                },
            }
        );

        // Assert
        var loadResponse = await client.LoadBoardSuccess(id!);
        var stats = await webAppFixture.StatisticsService.GetAsync();
        var user = await webAppFixture.UserService.GetAsync(webAppFixture.DefaultUserId);

        Assert.Equal(1, stats.Achievements.FirstCompleteWithGameModeSwitch);
        Assert.Equal(
            loadResponse.LastChangedAtUtc,
            user.Achievements.FirstCompleteWithGameModeSwitchAt
        );
    }

    public async ValueTask DisposeAsync()
    {
        await webAppFixture.StatisticsService.RemoveAsync(TestContext.Current.CancellationToken);
        await webAppFixture.UserService.RemoveAsync(
            webAppFixture.DefaultUserId,
            TestContext.Current.CancellationToken
        );
    }
}
