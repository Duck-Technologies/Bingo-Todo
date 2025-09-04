namespace BingoTodo.Features.Statistics.Models;

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public interface IBoardStatistics
{
    public GameStatistics BoardStatistics { get; set; }
}

public sealed class Statistics : IBoardStatistics
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public int Year { get; set; }
    public int UserRegistrations { get; set; }
    public int UserUnRegistrations { get; set; }
    public int DeletedBoardsManually { get; set; }
    public int DeletedBoardsWithUnRegistration { get; set; }
    public GameStatistics BoardStatistics { get; set; } = new(); // includes DeletedBoardStatistics
    public GameStatistics DeletedBoardStatistics { get; set; } = new(); // point in time data like deadline, reward can't be calculated in this
}

public sealed class BoardStatistics
{
    public int CompletedInBothModes { get; set; }

    // incremented instantly once game mode is switched if already finished in traditional, doesn't include CompletedInBothModes
    public int ContinuedInTodoMode { get; set; }
    public GameModeStatistics Todo { get; set; } = new();
    public GameModeStatistics Traditional { get; set; } = new();
}

public sealed class GameModeStatistics
{
    public int Completed { get; set; }
    public int CompletedWithOnlyDeadline { get; set; }
    public int CompletedWithOnlyReward { get; set; }
    public int CompletedWithBothDeadlineAndReward { get; set; }
    public int InProgress { get; set; }
}

public sealed class GameStatistics
{
    public BoardStatistics Board3x3 { get; set; } = new();
    public BoardStatistics Board4x4 { get; set; } = new();
    public BoardStatistics Board5x5 { get; set; } = new();
}

// These are the equivalent as User Achievements, but there they are dates
public sealed class Achievements
{
    public int FirstCleared3x3Board { get; set; } // CompletedTodo|CompletedTodoAfterTraditional
    public int FirstCleared4x4Board { get; set; } // CompletedTodo|CompletedTodoAfterTraditional
    public int FirstCleared5x5Board { get; set; } // CompletedTodo|CompletedTodoAfterTraditional
    public int FirstBingoAtLastChance4x4 { get; set; } // 4 unchecked at the point of update with no strike CellCheck
    public int FirstBingoAtLastChance5x5 { get; set; } // 5 unchecked at the point of update with no strike CellCheck
    public int FirstBingoReached { get; set; } // CellCheck with a strike
    public int FirstEarnedReward { get; set; } // CompletedTodo|CompletedTodoAfterTraditional|FromTodoToTraditionalCompletes|TraditionalCompletion with a reward set
    public int FirstClearedBeforeDeadline { get; set; } // CompletedTodo|CompletedTodoAfterTraditional before deadline
    public int FirstClearedAfterDeadline { get; set; } // CompletedTodo|CompletedTodoAfterTraditional after deadline
    public int FirstCompleteWithGameModeSwitch { get; set; } // Quick win: already have a strike in TO-DO mode, switches to Traditional FromTodoToTraditionalCompletes
}


/*
A: TODO InProgress
B: TODO Completed
C: Traditional InProgress
D: Traditional Completed
E: In both D & B
F: In both D & A

Transitions:
A => B: CellCheck Event, A-1, B+1 | E+1, F-1 in case TraditionalGame.CompletedAt;
A => C: Game mode change, no strike: A-1, C+1
A => D: Game mode change (already strike): A-1 & D+1 if no TraditionalGame.CompletedAt, otherwise F-1
B => x: -
C => A: Game mode change, C-1, A+1
C => B: -
C => D: Cell Check event, C-1, D+1
D => A: Game mode change, F+1, A+1
D => B: -

A=>B: CompletedTodo; or CompletedTodoAfterTraditional
A=>C: FromTodoToTraditionalInProgress
A=>D: FromTodoToTraditionalCompletes; or FromTodoToTraditionalCompleted
C=>A: FromTraditionalToTodoInProgress
C=>D: TraditionalCompletion
D=>A: FromTraditionalCompletedToTodoInProgress
A=>A | C=>C: CellCheck


When transitioning to B or D, also calculate Deadline + Reward fields, subtract Halfway
When CellCheck without transition, calculate Halfway event
When A => C or C => A, subtract and add Halfway

AllBoards = (A-F)+(B-E)+C+D
CurrentlyTraditional & TraditionalExclusive: C+(D-E-F)
TraditionalInclusive: C+D
CurrentlyTODO & TODOInclusive: A+B
TODOExclusive: (A-F)+(B-F)



Calculations:
A: TodoGame.CompletedAt == null
B: TodoGame.CompletedAt != null
C: TraditionalGame.CompletedAt == null
D: TraditionalGame.CompletedAt != null
E: TodoGame.CompletedAt != null && TraditionalGame.CompletedAt != null
F: TraditionalGame.CompletedAt != null && GameMode == 'todo' && TodoGame.CompletedAt == null

*/
