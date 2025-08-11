namespace Wildblood.Tactics.Entities;

using Wildblood.Tactics.Models;

public record PlayerSetup
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Classes Class { get; set; } = Classes.Maul;

    // 1 - 15 but i need to decide some stuff later.
    public int Number { get; set; } = 0;

    // 700 is the base influence for a player in Conqueror's Blade
    public int Influence { get; set; } = 700;

    public List<Unit> Units { get; set; } = new List<Unit>();
}