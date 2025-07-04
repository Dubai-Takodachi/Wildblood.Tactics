namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using Wildblood.Tactics.Entities;
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
        TacticCanvasService.OnSelectedUnitChanged += SetSelectedUnit;
    }

    private async Task SetSelectedUnit()
    {
        await pixiModule.InvokeVoidAsync(
            "default.setSelectedUnit",
            TacticCanvasService.SelectedUnit);
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

    private async Task OnMouseDown(MouseEventArgs args)
    {
        var pos = await JS.InvokeAsync<Point>("PixiInterop.getLogicalMousePosition", "tacticsCanvas", args.ClientX, args.ClientY);

        if (args.Button == 1)
        {
            await JS.InvokeVoidAsync("PixiInterop.startPan", args.ClientX, args.ClientY);
            return;
        }

        var draggingIcon = await TacticCanvasService.CreateDraggingIcon(pos);
        if (draggingIcon != null)
        {
            await JS.InvokeVoidAsync("PixiInterop.startDrag", draggingIcon, pos.X, pos.Y);
            return;
        }

        await TacticCanvasService.CreateIcon(pos);
        await RedrawIcons();
    }

    private async Task OnMouseMove(MouseEventArgs args)
    {
        var pos = await JS.InvokeAsync<Point>("PixiInterop.getLogicalMousePosition", "tacticsCanvas", args.ClientX, args.ClientY);

        if (await JS.InvokeAsync<bool>("PixiInterop.getPanning"))
        {
            await JS.InvokeVoidAsync("PixiInterop.updatePan", args.ClientX, args.ClientY);
            return;
        }

        var icons = await TacticCanvasService.DrawingInteraction(pos);
        if (icons != null)
        {
            await JS.InvokeVoidAsync("PixiInterop.redrawAll", icons);
        }

        icons = await TacticCanvasService.GrabbingInteraction(pos);
        if (icons != null)
        {
            await JS.InvokeVoidAsync("PixiInterop.dragIcon", pos.X, pos.Y, icons);
        }
    }

    private async Task OnMouseUp(MouseEventArgs args)
    {
        if (await JS.InvokeAsync<bool>("PixiInterop.getPanning"))
        {
            await JS.InvokeVoidAsync("PixiInterop.stopPan");
            return;
        }

        var icons = await TacticCanvasService.StopInteraction();
        if (icons != null)
        {
            await JS.InvokeVoidAsync("PixiInterop.redrawAll", icons);
        }

        await JS.InvokeVoidAsync("PixiInterop.stopDrag");
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
        TacticCanvasService.OnSelectedUnitChanged -= SetSelectedUnit;
    }
}
