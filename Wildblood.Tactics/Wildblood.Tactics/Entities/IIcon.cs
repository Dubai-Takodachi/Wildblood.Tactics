namespace Wildblood.Tactics.Entities
{
    // Should have all the attributes that icons need. This will land in the DB.    
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
