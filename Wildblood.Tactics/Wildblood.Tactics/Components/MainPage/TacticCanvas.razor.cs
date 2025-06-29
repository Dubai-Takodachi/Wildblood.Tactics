namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Services;

public partial class TacticCanvas
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    [Inject]
    private ITacticCanvasService TacticCanvasService { get; init; } = default!;

    private Point? panMouseStart;
    private Point? panCanvasOrigin;
    private bool isPanning = false;

    protected override void OnInitialized()
    {
        TacticCanvasService.OnGameStateChanged += RefreshUI;
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
        var icons = TacticCanvasService.GetRedrawIcons();
        await DrawIcons(icons);

        var map = TacticCanvasService.GetMap();
        await JS.InvokeVoidAsync("setBackground", map);

        var zoomLevel = TacticCanvasService.ZoomLevel;
        await JS.InvokeVoidAsync("setZoom", zoomLevel);

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

        var draggingIcon = await TacticCanvasService.CreateDraggingIcon(pos);
        if (draggingIcon != null)
        {
            await JS.InvokeVoidAsync("startDrag", draggingIcon, pos.X, pos.Y);
            return;
        }

        await TacticCanvasService.CreateIcon(pos);
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

        var icons = await TacticCanvasService.DrawingInteraction(pos);
        await DrawIcons(icons);

        icons = await TacticCanvasService.GrabbingInteraction(pos);

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

        var icons = await TacticCanvasService.StopInteraction();
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

        await TacticCanvasService.SetZoom(TacticCanvasService.ZoomLevel - (float)args.DeltaY * 0.001f);
    }
}
