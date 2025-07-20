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
            PingOptions = newOptions?.PingOptions ?? AllOptions.PingOptions,
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
            ToolType.AddShape => currentBase with { ShapeOptions = AllOptions.ShapeOptions },
            ToolType.Ping => currentBase with { PingOptions = AllOptions.PingOptions },
            _ => currentBase,
        };
    }

    private static ToolOptions CreateDefaultOptions()
    {
        var defaultLineOptions = new LineOptions
        {
            Color = "#000000",
            LineStyle = LineStyle.Normal,
            Thickness = 20,
            LineEnd = LineEnd.Normal,
            EndSize = 80,
        };

        var defaultTextOptions = new TextOptions
        {
            Text = string.Empty,
            Size = 120,
            Color = "#000000",
            HasBackground = false,
            BackgroundColor = "#aaaaaa",
        };

        return new ToolOptions
        {
            Tool = ToolType.Ping,
            PingOptions = new PingOptions { Color = "ff0000" },
            IconOptions = new IconOptions
            {
                IconSize = 120,
                IconType = IconType.Azaps,
                LabelOptions = defaultTextOptions,
            },
            LineDrawOptions = defaultLineOptions,
            CurveDrawOptions = defaultLineOptions,
            FreeDrawOptions = defaultLineOptions,
            ShapeOptions = new ShapeOptions
            {
                ShapeType = ShapeType.Circle,
                OutlineColor = "#ff0000ff",
                OutlineStyle = LineStyle.Normal,
                OutlineThickness = 20,
                FillColor = "#ff000033",
            },
            TextOptions = defaultTextOptions,
        };
    }
}
