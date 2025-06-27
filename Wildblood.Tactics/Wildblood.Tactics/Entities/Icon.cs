namespace Wildblood.Tactics.Entities;

public record Icon
{
    public required List<Point> Points { get; init; }

    public required IconType Type { get; init; }

    public required string FilePath { get; init; }

    public required string Color { get; init; }
}