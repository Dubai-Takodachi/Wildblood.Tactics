namespace Wildblood.Tactics.Services;

public class TacticZoomService : ITacticZoomService
{
    private float zoomLevel = 1.0f;

    public event Func<Task>? OnZoomChanged;

    public float ZoomLevel => zoomLevel;

    public async Task SetZoomLevel(float zoomLevel)
    {
        this.zoomLevel = Math.Clamp(zoomLevel, 0.1f, 10f);

        if (OnZoomChanged != null)
        {
            await OnZoomChanged.Invoke();
        }
    }
}
