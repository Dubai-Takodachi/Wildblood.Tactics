namespace Wildblood.Tactics.Entities;

using Wildblood.Tactics.Mappings;
using Wildblood.Tactics.Models.Tools;

public record Entity
{
    public required string Id { get; init; }

    public required ToolType ToolType { get; init; }

    public required Point Position { get; init; }

    public List<Point>? Path { get; init; }

    public UnitName? UnitName { get; init; }

    public LineStyle? LineStyle { get; init; }

    public LineEnd? LineEnd { get; init; }

    public ShapeType? ShapeType { get; init; }

    public int? PrimarySize { get; init; }

    public int? SecondarySize { get; init; }

    public string? PrimaryColor { get; init; }

    public string? SecondaryColor { get; init; }

    public string? Text { get; init; }

    public bool? HasBackground { get; init; }
}
