namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using MudBlazor;
using Wildblood.Tactics.Services;

public partial class TacticMapSelector
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    [Inject]
    private ITacticMapSelectorService TacticMapSelectorService { get; init; } = default!;

    private List<string> maps = [];

    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();
        maps = TacticMapSelectorService.Maps.ToList();
    }

    public async Task MapChanged(string map)
    {
        await TacticMapSelectorService.UpdateCurrentMap(map);
    }
}
