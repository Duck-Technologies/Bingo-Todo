namespace BingoTodo.Features.Boards.CustomValidations;

using BingoTodo.Features.Boards.Models;
using FluentValidation;

public static class ValidValueIfCompleted
{
    public static IRuleBuilderOptions<GameDetailPUT, DateTime?> IsValidValueIfCompleted(
        this IRuleBuilder<GameDetailPUT, DateTime?> ruleBuilder,
        DateTime? compareWith,
        bool isCompleted,
        GameMode gameMode
    )
    {
        return ruleBuilder
            .Must(value => value == compareWith || value is null)
            .When(gameDetails => isCompleted)
            .WithMessage(GetErrorMessage(gameMode));
    }

    public static IRuleBuilderOptions<GameDetailPUT, string?> IsValidValueIfCompleted(
        this IRuleBuilder<GameDetailPUT, string?> ruleBuilder,
        string? compareWith,
        bool isCompleted,
        GameMode gameMode
    )
    {
        return ruleBuilder
            .Must(value => value == compareWith || value is null)
            .When(gameDetails => isCompleted)
            .WithMessage(GetErrorMessage(gameMode));
    }

    private static string GetErrorMessage(GameMode gameMode)
    {
        return "'{PropertyName}' can only be set to null for completed "
            + gameMode.ToString()
            + " games.";
    }
}
