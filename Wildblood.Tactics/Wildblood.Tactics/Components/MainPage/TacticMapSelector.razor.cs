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
        favoriteMaps.Clear();
        favoriteMaps.Add(maps[3]);
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

        if (!string.IsNullOrEmpty(json))
        {
            try
            {
                var favorites = System.Text.Json.JsonSerializer.Deserialize<List<string>>(json);

                if (favorites != null)
                {
                    favoriteMaps = [.. favorites];
                }
            }
            catch
            {
            }
        }
    }

    private async Task SaveFavorites()
    {
        if (storageModule is null)
        {
            return;
        }

        var json = System.Text.Json.JsonSerializer.Serialize(favoriteMaps.ToList());
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
