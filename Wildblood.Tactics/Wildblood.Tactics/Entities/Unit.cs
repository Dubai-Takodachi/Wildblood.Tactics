namespace Wildblood.Tactics.Entities
{
    public class Unit(double x, double y, string filePath, int height = 40, int width = 40) : IIcon
    {
        public double X { get; set; } = x;

        public double Y { get; set; } = y;

        public int Height { get; set; } = height;

        public int Width { get; set; } = width;

        public string FilePath { get; set; } = filePath;

        public string Color { get; set; } = string.Empty;
    }
}
