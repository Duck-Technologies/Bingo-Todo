namespace BingoTodo.Features.Boards;

using System.Security.Claims;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards.CustomValidations;
using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Boards.Services;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;

public class CreateBoard
{
    public static void Map(IEndpointRouteBuilder app) =>
        app.MapPost("/", Handle)
            .WithName("BoardCreation")
            .WithSummary("Creates a new board")
            .WithRequestValidation<BoardPOST>();

    public class RequestValidator : AbstractValidator<BoardPOST>
    {
        public RequestValidator(TimeProvider timeProvider)
        {
            RuleFor(x => x.Name).MaximumLength(200).When(x => x != null);

            RuleFor(x => x.CompletionDeadlineUtc)
                .GreaterThan(timeProvider.GetUtcNow().UtcDateTime)
                .When(x => x != null)
                .WithMessage("'{PropertyName}' must be in the future.");

            RuleFor(x => x.CompletionReward).MaximumLength(200).When(x => x != null);

            RuleFor(x => x.Cells)
                .NotEmpty()
                .Must(x => x.Length == 9 || x.Length == 16 || x.Length == 25)
                .WithMessage(x => "Only 9, 16 and 25 cells are accepted for the board.")
                .Must(x => !x.Any(x => x is null))
                .WithMessage("'Cells' must not contain nulls.");

            RuleForEach(x => x.Cells)
                .ChildRules(cell =>
                {
                    cell.RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
                });
        }
    }

    private static async Task<Results<Ok<IdParam>, UnauthorizedHttpResult>> Handle(
        BoardPOST request,
        BoardSaveService saveService,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken
    )
    {
        var user = claimsPrincipal.ExtractUser();

        if (user?.Id is null)
        {
            return TypedResults.Unauthorized(); // this shouldn't happen tbh
        }

        var id = await saveService.CreateAsync(request, user, cancellationToken);

        return TypedResults.Ok(new IdParam(id));
    }
}
