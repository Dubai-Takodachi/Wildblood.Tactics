namespace Wildblood.Tactics.Client.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Mappings;
using Wildblood.Tactics.Client.Services;

public partial class TacticCanvas : IDisposable
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    private IJSObjectReference pixiModule = null!;

    [Inject]
    private ITacticCanvasService TacticCanvasService { get; init; } = default!;

    private DotNetObjectReference<TacticCanvas> objectReference = null!;

    protected override void OnInitialized()
    {
        objectReference = DotNetObjectReference.Create(this);

        TacticCanvasService.OnGameStateChanged += RedrawEntities;
        TacticCanvasService.OnToolChanged += SetToolOptions;
        TacticCanvasService.OnPing += DrawPing;
    }

    [JSInvokable]
    public async Task UpdateServerEntities(Entity[] entities, string[] removedEntityIds)
    {
        await TacticCanvasService.UpdateEntites(entities, removedEntityIds);
    }

    [JSInvokable]
    public async Task PingToServer(Entity ping)
    {
        await TacticCanvasService.PingToServer(ping);
    }

    private async Task SetToolOptions()
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
                UnitDataSet.Entries);

            await SetToolOptions();
            await RedrawEntities();
        }
    }

    private async Task RedrawEntities()
    {
        var entities = TacticCanvasService.GetRedrawEntities();
        if (entities != null)
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

    private async Task DrawPing(Entity ping)
    {
        if (pixiModule != null)
        {
            await pixiModule.InvokeVoidAsync("default.drawPing", ping);
        }
    }

    public void Dispose()
    {
        objectReference.Dispose();

        TacticCanvasService.OnGameStateChanged -= RedrawEntities;
        TacticCanvasService.OnToolChanged -= SetToolOptions;
    }
}
