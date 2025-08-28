namespace BingoTodo.Features.Boards.CustomValidations;

using FluentValidation;
using MongoDB.Bson;

public record IdParam(string Id);

public class IdParamValidator : AbstractValidator<IdParam>
{
    public IdParamValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .Must(x => ObjectId.TryParse(x, out ObjectId _) == true)
            .WithMessage("Id param must be a 24 character hex string.");
    }
}
