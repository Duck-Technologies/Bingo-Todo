namespace BingoTodo.Features.Users.Models;

using BingoTodo.Features.Statistics.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public sealed class User : IBoardStatistics
{
    [BsonId]
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public bool IsValidEmail { get; set; } = false;
    public GameStatistics BoardStatistics { get; set; } = new();
    public Achievements Achievements { get; set; } = new();
}

public sealed class Achievements
{
    public DateTime? FirstCleared3x3BoardAt { get; set; } // TO-DO completion
    public DateTime? FirstCleared4x4BoardAt { get; set; } // TO-DO completion
    public DateTime? FirstCleared5x5BoardAt { get; set; } // TO-DO completion
    public DateTime? FirstBingoAtLastChance4x4At { get; set; } // 4 unchecked at the point of update with no strike
    public DateTime? FirstBingoAtLastChance5x5At { get; set; } // 5 unchecked at the point of update with no strike
    public DateTime? FirstBingoReachedAt { get; set; }
    public DateTime? FirstEarnedRewardAt { get; set; } // complete any game mode with a reward set
    public DateTime? FirstClearedBeforeDeadlineAt { get; set; } // TO-DO completion before deadline
    public DateTime? FirstClearedAfterDeadlineAt { get; set; } // TO-DO completion after deadline
    public DateTime? FirstCompleteWithGameModeSwitchAt { get; set; } // Quick win: already have a strike in TO-DO mode, switches to Traditional
}
