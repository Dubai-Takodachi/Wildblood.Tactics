namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Entities;

public interface ITacticsCanvasService
{
    public void SetEditMode(IconType editMode);

    public Task<Icon?> CreateDraggingIcon(Point pos);

    public List<Icon>? GetRedrawIconsWhenRequested();

    public Task<List<Icon>?> DrawingInteraction(Point pos);

    public Task<List<Icon>?> GrabbingInteraction(Point pos);

    public Task<List<Icon>?> StopInteraction();

    public Task SetMap(string mapPath);

    public void SetSelectedUnit(string unit);

    public void SetColorValue(string color);
}
