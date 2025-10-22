namespace Wildblood.Tactics.Entities
{
    public record RaidSetup
    {
        public int Id { get; init; }

        public required string Name { get; init; }

        public required string UserId { get; init; }
    }
}
