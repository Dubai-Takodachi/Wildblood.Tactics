namespace Wildblood.Tactics.Services;

public interface ITacticZoomService
{
    public event Func<Task>? OnZoomChanged;

    public float ZoomLevel { get; }

    public Task SetZoomLevel(float zoomLevel);
}
