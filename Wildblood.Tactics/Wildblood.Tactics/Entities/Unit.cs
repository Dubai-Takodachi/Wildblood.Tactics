namespace Wildblood.Tactics.Entities;

using Wildblood.Tactics.Models.Tools;

public record Unit
{
    public string Name { get; init; } = string.Empty;

    public int Influence { get; init; } = 0;

    public string Path { get; init; } = string.Empty;

    public IconType IconType { get; init; } = IconType.Azaps;
}