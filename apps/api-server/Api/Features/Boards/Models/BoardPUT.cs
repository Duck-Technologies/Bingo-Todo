namespace BingoTodo.Features.Boards.Models;

public sealed class BoardPUT
{
    public string? Name { get; set; }
    public GameMode GameMode { get; set; }
    public Visibility Visibility { get; set; }
    public GameDetailPUT TraditionalGame { get; set; } = new();
    public GameDetailPUT TodoGame { get; set; } = new();
}
