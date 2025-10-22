namespace Wildblood.Tactics.Models.Tools;

public record ShapeOptions
{
    public required ShapeType ShapeType { get; set; }

    public required string OutlineColor { get; init; }

    public required int OutlineThickness { get; init; }

    public required LineStyle OutlineStyle { get; init; }

    public required string FillColor { get; init; }
}
