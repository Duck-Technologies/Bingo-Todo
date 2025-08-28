namespace BingoTodo.UnitTests;

using System.Net;
using BingoTodo.Features.Boards.Models;
using BingoTodo.UnitTests.Helpers;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

class SuccessResponse
{
    public string? Id { get; set; }
}

public sealed class BoardApiTests(WebAppFixture webAppFixture) : IClassFixture<WebAppFixture>
{
    private readonly WebApplicationFactory<Program> app = webAppFixture.TestServerClient;

    [Theory]
    [InlineData(9)]
    [InlineData(16)]
    [InlineData(25)]
    public async Task BoardCreation_DefaultSuccess(int cellCount)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        // Act
        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(new BoardPOST { Cells = cells });

        // Assert
        Assert.NotNull(id);
        Assert.Equal(id?.Length, 24);
    }

    [Theory]
    [InlineData(GameMode.todo, Visibility.@public)]
    [InlineData(GameMode.traditional, Visibility.unlisted)]
    public async Task BoardCreation_AndLoadSuccess(GameMode gameMode, Visibility visibility)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        var startDate = DateTime.UtcNow;
        Array.Fill(cells, new BoardCellPOST { Name = "a" });
        var request = new BoardPOST
        {
            Name = "Test",
            Visibility = visibility,
            GameMode = gameMode,
            Cells = cells,
            CompletionDeadlineUtc = DateTime.MaxValue,
            CompletionReward = "reward",
        };

        // Act
        var id = await client.CreateBoardSuccess(request);
        var loadResponse = await client.LoadBoardSuccess(id!);

        // Assert
        Assert.NotNull(loadResponse);
        if (id != null && loadResponse != null)
        {
            Assert.Equal(9, loadResponse.Cells.Count(x => x.Name == "a"));
            Assert.EquivalentWithExclusions(
                new BoardGET
                {
                    Id = id,
                    Name = request.Name,
                    CreatedBy = Guid.Empty,
                    GameMode = request.GameMode,
                    Visibility = request.Visibility,
                    SwitchedToTodoAfterCompleteDateUtc = null,
                    TraditionalGame =
                        gameMode == GameMode.todo
                            ? new()
                            : new()
                            {
                                CompletionReward = request.CompletionReward,
                                CompletionDeadlineUtc = request.CompletionDeadlineUtc,
                            },
                    TodoGame =
                        gameMode == GameMode.traditional
                            ? new()
                            : new()
                            {
                                CompletionReward = request.CompletionReward,
                                CompletionDeadlineUtc = request.CompletionDeadlineUtc,
                            },
                },
                loadResponse,
                ["Cells", "CreatedAtUtc", "LastChangedAtUtc"]
            );
            Assert.Equal(loadResponse.CreatedAtUtc, loadResponse.LastChangedAtUtc);
            Assert.Equal(startDate, loadResponse.CreatedAtUtc, TimeSpan.FromSeconds(1));
        }
    }

    [Fact]
    public async Task BoardDeleteSuccess()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(new BoardPOST { Cells = cells });

        var loadResponse = await client.LoadBoardSuccess(id!);

        Assert.NotNull(loadResponse);

        // Act
        await client.DeleteBoardSuccess(id!);

        // Assert
        var reload = await client.LoadBoard(id!);

        Assert.False(reload.IsSuccessStatusCode);
        Assert.Equal(HttpStatusCode.NotFound, reload.StatusCode);
    }

    [Fact]
    public async Task BoardUpdate_Success()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(new BoardPOST { Cells = cells });

        var loadResponse = await client.LoadBoardSuccess(id!);
        var request = new BoardPUT
        {
            Name = "test",
            Visibility = Visibility.unlisted,
            GameMode = GameMode.traditional,
            TraditionalGame = new()
            {
                CompletionReward = "reward",
                CompletionDeadlineUtc = DateTime.MaxValue,
            },
        };
        Assert.Null(loadResponse?.Name);
        Assert.Null(loadResponse?.TraditionalGame.CompletionReward);
        Assert.Null(loadResponse?.TraditionalGame.CompletionDeadlineUtc);

        // Act
        await client.UpdateBoardSuccess(id!, request);

        // Assert
        var reload = await client.LoadBoardSuccess(id!);

        Assert.Equivalent(loadResponse?.Cells, reload?.Cells);

        Assert.EquivalentWithExclusions(
            new BoardGET
            {
                Id = id!,
                Name = request.Name,
                CreatedBy = Guid.Empty,
                GameMode = request.GameMode,
                Visibility = request.Visibility,
                SwitchedToTodoAfterCompleteDateUtc = null,
                TraditionalGame = new()
                {
                    CompletionReward = request.TraditionalGame.CompletionReward,
                    CompletionDeadlineUtc = request.TraditionalGame.CompletionDeadlineUtc,
                },
                TodoGame = new(),
            },
            reload,
            ["Cells", "CreatedAtUtc", "LastChangedAtUtc"]
        );

        Assert.NotEqual(loadResponse?.LastChangedAtUtc, reload?.LastChangedAtUtc);
    }

    [Theory]
    [InlineData(9, 3)]
    [InlineData(16, 4)]
    [InlineData(25, 5)]
    public async Task BoardCellCheck_SuccessWithTraditionalStrike(int cellCount, int checkFirstX)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        var request = Enumerable.Range(0, checkFirstX).ToArray();

        // Act
        await client.CheckCells(id!, request);

        // Assert
        var loadResponse = await client.LoadBoardSuccess(id!);

        Assert.NotNull(loadResponse?.TraditionalGame.CompletedAtUtc);

        foreach (var idx in request)
        {
            Assert.NotNull(loadResponse?.Cells[idx].CheckedAtUtc);
        }

        Assert.Equal(checkFirstX, loadResponse?.Cells.Count(c => c.CheckedAtUtc != null));
    }

    [Theory]
    [InlineData(9)]
    [InlineData(16)]
    [InlineData(25)]
    public async Task BoardUpdate_TraditionalGameCompletesWithUpdate(int cellCount)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        var request = Enumerable.Range(0, 8).ToArray();
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

        Assert.NotNull(loadResponse?.TraditionalGame.CompletedAtUtc);
        Assert.True(loadResponse?.TraditionalGame.CompletedByGameModeSwitch);

        // Deadline and reward can be updated one last time
        Assert.Equal(DateTime.MaxValue, loadResponse?.TraditionalGame.CompletionDeadlineUtc);
        Assert.Equal("reward", loadResponse?.TraditionalGame.CompletionReward);
    }

    [Fact]
    public async Task BoardUpdate_SwitchedToTodoDateSetting()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        await client.CheckCells(id!, [0, 1, 2]);

        var traditionalBoard = await client.LoadBoardSuccess(id!);

        // Act
        await client.UpdateBoardSuccess(id!, new BoardPUT { GameMode = GameMode.todo });
        var todoBoard = await client.LoadBoardSuccess(id!);

        await client.UpdateBoardSuccess(id!, new BoardPUT { GameMode = GameMode.traditional });
        var traditionalBoardAgain = await client.LoadBoardSuccess(id!);

        await client.UpdateBoardSuccess(id!, new BoardPUT { GameMode = GameMode.todo });
        var todoBoardBeforeCheck = await client.LoadBoardSuccess(id!);

        Thread.Sleep(10);
        await client.CheckCells(id!, [3]);

        var todoBoardAfterCheck = await client.LoadBoardSuccess(id!);

        // Assert
        Assert.Null(traditionalBoard?.SwitchedToTodoAfterCompleteDateUtc);
        Assert.NotNull(todoBoard?.SwitchedToTodoAfterCompleteDateUtc);
        Assert.Null(traditionalBoardAgain?.SwitchedToTodoAfterCompleteDateUtc);
        Assert.NotNull(todoBoardBeforeCheck?.SwitchedToTodoAfterCompleteDateUtc);
        Assert.Equal(
            todoBoardAfterCheck?.SwitchedToTodoAfterCompleteDateUtc,
            todoBoardBeforeCheck?.SwitchedToTodoAfterCompleteDateUtc
        );
        Assert.Equal(
            traditionalBoard?.TraditionalGame.CompletedAtUtc,
            todoBoardAfterCheck?.TraditionalGame.CompletedAtUtc
        );
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    [InlineData(36)]
    public async Task BoardCreation_FailForIncorrectCellCount(int cellCount)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);
        var cells = new BoardCellPOST[cellCount];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        // Act
        var response = await client.CreateBoard(new BoardPOST { Cells = cells });
        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.NotNull(errors);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                { "Cells", ["Only 9, 16 and 25 cells are accepted for the board."] },
            },
            errors
        );
    }

    [Fact]
    public async Task BoardCreation_MaximumLengthErrors()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);
        var longString = "".PadLeft(201, '.');
        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = longString });
        const string errorMessage =
            "The length of 'Name' must be 200 characters or fewer. You entered 201 characters.";

        // Act
        var response = await client.CreateBoard(
            new BoardPOST
            {
                Cells = cells,
                Name = longString,
                CompletionReward = longString,
            }
        );
        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.NotNull(errors);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                { "Cells[0].Name", [errorMessage] },
                { "Cells[8].Name", [errorMessage] },
                { "Name", [errorMessage] },
                {
                    "CompletionReward",
                    [
                        "The length of 'Completion Reward' must be 200 characters or fewer. You entered 201 characters.",
                    ]
                },
            },
            errors
        );
        Assert.Equivalent(11, errors.Keys.Count);
    }

    [Fact]
    public async Task BoardUpdate_MaximumLengthErrors()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);
        var longString = "".PadLeft(201, '.');
        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id1 = await client.CreateBoardSuccess(
            new BoardPOST
            {
                GameMode = GameMode.todo,
                Cells = cells,
                CompletionReward = "a",
            }
        );

        var id2 = await client.CreateBoardSuccess(
            new BoardPOST
            {
                GameMode = GameMode.traditional,
                Cells = cells,
                CompletionReward = "a",
            }
        );

        // Act
        var response1 = await client.UpdateBoard(
            id1!,
            new BoardPUT
            {
                Name = longString,
                GameMode = GameMode.todo,
                TodoGame = new() { CompletionReward = longString },
            }
        );

        var response2 = await client.UpdateBoard(
            id2!,
            new BoardPUT
            {
                GameMode = GameMode.traditional,
                TraditionalGame = new() { CompletionReward = longString },
            }
        );
        var errors1 = await ValidationErrorParser.ParseResponseToFluentValidationError(response1);
        var errors2 = await ValidationErrorParser.ParseResponseToFluentValidationError(response2);

        // Assert
        Assert.NotNull(errors1);
        Assert.NotNull(errors2);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    "Name",
                    [
                        "The length of 'Name' must be 200 characters or fewer. You entered 201 characters.",
                    ]
                },
                {
                    "TodoGame.CompletionReward",
                    [
                        "The length of 'Todo Game Completion Reward' must be 200 characters or fewer. You entered 201 characters.",
                    ]
                },
            },
            errors1
        );
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    "TraditionalGame.CompletionReward",
                    [
                        "The length of 'Traditional Game Completion Reward' must be 200 characters or fewer. You entered 201 characters.",
                    ]
                },
            },
            errors2
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("        ")]
    public async Task BoardCreation_EmptyCellErrors(string? cellContent)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);
        var cells = new BoardCellPOST[25];
        Array.Fill(cells, new BoardCellPOST { Name = cellContent });

        // Act
        var response = await client.CreateBoard(new BoardPOST { Cells = cells });
        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.NotNull(errors);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                { "Cells[0].Name", ["'Name' must not be empty."] },
                { "Cells[24].Name", ["'Name' must not be empty."] },
            },
            errors
        );
        Assert.Equivalent(25, errors.Keys.Count);
    }

    [Fact]
    public async Task BoardCreation_NullCellErrors()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);
        var cells = new BoardCellPOST[25];

        // Act
        var response = await client.CreateBoard(new BoardPOST { Cells = cells });
        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.NotNull(errors);
        Assert.Equal(
            new Dictionary<string, string[]>() { { "Cells", ["'Cells' must not contain nulls."] } },
            errors
        );
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    public async Task BoardCreation_CompletionDeadlineUtcInPastError(int testRun)
    {
        var deadline = testRun == 0 ? DateTime.MinValue : DateTime.UtcNow;
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);
        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        // Act
        var response = await client.CreateBoard(
            new BoardPOST { Cells = cells, CompletionDeadlineUtc = deadline }
        );
        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.NotNull(errors);
        Assert.Equal(
            new Dictionary<string, string[]>()
            {
                { "CompletionDeadlineUtc", ["'Completion Deadline Utc' must be in the future."] },
            },
            errors
        );
    }

    [Fact]
    public async Task BoardCellCheck_IgnoreChecked()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(new BoardPOST { Cells = cells });

        await client.CheckCells(id!, [null, 0, 1, 2, 70]);
        var afterFirstCheck = await client.LoadBoardSuccess(id!);

        // Act
        Thread.Sleep(10);
        await client.CheckCells(id!, [null, 0, 1, 2, 70, int.MaxValue, int.MinValue]);
        var afterSecondCheck = await client.LoadBoardSuccess(id!);

        Thread.Sleep(5);
        await client.CheckCells(id!, [0, 1, 2, 3]);
        var afterThirdCheck = await client.LoadBoardSuccess(id!);

        // Assert
        Assert.Equal(afterFirstCheck?.LastChangedAtUtc, afterSecondCheck?.LastChangedAtUtc);
        Assert.Equivalent(afterFirstCheck?.Cells, afterSecondCheck?.Cells);

        Assert.NotEqual(afterSecondCheck?.LastChangedAtUtc, afterThirdCheck?.LastChangedAtUtc);

        Assert.Equivalent(afterFirstCheck?.Cells.Take(3), afterThirdCheck?.Cells.Take(3));
        Assert.NotEqual(afterFirstCheck?.Cells[4], afterThirdCheck?.Cells[4]);
    }

    [Fact]
    public async Task BoardCellCheck_BadRequestIfUpdateAfterCompletion()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        await client.CheckCells(id!, [0, 1, 2]);

        // Act
        var checkAfterComplete = await client.CheckCells(id!, [0, 1, 2]);

        await client.UpdateBoardSuccess(id!, new BoardPUT { GameMode = GameMode.todo });

        var checkAfterGameModeSwitch = await client.CheckCells(id!, [3, 4, 5, 6, 7, 8]);
        var afterLastChecked = await client.LoadBoardSuccess(id!);

        var checkAfterFinish = await client.CheckCells(id!, [3, 4, 5, 6, 7, 8]);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, checkAfterComplete.StatusCode);
        Assert.True(checkAfterGameModeSwitch.IsSuccessStatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, checkAfterFinish.StatusCode);

        Assert.Matches(
            "The board can't be updated*",
            await checkAfterComplete.Content.ReadAsStringAsync(
                TestContext.Current.CancellationToken
            )
        );
        Assert.Matches(
            "The board can't be updated",
            await checkAfterFinish.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)
        );
        Assert.NotNull(afterLastChecked?.TodoGame.CompletedAtUtc);
    }

    [Fact]
    public async Task BoardUpdate_BadRequestIfChangingCompletedGameDetails()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = GameMode.traditional,
                CompletionDeadlineUtc = DateTime.MaxValue,
                CompletionReward = "reward",
            }
        );

        await client.CheckCells(id!, [0, 1, 2]);

        await client.UpdateBoardSuccess(
            id!,
            new BoardPUT
            {
                GameMode = GameMode.todo,
                TraditionalGame = new()
                {
                    CompletionDeadlineUtc = DateTime.MaxValue,
                    CompletionReward = "reward",
                },
                TodoGame = new()
                {
                    CompletionDeadlineUtc = DateTime.MaxValue,
                    CompletionReward = "reward",
                },
            }
        );

        await client.CheckCells(id!, [3, 4, 5, 6, 7, 8]);

        // Act
        var response = await client.UpdateBoard(
            id!,
            new BoardPUT
            {
                GameMode = GameMode.todo,
                TraditionalGame = new()
                {
                    CompletionDeadlineUtc = DateTime.UtcNow.AddDays(1),
                    CompletionReward = "new reward",
                },
                TodoGame = new()
                {
                    CompletionDeadlineUtc = DateTime.UtcNow.AddDays(1),
                    CompletionReward = "new reward",
                },
            }
        );

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    "TraditionalGame.CompletionDeadlineUtc",
                    [
                        "'Completion Deadline Utc' can only be set to null for completed traditional games.",
                    ]
                },
                {
                    "TodoGame.CompletionDeadlineUtc",
                    ["'Completion Deadline Utc' can only be set to null for completed todo games."]
                },
                {
                    "TraditionalGame.CompletionReward",
                    ["'Completion Reward' can only be set to null for completed traditional games."]
                },
                {
                    "TodoGame.CompletionReward",
                    ["'Completion Reward' can only be set to null for completed todo games."]
                },
            },
            errors
        );
    }

    [Fact]
    public async Task BoardUpdate_BadRequestIfChangingTodoGameDetailsWhenCompleted()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        await client.CheckCells(id!, [0, 1, 2, 3]);

        // Act
        var response = await client.UpdateBoard(
            id!,
            new BoardPUT
            {
                GameMode = GameMode.traditional,
                TodoGame = new()
                {
                    CompletionDeadlineUtc = DateTime.MaxValue,
                    CompletionReward = "reward",
                },
            }
        );

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    "TodoGame.CompletionDeadlineUtc",
                    ["'Todo Game Completion Deadline Utc' must be empty."]
                },
                { "TodoGame.CompletionReward", ["'Todo Game Completion Reward' must be empty."] },
            },
            errors
        );
    }

    [Fact]
    public async Task BoardUpdate_BadRequestIfChangingTraditionalGameDetailsWhenCompleted()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.todo }
        );

        await client.CheckCells(id!, [0, 1, 2, 3, 4, 5, 6, 7, 8]);

        // Act
        var response = await client.UpdateBoard(
            id!,
            new BoardPUT
            {
                GameMode = GameMode.todo,
                TraditionalGame = new()
                {
                    CompletionDeadlineUtc = DateTime.MaxValue,
                    CompletionReward = "reward",
                },
            }
        );

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    "TraditionalGame.CompletionDeadlineUtc",
                    ["'Traditional Game Completion Deadline Utc' must be empty."]
                },
                {
                    "TraditionalGame.CompletionReward",
                    ["'Traditional Game Completion Reward' must be empty."]
                },
            },
            errors
        );
    }

    [Fact]
    public async Task BoardUpdate_ChangingCompletedDetailsToNullSuccess()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = GameMode.traditional,
                CompletionDeadlineUtc = DateTime.MaxValue,
                CompletionReward = "reward",
            }
        );

        await client.CheckCells(id!, [0, 1, 2]);
        await client.UpdateBoardSuccess(
            id!,
            new BoardPUT
            {
                GameMode = GameMode.todo,
                TraditionalGame = new()
                {
                    CompletionDeadlineUtc = DateTime.MaxValue,
                    CompletionReward = "reward",
                },
                TodoGame = new()
                {
                    CompletionDeadlineUtc = DateTime.MaxValue,
                    CompletionReward = "reward",
                },
            }
        );
        await client.CheckCells(id!, [3, 4, 5, 6, 7, 8]);

        var beforeUpdate = await client.LoadBoardSuccess(id!);

        // Act
        await client.UpdateBoardSuccess(
            id!,
            new BoardPUT
            {
                GameMode = GameMode.todo,
                TraditionalGame = new(),
                TodoGame = new(),
            }
        );

        var updatedBoard = await client.LoadBoardSuccess(id!);

        // Assert
        Assert.NotNull(beforeUpdate?.TraditionalGame.CompletionReward);
        Assert.NotNull(beforeUpdate?.TraditionalGame.CompletionDeadlineUtc);
        Assert.NotNull(beforeUpdate?.TodoGame.CompletionReward);
        Assert.NotNull(beforeUpdate?.TodoGame.CompletionDeadlineUtc);

        Assert.Null(updatedBoard?.TraditionalGame.CompletionReward);
        Assert.Null(updatedBoard?.TraditionalGame.CompletionDeadlineUtc);
        Assert.Null(updatedBoard?.TodoGame.CompletionReward);
        Assert.Null(updatedBoard?.TodoGame.CompletionDeadlineUtc);
    }

    [Theory]
    [InlineData(GameMode.todo)]
    [InlineData(GameMode.traditional)]
    public async Task BoardUpdate_OnlyValidateDeadlineIfChanged(GameMode gameMode)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = gameMode,
                CompletionDeadlineUtc = DateTime.Now.AddMilliseconds(300),
            }
        );

        var saved = await client.LoadBoardSuccess(id!);
