namespace Wildblood.Tactics.Entities
{
    public class Unit(double x, double y, string filePath)
    {
        public double X { get; set; } = x;

        public double Y { get; set; } = y;

        public string filePath { get; set; } = filePath;
    }
}
