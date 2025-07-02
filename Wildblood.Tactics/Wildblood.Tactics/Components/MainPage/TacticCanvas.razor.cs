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

    [Inject]
    private ITacticCanvasService TacticCanvasService { get; init; } = default!;

    private DotNetObjectReference<TacticCanvas>? _dotNetRef;
    private bool _initialized = false;

    protected override async Task OnInitializedAsync()
    {
        _dotNetRef = DotNetObjectReference.Create(this);
        // Subscribe to state changes for live updates
        TacticCanvasService.OnGameStateChanged += RedrawIcons;
        TacticCanvasService.OnSelectedUnitChanged += SetSelectedUnit;
    }

    private async Task SetSelectedUnit()
    {
        await JS.InvokeVoidAsync("pixiInterop.setSelectedUnit", TacticCanvasService.SelectedUnit);
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && !_initialized)
        {
            _initialized = true;
            await JS.InvokeVoidAsync("pixiInterop.createApp", "tacticsCanvas");
            if (TacticCanvasService.CurrentSlide.MapPath != null)
            {
                //await JS.InvokeVoidAsync("pixiInterop.setBackground", TacticCanvasService.CurrentSlide.MapPath);
            }
            await RedrawIcons();
        }
    }

    private async Task RedrawIcons()
    {
        //var icons = TacticCanvasService.GetRedrawIcons();
        //await JS.InvokeVoidAsync("pixiInterop.redrawAll", icons);
    }

    private async Task OnMouseDown(MouseEventArgs args)
    {
        var pos = await JS.InvokeAsync<Point>("pixiInterop.getLogicalMousePosition", "tacticsCanvas", args.ClientX, args.ClientY);

        if (args.Button == 1)
        {
            await JS.InvokeVoidAsync("pixiInterop.startPan", args.ClientX, args.ClientY);
            return;
        }

        var draggingIcon = await TacticCanvasService.CreateDraggingIcon(pos);
        if (draggingIcon != null)
        {
            await JS.InvokeVoidAsync("pixiInterop.startDrag", draggingIcon, pos.X, pos.Y);
            return;
        }

        await TacticCanvasService.CreateIcon(pos);
        await RedrawIcons();
    }

    private async Task OnMouseMove(MouseEventArgs args)
    {
        var pos = await JS.InvokeAsync<Point>("pixiInterop.getLogicalMousePosition", "tacticsCanvas", args.ClientX, args.ClientY);

        if (await JS.InvokeAsync<bool>("pixiInterop.getPanning"))
        {
            await JS.InvokeVoidAsync("pixiInterop.updatePan", args.ClientX, args.ClientY);
            return;
        }

        var icons = await TacticCanvasService.DrawingInteraction(pos);
        if (icons != null)
        {
            await JS.InvokeVoidAsync("pixiInterop.redrawAll", icons);
        }

        icons = await TacticCanvasService.GrabbingInteraction(pos);
        if (icons != null)
        {
            await JS.InvokeVoidAsync("pixiInterop.dragIcon", pos.X, pos.Y, icons);
        }
    }

    private async Task OnMouseUp(MouseEventArgs args)
    {
        if (await JS.InvokeAsync<bool>("pixiInterop.getPanning"))
        {
            await JS.InvokeVoidAsync("pixiInterop.stopPan");
            return;
        }

        var icons = await TacticCanvasService.StopInteraction();
        if (icons != null)
        {
            await JS.InvokeVoidAsync("pixiInterop.redrawAll", icons);
        }

        await JS.InvokeVoidAsync("pixiInterop.stopDrag");
    }

    private async Task OnMouseScroll(WheelEventArgs args)
    {
        var newZoom = TacticCanvasService.ZoomLevel - (float)args.DeltaY * 0.001f;
        await TacticCanvasService.SetZoom(newZoom);
        await JS.InvokeVoidAsync("pixiInterop.setZoom", newZoom);
    }

    public void Dispose()
    {
        _dotNetRef?.Dispose();

        TacticCanvasService.OnGameStateChanged -= RedrawIcons;
        TacticCanvasService.OnSelectedUnitChanged -= SetSelectedUnit;
    }
}
