namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using MudBlazor;
using Wildblood.Tactics.Services;
using static System.Text.Json.JsonSerializer;

public partial class TacticMapSelector
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    [Inject]
    private ITacticMapSelectorService TacticMapSelectorService { get; init; } = default!;

    private IJSObjectReference storageModule = null!;

    private List<string> maps = [];

    private string selectedMap = string.Empty;

    private HashSet<string> favoriteMaps = [];

    private IEnumerable<string> SortedMaps => favoriteMaps
        .Where(maps.Contains)
        .Concat(maps.Except(favoriteMaps));

    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();
        maps = TacticMapSelectorService.Maps.ToList();
        TacticMapSelectorService.OnMapChanged += RefreshSelectedMap;
        await RefreshSelectedMap();
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            storageModule = await JS.InvokeAsync<IJSObjectReference>(
                "import", "/js/storage.js");

            await LoadFavorites();
            StateHasChanged();
        }
    }

    private async Task LoadFavorites()
    {
        if (storageModule is null)
        {
            return;
        }

        var json = await storageModule.InvokeAsync<string>("getItem", "favoriteMaps");

        if (string.IsNullOrEmpty(json))
        {
            return;
        }

        try
        {
            favoriteMaps = Deserialize<HashSet<string>>(json) ?? favoriteMaps;
        }
        catch
        {
        }
    }

    private async Task SaveFavorites()
    {
        if (storageModule is null)
        {
            return;
        }

        var json = Serialize(favoriteMaps.ToList());
        await storageModule.InvokeVoidAsync("setItem", "favoriteMaps", json);
    }

    private async Task ToggleFavorite(string map)
    {
        if (favoriteMaps.Remove(map) is false)
        {
            favoriteMaps.Add(map);
        }

        await SaveFavorites();
    }

    public async Task MapChanged(string map)
    {
        await TacticMapSelectorService.UpdateCurrentMap(map);
    }

    private async Task RefreshSelectedMap()
    {
        selectedMap = TacticMapSelectorService.CurrentMap;
        await InvokeAsync(StateHasChanged);
    }
}
