namespace Wildblood.Tactics.Models.Messages;

public record UpdateTacticMessage
{
    public required Tactic TacticWithoutEntities { get; init; }
}
