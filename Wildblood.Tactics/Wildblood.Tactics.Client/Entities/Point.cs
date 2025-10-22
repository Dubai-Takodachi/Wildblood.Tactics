namespace Wildblood.Tactics.Entities;

public record Point(float X, float Y)
{
    public static Point operator +(Point a, Point b)
        => new Point(a.X + b.X, a.Y + b.Y);

    public static Point operator -(Point a, Point b)
        => new Point(a.X - b.X, a.Y - b.Y);
}