#pragma warning disable CS8629 // Nullable value type may be null.
        var savedDeadline =
            gameMode == GameMode.todo
                ? (DateTime)saved!.TodoGame.CompletionDeadlineUtc
                : (DateTime)saved!.TraditionalGame.CompletionDeadlineUtc;
#pragma warning restore CS8629 // Nullable value type may be null.

        Thread.Sleep(300);

        // Act
        var gameDetail = new GameDetailPUT()
        {
            CompletionDeadlineUtc = savedDeadline.AddMicroseconds(1), // a bit extreme, but proves the point
        };
        var response = await client.UpdateBoard(
            id!,
            new BoardPUT
            {
                GameMode = gameMode,
                Name = null,
                TraditionalGame = gameMode == GameMode.traditional ? gameDetail : new(),
                TodoGame = gameMode == GameMode.todo ? gameDetail : new(),
            }
        );

        gameDetail.CompletionDeadlineUtc = savedDeadline;
        await client.UpdateBoardSuccess(
            id!,
            new BoardPUT
            {
                GameMode = gameMode,
                Name = "new",
                TraditionalGame = gameMode == GameMode.traditional ? gameDetail : new(),
                TodoGame = gameMode == GameMode.todo ? gameDetail : new(),
            }
        );

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    (gameMode == GameMode.traditional ? "TraditionalGame" : "TodoGame")
                        + ".CompletionDeadlineUtc",
                    [
                        "'"
                            + (gameMode == GameMode.traditional ? "Traditional" : "Todo")
                            + " Game Completion Deadline Utc' must be in the future.",
                    ]
                },
            },
            errors
        );
    }

    [Fact]
    public async Task BoardUpdate_ChangingGameModeBackToTraditionalForbidden()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        await client.CheckCells(id!, [0, 1, 2]);
        await client.UpdateBoardSuccess(id!, new BoardPUT { GameMode = GameMode.todo });
        await client.CheckCells(id!, [3]);

        // Act
        var response = await client.UpdateBoard(
            id!,
            new BoardPUT { GameMode = GameMode.traditional }
        );

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                {
                    "GameMode",
                    [
                        "'Game Mode' can't be switched to 'traditional' as the board was already completed in 'traditional' mode and a cell was checked in 'todo' mode.",
                    ]
                },
            },
            errors
        );
    }

    [Fact]
    public async Task BoardUpdate_ChangingGameModeWhenCompletedForbidden()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        await client.CheckCells(id!, [0, 1, 2, 3, 4, 5, 6, 7, 8]);

        // Act
        var response = await client.UpdateBoard(id!, new BoardPUT { GameMode = GameMode.todo });

        var errors = await ValidationErrorParser.ParseResponseToFluentValidationError(response);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equivalent(
            new Dictionary<string, string[]>()
            {
                { "GameMode", ["'Game Mode' can't be changed once all cells are checked."] },
            },
            errors
        );
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public async Task NullBodyShouldReturnBadRequest(int testcase)
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
#pragma warning disable CS8600 // Converting null literal or possible null value to non-nullable type.
        var request =
            testcase == 0 ? client.CreateBoard(null)
            : testcase == 1 ? client.UpdateBoard("123", null)
            : client.CheckCells("123", (int?[])null);
