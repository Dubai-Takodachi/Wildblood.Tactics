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

    public float ZoomLevel => tacticZoomService.ZoomLevel;

    public ToolOptions CurrentOptions => tacticToolService.CurrentOptions;

    private IHubConnectionService hubConnectionService;
    private ITacticZoomService tacticZoomService;
    private ITacticExplorerService tacticExplorerService;
    private ITacticToolService tacticToolService;

    public TacticCanvasService(
        IHubConnectionService hubConnectionService,
        ITacticZoomService tacticZoomService,
        ITacticExplorerService tacticExplorerService,
        ITacticToolService tacticToolService)
    {
        this.hubConnectionService = hubConnectionService;
        this.tacticZoomService = tacticZoomService;
        this.tacticExplorerService = tacticExplorerService;
        this.tacticToolService = tacticToolService;

        tacticZoomService.OnZoomChanged += RefreshZoom;
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

    private async Task UpdateTactic()
    {
        await hubConnectionService.UpdateTactic(CurrentTactic.Id, CurrentTactic, CurrentSlide.Id, CurrentFolder.Id);
        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }
    }

    public async Task UpdateServerTactic()
    {
        await UpdateTactic();
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

    public async Task SetZoom(float zoomLevel)
    {
        await tacticZoomService.SetZoomLevel(zoomLevel);
    }

    public async Task UpdateServerEntites(Entity[] entities)
    {
        var combined = CurrentSlide.Entities
            .Where(e => !entities.Any(x => x.Id == e.Id))
            .Concat(entities)
            .ToList();

        await tacticExplorerService.UpdateEntities(combined);
        CurrentSlide.Entities = combined;
        await UpdateTactic();
    }
}
