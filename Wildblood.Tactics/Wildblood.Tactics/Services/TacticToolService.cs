namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Models.Tools;

public class TacticToolService : ITacticToolService
{
    public event Func<Task>? OnToolChanged;

    public ToolOptions AllOptions { get; private set; }

    public ToolOptions CurrentOptions { get; private set; }

    public TacticToolService()
    {
        AllOptions = CreateDefaultOptions();
        CurrentOptions = CreateCurrentToolOptions();
    }

    public async Task PatchTool(ToolOptions newOptions)
    {
        AllOptions = AllOptions with
        {
            Tool = newOptions?.Tool ?? AllOptions.Tool,
            IconOptions = newOptions?.IconOptions ?? AllOptions.IconOptions,
            LineDrawOptions = newOptions?.LineDrawOptions ?? AllOptions.LineDrawOptions,
            CurveDrawOptions = newOptions?.CurveDrawOptions ?? AllOptions.CurveDrawOptions,
            FreeDrawOptions = newOptions?.FreeDrawOptions ?? AllOptions.FreeDrawOptions,
            ShapeOptions = newOptions?.ShapeOptions ?? AllOptions.ShapeOptions,
            TextOptions = newOptions?.TextOptions ?? AllOptions.TextOptions,
        };

        CurrentOptions = CreateCurrentToolOptions();

        if (OnToolChanged != null)
        {
            await OnToolChanged.Invoke();
        }
    }

    private ToolOptions CreateCurrentToolOptions()
    {
        var currentBase = new ToolOptions { Tool = AllOptions.Tool };

        return AllOptions.Tool switch
        {
            ToolType.AddIcon => currentBase with { IconOptions = AllOptions.IconOptions },
            ToolType.DrawLine => currentBase with { LineDrawOptions = AllOptions.LineDrawOptions },
            ToolType.DrawCurve => currentBase with { CurveDrawOptions = AllOptions.CurveDrawOptions },
            ToolType.DrawFree => currentBase with { FreeDrawOptions = AllOptions.FreeDrawOptions },
            ToolType.AddText => currentBase with { TextOptions = AllOptions.TextOptions },
            _ => currentBase,
        };
    }

    private static ToolOptions CreateDefaultOptions()
    {
        var defaultLineOptions = new LineOptions
        {
            Color = "#000000",
            LineStyle = LineStyle.Normal,
            Thickness = 5,
            LineEnd = LineEnd.Normal,
            EndSize = 20,
        };

        var defaultTextOptions = new TextOptions
        {
            Text = string.Empty,
            Size = 30,
            Color = "#000000",
            HasBackground = false,
            BackgroundColor = "#aaaaaa",
        };

        return new ToolOptions
        {
            Tool = ToolType.AddIcon,
            IconOptions = new IconOptions
            {
                IconSize = 60,
                IconType = IconType.Azaps,
                LabelOptions = defaultTextOptions,
            },
            LineDrawOptions = defaultLineOptions,
            CurveDrawOptions = defaultLineOptions,
            FreeDrawOptions = defaultLineOptions,
            ShapeOptions = new ShapeOptions
            {
                ShapeType = ShapeType.Circle,
                OutlineColor = "#ff0000",
                OutlineStyle = LineStyle.Normal,
                OutlineThickness = 5,
                OutlineTransparancy = 0,
                FillColor = "#ff0000",
                FillTransparancy = 20,
            },
            TextOptions = defaultTextOptions,
        };
    }
}
