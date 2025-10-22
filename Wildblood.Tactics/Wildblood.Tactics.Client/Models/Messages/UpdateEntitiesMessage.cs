namespace Wildblood.Tactics.Models.Messages;

using Wildblood.Tactics.Entities;

public record UpdateEntitiesMessage
{
    public List<Entity>? EntitiesToOverwrite { get; init; }

    public List<string>? EntityIdsToDelete { get; init; }
}