#pragma warning restore CS8600 // Converting null literal or possible null value to non-nullable type.
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.

        var response = await request;

        var responseText = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("no body was provided", responseText);
    }

    [Fact]
    public async Task UpdateBoard_IsPossibleToSwitchGameModeBeforeCompletion()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        await client.CheckCells(id!, [0, 2, 4, 5, 7]);

        // Act
        await client.UpdateBoardSuccess(id!, new BoardPUT { GameMode = GameMode.todo });
        await client.UpdateBoardSuccess(id!, new BoardPUT { GameMode = GameMode.traditional });
    }

    [Fact]
    public async Task DeletedBoardShouldResultInNotFound()
    {
        var client = new ApiClient(app.CreateClient(), TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST { Cells = cells, GameMode = GameMode.traditional }
        );

        await client.DeleteBoardSuccess(id!);

        // Act
        var deleteResponse = await client.DeleteBoard(id!);
        var loadResponse = await client.LoadBoard(id!);
        var updateResponse = await client.UpdateBoard(id!, new BoardPUT());
        var checkBoardResponse = await client.CheckCells(id!, [1]);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, loadResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, checkBoardResponse.StatusCode);
    }

    [Fact]
    public async Task OnlyOwnerShouldBeAbleToPerformActionsTests()
    {
        var httpClient = app.CreateClient();
        var client = new ApiClient(httpClient, TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });
        httpClient.DefaultRequestHeaders.Add("UserId", Guid.Empty.ToString());

        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = GameMode.traditional,
                Visibility = Visibility.@public,
            }
        );

        httpClient.DefaultRequestHeaders.Remove("UserId");
        httpClient.DefaultRequestHeaders.Add("UserId", Guid.NewGuid().ToString());
        await client.LoadBoardSuccess(id!);

        // Act
        var deleteResponse = await client.DeleteBoard(id!);
        var updateResponse = await client.UpdateBoard(id!, new BoardPUT());
        var checkBoardResponse = await client.CheckCells(id!, [1]);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, updateResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, checkBoardResponse.StatusCode);
    }

    [Fact]
    public async Task LoadBoard_UnlistedBoardAuthorization()
    {
        var httpClient = app.CreateClient();
        var client = new ApiClient(httpClient, TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        httpClient.DefaultRequestHeaders.Add("UserId", Guid.Empty.ToString());
        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = GameMode.traditional,
                Visibility = Visibility.unlisted,
            }
        );

        httpClient.DefaultRequestHeaders.Remove("UserId");
        httpClient.DefaultRequestHeaders.Add("UserId", Guid.NewGuid().ToString());

        // Act
        var loadBoardResponse = await client.LoadBoard(id!);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, loadBoardResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateBoard_IgnoreIfSameAsDatabaseState()
    {
        var httpClient = app.CreateClient();
        var client = new ApiClient(httpClient, TestContext.Current.CancellationToken);

        var cells = new BoardCellPOST[9];
        Array.Fill(cells, new BoardCellPOST { Name = "a" });

        var id = await client.CreateBoardSuccess(
            new BoardPOST
            {
                Cells = cells,
                GameMode = GameMode.traditional,
                Visibility = Visibility.unlisted,
            }
        );

        var payload = new BoardPUT
        {
            GameMode = GameMode.traditional,
            Visibility = Visibility.unlisted,
            Name = "New name",
        };

        // Act
        await client.UpdateBoardSuccess(id!, payload);
        var updated = await client.LoadBoardSuccess(id!);

        Thread.Sleep(20);
        await client.UpdateBoardSuccess(id!, payload);
        var updated2 = await client.LoadBoardSuccess(id!);

        payload.Name = null;
        await client.UpdateBoardSuccess(id!, payload);
        var updated3 = await client.LoadBoardSuccess(id!);

        // Assert
        Assert.Equal(updated!.LastChangedAtUtc, updated2!.LastChangedAtUtc);
        Assert.NotEqual(updated!.LastChangedAtUtc, updated3!.LastChangedAtUtc);
    }
}
