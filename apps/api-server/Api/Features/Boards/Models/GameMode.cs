namespace BingoTodo.Features.Boards.Models;

using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum GameMode
{
    todo = 0,
    traditional = 1,
}
