namespace BingoTodo.IntegrationTests;

using System.Net.Http.Json;
using System.Text.Json;
using BingoTodo.Features.Boards.CustomValidations;
using BingoTodo.Features.Boards.Models;
using BingoTodo.IntegrationTests.Helpers;
using Xunit;

[TestCaseOrderer(typeof(PriorityOrderer))]
public class ApiTests(ClientFixture clientFixture) : IClassFixture<ClientFixture>
{
    readonly ClientFixture clientFixture = clientFixture;
    private readonly string? BoardId = clientFixture.BoardId;
    private readonly DateTime? Deadline = clientFixture.Deadline;
    public readonly string ClientName = clientFixture.ClientName;
    private JsonSerializerOptions AsPascalCase = new() { PropertyNamingPolicy = null };

    [Fact]
    public async Task IsAvailable()
    {
        var result = await clientFixture.api.GetForAppAsync<JsonDocument>(
            ClientName,
            options =>
            {
                options.RelativePath = "openapi/v1.json";
            },
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreationBadRequest()
    {
        // Act
        var res = await clientFixture.api.CallApiForAppAsync(
            ClientName,
            options =>
            {
                options.HttpMethod = HttpMethod.Post.ToString();
                options.RelativePath = "/boards";
            },
            JsonContent.Create(
                new BoardPOST
                {
                    Visibility = Visibility.unlisted,
                    GameMode = GameMode.traditional,
                    Cells = [],
                    CompletionReward = "traditional reward",
                },
                options: AsPascalCase
            ),
            TestContext.Current.CancellationToken
        );

        // Assert
        Assert.False(res.IsSuccessStatusCode);

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(res);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                { "Cells", ["Only 9, 16 and 25 cells are accepted for the board."] },
            },
            errors
        );
    }

    [Fact, TestPriority(1)]
    public async Task Creation()
    {
        var cellsPost = new BoardCellPOST[25];
        Array.Fill(cellsPost, new BoardCellPOST { Name = "a" });

        var deadline = DateTime.UtcNow.AddHours(1);
        // DB is not saving nanoseconds
        deadline = deadline.AddTicks(-deadline.Ticks % TimeSpan.TicksPerSecond);
        clientFixture.Deadline = deadline;

        // Act
        clientFixture.BoardId = (
            await clientFixture.api.PostForAppAsync<BoardPOST, IdParam>(
                ClientName,
                new BoardPOST
                {
                    Visibility = Visibility.unlisted,
                    GameMode = GameMode.traditional,
                    Cells = cellsPost,
                    CompletionReward = "traditional reward",
                    CompletionDeadlineUtc = deadline,
                },
                options =>
                {
                    options.RelativePath = "/boards";
                },
                TestContext.Current.CancellationToken
            )
        )?.Id;

        // Assert
        Assert.NotNull(clientFixture.BoardId);
    }

    [Fact, TestPriority(2)]
    public async Task CreatedBoardCanBeLoaded()
    {
        if (BoardId is null)
        {
            Assert.Fail();
        }

        var cellsGet = new BoardCellGET[25];
        Array.Fill(cellsGet, new BoardCellGET { Name = "a", CheckedAtUtc = null });

        // Act
        var createdBoard = await clientFixture.api.GetForAppAsync<BoardGET>(
            ClientName,
            options =>
            {
                options.RelativePath = $"/boards/{BoardId}";
            },
            TestContext.Current.CancellationToken
        );

        // Assert
        Assert.EquivalentWithExclusions(
            new BoardGET
            {
                Id = BoardId,
                Name = null,
                Cells = cellsGet,
                Visibility = Visibility.unlisted,
                GameMode = GameMode.traditional,
                TodoGame = new(),
                TraditionalGame = new()
                {
                    CompletionReward = "traditional reward",
                    CompletionDeadlineUtc = Deadline,
                    CompletedAtUtc = null,
                    CompletedByGameModeSwitch = false,
                },
                SwitchedToTodoAfterCompleteDateUtc = null,
            },
            createdBoard,
            ["CreatedBy", "CreatedAtUtc", "LastChangedAtUtc"]
        );
    }

    [Fact, TestPriority(10)]
    public async Task CanFinishTraditionalBoard()
    {
        if (BoardId is null)
        {
            Assert.Fail();
        }

        // reach bingo
        var bingoReachedAfter = DateTime.UtcNow;
        // Act
        await clientFixture.api.PostForAppAsync<int[], JsonDocument>(
            ClientName,
            [0, 1, 2, 3, 4],
            options =>
            {
                options.RelativePath = $"/boards/{BoardId}/CheckCells";
            },
            TestContext.Current.CancellationToken
        );

        var completedBoardTraditional = await clientFixture.api.GetForAppAsync<BoardGET>(
            ClientName,
            options =>
            {
                options.RelativePath = $"/boards/{BoardId}";
            },
            TestContext.Current.CancellationToken
        );

        // Assert
        Assert.NotNull(completedBoardTraditional?.TraditionalGame.CompletedAtUtc);
        if (completedBoardTraditional.TraditionalGame.CompletedAtUtc is not null)
        {
            Assert.Equal(
                bingoReachedAfter,
                (DateTime)completedBoardTraditional.TraditionalGame.CompletedAtUtc,
                TimeSpan.FromSeconds(3)
            );
        }
    }

