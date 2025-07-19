namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Models.Tools;

public class TacticCanvasService : ITacticCanvasService
{
    public event Func<Task>? OnGameStateChanged;

    public event Func<Task>? OnToolChanged;

    public Tactic CurrentTactic => tacticExplorerService.CurrentTactic;

    public Folder CurrentFolder => tacticExplorerService.CurrentFolder;

    public Slide CurrentSlide => tacticExplorerService.CurrentSlide;

    public ToolOptions CurrentOptions => tacticToolService.CurrentOptions;

    private ITacticExplorerService tacticExplorerService;
    private ITacticToolService tacticToolService;

    public TacticCanvasService(
        ITacticExplorerService tacticExplorerService,
        ITacticToolService tacticToolService)
    {
        this.tacticExplorerService = tacticExplorerService;
        this.tacticToolService = tacticToolService;

        tacticExplorerService.OnTacticChanged += RefreshTactic;
        tacticToolService.OnToolChanged += RefreshTool;
    }

    public List<Entity> GetRedrawEntities()
    {
        return CurrentSlide.Entities;
    }

    public string GetMap()
    {
        return CurrentSlide.MapPath!;
    }

    private async Task RefreshZoom()
    {
        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }
    }

    private async Task RefreshTactic()
    {
        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }
    }

    private async Task RefreshTool()
    {
        if (OnToolChanged != null)
        {
            await OnToolChanged.Invoke();
        }
    }

    public async Task UpdateEntites(Entity[] entities, string[] removedEntityIds)
    {
        var combined = CurrentSlide.Entities
            .Where(e => !entities.Any(x => x.Id == e.Id))
            .Concat(entities)
            .Where(e => !removedEntityIds.Contains(e.Id))
            .ToList();

        CurrentSlide.Entities = combined;
        await RefreshTactic();

        await tacticExplorerService.SendEntitiesUpdate(entities, removedEntityIds);
        await tacticExplorerService.UpdateServerEntities(combined);

    }
}
