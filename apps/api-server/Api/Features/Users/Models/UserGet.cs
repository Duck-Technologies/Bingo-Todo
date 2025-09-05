namespace BingoTodo.Features.Users.Models;

public class UserGet
{
    public Guid Id { get; set; }
    public DateTime RegisteredAt { get; set; }
    public string Name { get; set; } = "";
    public Achievements Achievements { get; set; } = new();
}