    [Fact, TestPriority(19)]
    public async Task UpdateBadRequest()
    {
        if (BoardId is null)
        {
            Assert.Fail();
        }

        // Act
        var res = await clientFixture.api.CallApiForAppAsync(
            ClientName,
            options =>
            {
                options.HttpMethod = HttpMethod.Put.ToString();
                options.RelativePath = $"/boards/{BoardId}";
            },
            JsonContent.Create(new BoardPUT { Name = "".PadLeft(201, '.') }, options: AsPascalCase),
            TestContext.Current.CancellationToken
        );

        // Assert
        Assert.False(res.IsSuccessStatusCode);

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(res);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    "Name",
                    [
                        "The length of 'Name' must be 200 characters or fewer. You entered 201 characters.",
                    ]
                },
            },
            errors
        );
    }

    [Fact, TestPriority(20)]
    public async Task CanBeUpdated()
    {
        if (BoardId is null)
        {
            Assert.Fail();
        }

        await clientFixture.api.PutForAppAsync<BoardPUT, JsonDocument>(
            ClientName,
            new BoardPUT
            {
                Name = "continued",
                Visibility = Visibility.unlisted,
                GameMode = GameMode.todo,
                TodoGame = new()
                {
                    CompletionReward = "todo reward",
                    CompletionDeadlineUtc = Deadline,
                },
                TraditionalGame = new()
                {
                    CompletionReward = "traditional reward",
                    CompletionDeadlineUtc = Deadline,
                },
            },
            options =>
            {
                options.RelativePath = $"/boards/{BoardId}";
            },
            TestContext.Current.CancellationToken
        );
    }

    [Fact, TestPriority(30)]
    public async Task FinishAndCheckCompletedState()
    {
        if (BoardId is null)
        {
            Assert.Fail();
        }

        var cellsGet = new BoardCellGET[25];
        Array.Fill(cellsGet, new BoardCellGET { Name = "a", CheckedAtUtc = null });
        var completedAfter = DateTime.UtcNow;

        // Act
        await clientFixture.api.PostForAppAsync<int[], JsonDocument>(
            ClientName,
            [.. Enumerable.Range(5, 25)],
            options =>
            {
                options.RelativePath = $"/boards/{BoardId}/CheckCells";
            },
            TestContext.Current.CancellationToken
        );

        var completedBoardTodo = await clientFixture.api.GetForAppAsync<BoardGET>(
            ClientName,
            options =>
            {
                options.RelativePath = $"/boards/{BoardId}";
            },
            TestContext.Current.CancellationToken
        );

        // Assert

        Assert.NotNull(completedBoardTodo?.TodoGame.CompletedAtUtc);
        if (completedBoardTodo.TodoGame.CompletedAtUtc is null)
        {
            return;
        }

        Assert.EquivalentWithExclusions(
            new BoardGET
            {
                Id = BoardId,
                Name = "continued",
                Cells = cellsGet,
                Visibility = Visibility.unlisted,
                GameMode = GameMode.todo,
                TodoGame = new()
                {
                    CompletionReward = "todo reward",
                    CompletionDeadlineUtc = Deadline,
                },
                TraditionalGame = new()
                {
                    CompletionReward = "traditional reward",
                    CompletionDeadlineUtc = Deadline,
                    CompletedByGameModeSwitch = false,
                },
                SwitchedToTodoAfterCompleteDateUtc = null,
            },
            completedBoardTodo,
            [
                "CreatedBy",
                "CreatedAtUtc",
                "LastChangedAtUtc",
                "Cells",
                "TraditionalGame.CompletedAtUtc",
                "TodoGame.CompletedAtUtc",
                "SwitchedToTodoAfterCompleteDateUtc",
            ]
        );

        Assert.Equal(
            completedAfter,
            (DateTime)completedBoardTodo.TodoGame.CompletedAtUtc,
            TimeSpan.FromSeconds(3)
        );

        Assert.True(
            completedBoardTodo?.SwitchedToTodoAfterCompleteDateUtc is not null
                && completedBoardTodo.SwitchedToTodoAfterCompleteDateUtc
                    > completedBoardTodo.TraditionalGame.CompletedAtUtc
                && completedBoardTodo.SwitchedToTodoAfterCompleteDateUtc
                    < completedBoardTodo.TodoGame.CompletedAtUtc
        );

        Assert.Equal(
            5,
            completedBoardTodo.Cells.Count(c =>
                c.CheckedAtUtc == completedBoardTodo.TraditionalGame.CompletedAtUtc
            )
        );

        Assert.Equal(
            20,
            completedBoardTodo.Cells.Count(c =>
                c.CheckedAtUtc == completedBoardTodo.TodoGame.CompletedAtUtc
            )
        );

        Assert.Equal(
            completedBoardTodo.LastChangedAtUtc,
            completedBoardTodo.TodoGame.CompletedAtUtc
        );
    }

    [Fact, TestPriority(40)]
    public async Task CanBeDeleted()
    {
        if (BoardId is null)
        {
            Assert.Fail();
        }

        await clientFixture.api.DeleteForAppAsync<JsonDocument?>(
            ClientName,
            null,
            options =>
            {
                options.RelativePath = $"/boards/{BoardId}";
            },
            TestContext.Current.CancellationToken
        );

        var ex = await Assert.ThrowsAsync<HttpRequestException>(() =>
            clientFixture.api.GetForAppAsync<BoardGET>(
                ClientName,
                options =>
                {
                    options.RelativePath = $"/boards/{BoardId}";
                },
                TestContext.Current.CancellationToken
            )
        );

        Assert.Contains("404", ex.Message);
        clientFixture.BoardId = null;
    }
}
