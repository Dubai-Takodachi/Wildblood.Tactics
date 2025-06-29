namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Wildblood.Tactics.Services;

public partial class TacticZoom
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    [Inject]
    private ITacticZoomService TacticZoomService { get; init; } = default!;

    private float zoomLevel = 1;

    protected override void OnInitialized()
    {
        TacticZoomService.OnZoomChanged += RefreshZoomLevel;
    }

    private async Task SetZoom(float newZoom)
    {
        await TacticZoomService.SetZoomLevel(newZoom);
    }

    private async Task RefreshZoomLevel()
    {
        zoomLevel = TacticZoomService.ZoomLevel;
        await JS.InvokeVoidAsync("setZoom", zoomLevel);
        await InvokeAsync(StateHasChanged);
    }
}
