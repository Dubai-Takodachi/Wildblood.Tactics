namespace Wildblood.Tactics.Entities
{
    // This Class needs some work => If saved to DB you can use 2 coordiantes to draw the arrow.
    public class Icon(double StartX, double StartY, double EndX, double EndY, string filePath, IconType tool)
    {
        public double StartX { get; set; } = StartX;
        public double StartY { get; set; } = StartY;
        public double EndX { get; set; } = EndX;
        public double EndY { get; set; } = EndY;
        public IconType Type { get; set; } = tool;
        public string FilePath { get; set; } = filePath;
        public string Color { get; set; } = string.Empty;
    }
}

