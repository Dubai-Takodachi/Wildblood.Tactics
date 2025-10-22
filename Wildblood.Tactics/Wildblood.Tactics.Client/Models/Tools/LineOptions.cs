namespace Wildblood.Tactics.Models.Tools;

public record LineOptions
{
    public required string Color { get; init; }

    public required int Thickness { get; init; }

    public required int EndSize { get; init; }

    public required LineStyle LineStyle { get; init; }

    public required LineEnd LineEnd { get; init; }
}
