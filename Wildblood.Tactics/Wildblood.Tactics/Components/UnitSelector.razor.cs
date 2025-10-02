namespace Wildblood.Tactics.Components;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Mappings;

public partial class UnitSelector
{
    [Parameter]
    public required EventCallback<Unit> SelectedUnitChanged { get; init; }

    [Parameter]
    public UnitName? PreselectedUnit { get; init; }

    [Inject]
    private IJSRuntime JS { get; set; } = default!;

    private IReadOnlyList<Unit> units = UnitDataSet.Entries;

    private Unit? selectedUnit;
    private string? unitSearchText;
    private UnitEra? selectedUnitEra;
    private PrimaryUnitType? selectedUnitPrimaryType;
    private SecondaryUnitType? selectedUnitSecondaryType;
    private string unitSortBy = "Name";
    private HashSet<UnitName> favoriteUnits = new();

    protected override async Task OnInitializedAsync()
    {
        await LoadFavorites();

        if (PreselectedUnit.HasValue)
        {
            selectedUnit = UnitDataSet.UnitByUnitName[PreselectedUnit.Value];
        }
    }

    private async Task SelectUnit(Unit unit)
    {
        selectedUnit = unit;
        await SelectedUnitChanged.InvokeAsync(unit);
    }

    private bool IsFavorite(UnitName name) => favoriteUnits.Contains(name);

    private async Task ToggleFavorite(UnitName name)
    {
        if (!favoriteUnits.Add(name))
        {
            favoriteUnits.Remove(name);
        }

        await SaveFavorites();
    }

    private async Task SaveFavorites()
    {
        await JS.InvokeVoidAsync(
            "localStorage.setItem",
            "favoriteUnits",
            string.Join(",", favoriteUnits));
    }

    private async Task LoadFavorites()
    {
        var savedFavorites = await JS
            .InvokeAsync<string>("localStorage.getItem", "favoriteUnits");

        if (!string.IsNullOrWhiteSpace(savedFavorites))
        {
            favoriteUnits = [.. savedFavorites.Split(',').Select(Enum.Parse<UnitName>)];
        }
    }

    private IEnumerable<Unit> GetFilteredAndSortedUnits()
    {
        var query = units.AsEnumerable()
            .Where(u =>
                string.IsNullOrWhiteSpace(unitSearchText)
                    || u.Name.ToString().Contains(unitSearchText, StringComparison.OrdinalIgnoreCase))
            .Where(u => !selectedUnitEra.HasValue || u.Era == selectedUnitEra)
            .Where(u => !selectedUnitPrimaryType.HasValue || u.PrimaryType == selectedUnitPrimaryType)
            .Where(u => !selectedUnitSecondaryType.HasValue || u.SecondaryType == selectedUnitSecondaryType)
            .OrderByDescending(u => favoriteUnits.Contains(u.Name));

        return unitSortBy switch
        {
            "Influence" => query.ThenBy(u => u.Influence),
            "InfluenceDesc" => query.ThenByDescending(u => u.Influence),
            _ => query.ThenBy(u => u.Name.ToString()),
        };
    }
}
