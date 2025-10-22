namespace Wildblood.Tactics.Models.Tools;

public record TextOptions
{
    public required string Text { get; init; }

    public required int Size { get; init; }

    public required string Color { get; init; }

    public required bool HasBackground { get; init; }

    public required string BackgroundColor { get; init; }
}
