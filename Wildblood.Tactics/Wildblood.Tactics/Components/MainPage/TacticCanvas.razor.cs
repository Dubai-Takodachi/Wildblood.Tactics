namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Mappings;
using Wildblood.Tactics.Services;

public partial class TacticCanvas : IDisposable
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    private IJSObjectReference pixiModule = null!;

    [Inject]
    private ITacticCanvasService TacticCanvasService { get; init; } = default!;

    private DotNetObjectReference<TacticCanvas> objectReference = null!;

    private Timer entityUpdateTimer = null!;

    private Entity[]? latestUpdate = null;

    private Entity[]? latestProcessed = null;

    protected override void OnInitialized()
    {
        objectReference = DotNetObjectReference.Create(this);
        entityUpdateTimer = new Timer(ProcessLatestEntityUpdate, null, 0, 10);

        TacticCanvasService.OnGameStateChanged += RedrawIcons;
        TacticCanvasService.OnToolChanged += SetSelectedUnit;
    }

    [JSInvokable]
    public void UpdateServerEntities(Entity[] entities)
    {
        latestUpdate = entities;
    }

    private void ProcessLatestEntityUpdate(object? state)
    {
        if (latestUpdate is { Length: > 0 } && latestUpdate != latestProcessed)
        {
            _ = TacticCanvasService.UpdateEntites(latestUpdate);
            latestProcessed = latestUpdate;
        }
    }

    private async Task SetSelectedUnit()
    {
        await pixiModule.InvokeVoidAsync(
            "default.setToolOptions",
            TacticCanvasService.CurrentOptions);
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            pixiModule = await JS.InvokeAsync<IJSObjectReference>(
                "import",
                "/js/pixiInterop.js");

            await pixiModule.InvokeVoidAsync(
                "default.createApp",
                objectReference,
                IconMapping.FileNameByIconType);

            if (TacticCanvasService.CurrentSlide.MapPath != null)
            {
                await pixiModule.InvokeVoidAsync(
                    "default.setBackground",
                    TacticCanvasService.CurrentSlide.MapPath);
            }

            await RedrawIcons();
        }
    }

    private async Task RedrawIcons()
    {
        var icons = TacticCanvasService.GetRedrawEntities();
        if (icons != null)
        {
            await pixiModule.InvokeVoidAsync(
                "default.redrawEntities",
                TacticCanvasService.CurrentSlide.Entities);
        }

        if (TacticCanvasService.CurrentSlide.MapPath != null)
        {
            await pixiModule.InvokeVoidAsync(
                "default.setBackground",
                TacticCanvasService.CurrentSlide.MapPath);
        }
    }

    private async Task OnMouseScroll(WheelEventArgs args)
    {
        var newZoom = TacticCanvasService.ZoomLevel - (float)args.DeltaY * 0.001f;
        await TacticCanvasService.SetZoom(newZoom);
        await JS.InvokeVoidAsync("PixiInterop.setZoom", newZoom);
    }

    public void Dispose()
    {
        objectReference.Dispose();

        TacticCanvasService.OnGameStateChanged -= RedrawIcons;
        TacticCanvasService.OnToolChanged -= SetSelectedUnit;
    }
}
