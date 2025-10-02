namespace Wildblood.Tactics.Services;

public interface ITacticMapSelectorService
{
    public event Func<Task>? OnMapChanged;

    public string CurrentMap { get; }

    public IReadOnlyCollection<string> Maps { get; }

    public Task UpdateCurrentMap(string map);
}
