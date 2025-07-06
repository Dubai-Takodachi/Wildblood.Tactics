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

    protected override void OnInitialized()
    {
        TacticCanvasService.OnGameStateChanged += RedrawIcons;
        TacticCanvasService.OnToolChanged += SetSelectedUnit;
    }

    private async Task SetSelectedUnit()
    {
        // await pixiModule.InvokeVoidAsync(
        //    "default.setSelectedUnit",
        //    IconMapping.FileNameByIconType[TacticCanvasService.CurrentOptions.IconOptions!.IconType]);
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            pixiModule = await JS.InvokeAsync<IJSObjectReference>(
                "import",
                "/js/pixiInterop.js");

            await pixiModule.InvokeVoidAsync("default.createApp", "tacticsCanvas");

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
        var icons = TacticCanvasService.GetRedrawIcons();
        if (icons != null)
        {
            await pixiModule.InvokeVoidAsync(
                "default.redrawIcons",
                TacticCanvasService.CurrentSlide.Icons);
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
        TacticCanvasService.OnGameStateChanged -= RedrawIcons;
        TacticCanvasService.OnToolChanged -= SetSelectedUnit;
    }
}
