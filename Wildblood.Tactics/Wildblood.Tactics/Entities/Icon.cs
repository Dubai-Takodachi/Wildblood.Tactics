namespace Wildblood.Tactics.Entities;

// This Class needs some work => If saved to DB you can use 2 coordiantes to draw the arrow.
public record Icon
{
    public required double StartX { get; set; }
    public required double StartY { get; set; }
    public required double EndX { get; set; }
    public required double EndY { get; set; }
    public required IconType Type { get; init; }
    public required string FilePath { get; init; }
    public required string Color { get; init; }
}