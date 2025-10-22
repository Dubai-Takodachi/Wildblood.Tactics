namespace Wildblood.Tactics.Client.Services;

public interface ITacticMapSelectorService
{
    public event Func<Task>? OnMapChanged;

    public string CurrentMap { get; }

    public List<string> Maps { get; }

    public Task UpdateCurrentMap(string map);
}
