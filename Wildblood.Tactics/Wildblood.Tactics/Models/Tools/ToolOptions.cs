namespace Wildblood.Tactics.Models.Tools;

public record ToolOptions
{
    public required ToolType Tool { get; init; }

    public IconOptions? IconOptions { get; init; }

    public LineOptions? FreeDrawOptions { get; init; }

    public LineOptions? LineDrawOptions { get; init; }

    public LineOptions? CurveDrawOptions { get; init; }

    public ShapeOptions? ShapeOptions { get; init; }
}
