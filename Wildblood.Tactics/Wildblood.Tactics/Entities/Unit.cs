namespace Wildblood.Tactics.Entities;

using Wildblood.Tactics.Mappings;

public record Unit
{
    public required UnitName Name { get; init; }

    public required int Influence { get; init; }

    public required string Path { get; init; }

    public required UnitEra Era { get; init; }

    public required PrimaryUnitType PrimaryType { get; init; }

    public required SecondaryUnitType SecondaryType { get; init; }
}