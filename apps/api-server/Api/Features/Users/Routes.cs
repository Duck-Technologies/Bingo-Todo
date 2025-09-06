namespace BingoTodo.Features.Users;

public static class Routes
{
    public static void RegisterUsersRoutes(this WebApplication app)
    {
        var userEndpoints = app.MapGroup("/users")
            .WithTags("User")
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .RequireAuthorization();

        Unregister.Map(userEndpoints);
        GetUserById.Map(userEndpoints);
    }
}
