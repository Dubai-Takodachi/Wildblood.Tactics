namespace Wildblood.Tactics.Models.Tools;

public record IconOptions
{
    public required IconType IconType { get; init; }

    public required int IconSize { get; init; }

    public required TextOptions LabelOptions { get; init; }
}
