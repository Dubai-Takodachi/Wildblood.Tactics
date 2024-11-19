namespace Wildblood.Tactics.Entities
{
    public interface IIcon
    {
        public double X { get; set; }

        public double Y { get; set; }

        public string FilePath { get; set; }

        public int Width {get; set; }
        
        public int Height {get; set; }

        public string Color { get; set; }

    }
}
