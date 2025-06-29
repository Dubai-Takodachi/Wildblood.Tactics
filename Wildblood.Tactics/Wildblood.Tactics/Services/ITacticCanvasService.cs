namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;

public interface ITacticCanvasService
{
    public event Func<Task>? OnGameStateChanged;

    public Tactic CurrentTactic { get; }

    public Folder CurrentFolder { get; }

    public Slide CurrentSlide { get; }

    public string SelectedUnit { get; set; }

    public string SelectedColorValue { get; set; }

    public IconType EditMode { get; set; }

    public float ZoomLevel { get; }

    public Task UpdateServerTactic();

    public Task SetNeedsRedraw();

    public Task CreateIcon(Point pos);

    public Task<Icon?> CreateDraggingIcon(Point pos);

    public List<Icon> GetRedrawIcons();

    public string GetMap();

    public Task SetZoom(float zoomLevel);

    public Task<List<Icon>?> DrawingInteraction(Point pos);

    public Task<List<Icon>?> GrabbingInteraction(Point pos);

    public Task<List<Icon>?> StopInteraction();
}
