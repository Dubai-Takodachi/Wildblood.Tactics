namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Services;

public partial class TacticsCanvas
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    [Inject]
    private ITacticsCanvasService TacticsCanvasService { get; init; } = default!;

    private Point? panMouseStart;
    private Point? panCanvasOrigin;
    private bool isPanning = false;

    private float zoomLevel = 1.0f;

    protected override void OnInitialized()
    {
        TacticsCanvasService.OnGameStateChanged += RefreshUI;
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await RefreshUI();
        }
    }

    private async Task RefreshUI()
    {
        var icons = TacticsCanvasService.GetRedrawIcons();
        await DrawIcons(icons);

        var map = TacticsCanvasService.GetMap();
        await JS.InvokeVoidAsync("setBackground", map);

        await InvokeAsync(StateHasChanged);
    }

    private async Task MouseDown(MouseEventArgs args)
    {
        var pos = await JS.InvokeAsync<Point>(
        "getLogicalMousePosition", "tacticsCanvas", args.ClientX, args.ClientY);

        if (args.Button == 1)
        {
            isPanning = true;
            panMouseStart = new Point((float)args.ClientX, (float)args.ClientY);
            panCanvasOrigin = await JS.InvokeAsync<Point>("getPan");
            return;
        }

        var draggingIcon = await TacticsCanvasService.CreateDraggingIcon(pos);
        if (draggingIcon != null)
        {
            await JS.InvokeVoidAsync("startDrag", draggingIcon, pos.X, pos.Y);
            return;
        }

        await TacticsCanvasService.CreateIcon(pos);
    }

    private async Task MouseMove(MouseEventArgs args)
    {
        var pos = await JS
            .InvokeAsync<Point>("getLogicalMousePosition", "tacticsCanvas", args.ClientX, args.ClientY);

        if (isPanning && panMouseStart != null && panCanvasOrigin != null)
        {
            var dx = args.ClientX - panMouseStart.X;
            var dy = args.ClientY - panMouseStart.Y;
            var panX = panCanvasOrigin.X + dx;
            var panY = panCanvasOrigin.Y + dy;

            await JS.InvokeVoidAsync("setPan", panX, panY);
            return;
        }

        var icons = await TacticsCanvasService.DrawingInteraction(pos);
        await DrawIcons(icons);

        icons = await TacticsCanvasService.GrabbingInteraction(pos);

        if (icons != null)
        {
            await JS.InvokeVoidAsync("dragIcon", pos.X, pos.Y, icons);
        }
    }

    private async Task MouseUp(MouseEventArgs args)
    {
        if (isPanning && args.Button == 1)
        {
            isPanning = false;
            return;
        }

        var icons = await TacticsCanvasService.StopInteraction();
        await DrawIcons(icons);

        await JS.InvokeVoidAsync("stopDrag");
    }

    private async Task DrawIcons(List<Icon>? icons)
    {
        if (icons != null)
        {
            await JS.InvokeVoidAsync("draw", icons);
        }
    }

    private async Task MouseScroll(WheelEventArgs args)
    {
        zoomLevel -= (float)args.DeltaY * 0.001f;
        zoomLevel = Math.Max(0.1f, zoomLevel);
        await JS.InvokeVoidAsync("setZoom", zoomLevel);
    }
}
