namespace Wildblood.Tactics.Entities;

using System.ComponentModel.DataAnnotations;
using Wildblood.Tactics.Models;

public record PlayerSetup
{
    // 1 - 15 but i need to decide some stuff later.
    [Key]
    public required int Index { get; set; }

    [Key]
    public required int RaidId { get; set; }

    public required string Name { get; set; }

    public required Classes Class { get; set; }

    // 700 is the base influence for a player in Conqueror's Blade
    public required int Influence { get; set; } = 700;

    public required List<Unit> Units { get; set; }
}