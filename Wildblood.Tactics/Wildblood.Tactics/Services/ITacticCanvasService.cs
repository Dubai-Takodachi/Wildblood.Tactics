namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Models.Tools;

public interface ITacticCanvasService
{
    public event Func<Task>? OnGameStateChanged;

    public event Func<Task>? OnToolChanged;

    public Tactic CurrentTactic { get; }

    public Folder CurrentFolder { get; }

    public Slide CurrentSlide { get; }

    public ToolOptions CurrentOptions { get; }

    public List<Entity> GetRedrawEntities();

    public string GetMap();

    public Task UpdateEntites(Entity[] entities, string[] removedEntityIds);
}
