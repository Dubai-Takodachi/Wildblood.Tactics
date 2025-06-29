namespace Wildblood.Tactics.Services;

public interface ITacticToolService
{
    public event Func<Task>? OnToolChanged;

    public IconType EditMode { get; }

    public List<string> Units { get; }

    public string SelectedUnit { get; }

    public string SelectedColorValue { get; }

    public Task ChangeEditMode(IconType editMode);

    public Task ChangeUnit(string unit);

    public Task ChangeColor(string color);
}
