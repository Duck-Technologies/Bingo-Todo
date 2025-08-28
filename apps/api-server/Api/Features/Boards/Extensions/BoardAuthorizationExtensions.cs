namespace BingoTodo.Features.Boards.Extensions;

using System.Security.Claims;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards.Models;

public static class BoardAuthorizationExtensions
{
    public static bool? UserEligibleToView(
        this ClaimsPrincipal claimsPrincipal,
        BoardMongo? board,
        out bool? result
    )
    {
        if (board is null)
        {
            result = null;
            return null;
        }

        if (
            board.CreatedBy != claimsPrincipal.ExtractUser()?.Id
            && board.Visibility != Visibility.@public
        )
        {
            result = false;
            return false;
        }

        result = true;
        return true;
    }

    public static bool? UserEligibleToProceed(
        this ClaimsPrincipal claimsPrincipal,
        BoardMongo? board,
        out bool? result
    )
    {
        if (board is null)
        {
            result = null;
            return null;
        }

        if (board.CreatedBy != claimsPrincipal.ExtractUser()?.Id)
        {
            result = false;
            return false;
        }

        result = true;
        return true;
    }
}
