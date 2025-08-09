namespace Wildblood.Tactics.Models.Tools;

using Wildblood.Tactics.Mappings;

public record IconOptions
{
    public required UnitName UnitName { get; init; }

    public required int IconSize { get; init; }

    public required TextOptions LabelOptions { get; init; }
}
