namespace Wildblood.Tactics.Services;

public interface ITacticMapSelectorService
{
    public string CurrentMap { get; }

    public List<string> Maps { get; }

    public Task UpdateCurrentMap(string map);
}
