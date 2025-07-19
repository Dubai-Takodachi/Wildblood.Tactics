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

    protected override void OnInitialized()
    {
        objectReference = DotNetObjectReference.Create(this);

        TacticCanvasService.OnGameStateChanged += RedrawIcons;
        TacticCanvasService.OnToolChanged += SetSelectedUnit;
    }

    [JSInvokable]
    public async Task UpdateServerEntities(Entity[] entities, string[] removedEntityIds)
    {
        await TacticCanvasService.UpdateEntites(entities, removedEntityIds);
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

    public void Dispose()
    {
        objectReference.Dispose();

        TacticCanvasService.OnGameStateChanged -= RedrawIcons;
        TacticCanvasService.OnToolChanged -= SetSelectedUnit;
    }
}
