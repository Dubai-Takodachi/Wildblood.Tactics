namespace Wildblood.Tactics.Services;

public class TacticToolService : ITacticToolService
{
    public event Func<Task>? OnToolChanged;

    public List<string> Units { get; init; }

    public IconType EditMode { get; private set; }

    public string SelectedUnit { get; private set; }

    public string SelectedColorValue { get; private set; }

    public TacticToolService()
    {
        Units = Directory.EnumerateFiles(baseUnitPath, "*", SearchOption.AllDirectories)
            .Select(f => Path.GetFileName(f))
            .ToList();

        SelectedUnit = Units[0];
        SelectedColorValue = "#ffffff";
    }

    private static string baseUnitPath = "wwwroot/ConquerorsBladeData/Units";

    public async Task ChangeEditMode(IconType editMode)
    {
        EditMode = editMode;

        if (OnToolChanged != null)
        {
            await OnToolChanged.Invoke();
        }
    }

    public async Task ChangeUnit(string unit)
    {
        SelectedUnit = unit;

        if (OnToolChanged != null)
        {
            await OnToolChanged.Invoke();
        }
    }

    public async Task ChangeColor(string color)
    {
        SelectedColorValue = color;

        if (OnToolChanged != null)
        {
            await OnToolChanged.Invoke();
        }
    }
}
