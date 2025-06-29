namespace Wildblood.Tactics.Services;

using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;

public class TacticCanvasService : ITacticCanvasService, IDisposable
{
    public event Func<Task>? OnGameStateChanged;

    public Tactic CurrentTactic { get; set; } = null!;

    public Folder CurrentFolder { get; set; } = null!;

    public Slide CurrentSlide { get; set; } = null!;

    public string SelectedUnit { get; set; } = null!;

    public string SelectedColorValue { get; set; } = null!;

    public IconType EditMode { get; set; } = default!;

    private float zoomLevel = 1.0f;

    public float ZoomLevel => zoomLevel;

    private Icon? draggingIcon;
    private bool drawingShape = false;
    private int draggingIconIndex = 0;
    private bool isDragging = false;
    private Point lastLineDragPosition = null!;
    private Icon? drawableIcon = null;

    private IUserService userService;
    private ITacticRepository tacticRepository;
    private IHubConnectionService hubConnectionService;
    private ITacticZoomService tacticZoomService;

    private IDisposable connection;

    public TacticCanvasService(
        IUserService userService,
        ITacticRepository tacticRepository,
        IHubConnectionService hubConnectionService,
        ITacticZoomService tacticZoomService)
    {
        this.userService = userService;
        this.tacticRepository = tacticRepository;
        this.hubConnectionService = hubConnectionService;
        this.tacticZoomService = tacticZoomService;

        tacticZoomService.OnZoomChanged += RefreshZoom;

        this.connection = hubConnectionService.Register(hub =>
            hub.On<string, object, object, object>(
            "ReceiveTacticUpdate", async (tacticId, updatedData, slideId, folderId) =>
                {
                    if (tacticId == CurrentTactic.Id)
                    {
                        Console.WriteLine($"Received update for tactic {tacticId}");
                        var json = updatedData.ToString();
                        var slideStringId = slideId.ToString();
                        var folderStringId = folderId.ToString();
                        var options = new JsonSerializerOptions()
                        {
                            PropertyNameCaseInsensitive = true,
                        };

                        CurrentTactic = JsonSerializer.Deserialize<Tactic>(json!, options)!;

                        if (slideStringId == CurrentSlide.Id && folderStringId == CurrentFolder.Id)
                        {
                            CurrentSlide = CurrentTactic.Folders
                                .Single(folder => folder.Id == folderStringId).Slides
                                .Single(slide => slide.Id == slideStringId);
                            CurrentFolder = CurrentTactic.Folders.Single(folder => folder.Id == folderStringId);
                        }

                        await OnGameStateChanged!.Invoke();
                    }
                }));
        this.tacticZoomService = tacticZoomService;
    }

    public List<Icon> GetRedrawIcons()
    {
        return CurrentSlide.Icons;
    }

    public string GetMap()
    {
        return CurrentSlide.MapPath!;
    }

    public async Task<Icon?> CreateDraggingIcon(Point pos)
    {
        if (drawingShape || !await userService.CheckHasEditAcces(CurrentTactic))
        {
            return null;
        }

        if (CurrentSlide.Icons
            .FirstOrDefault(icon => CheckLineClicked(pos, icon) || CheckUnitClicked(pos, icon))
            is Icon selectedIcon)
        {
            draggingIcon = selectedIcon with { };
            draggingIconIndex = CurrentSlide.Icons.IndexOf(selectedIcon);
            isDragging = true;
            lastLineDragPosition = pos;
            CurrentSlide.Icons.Remove(selectedIcon);
            return draggingIcon;
        }

        return null;
    }

    public async Task CreateIcon(Point pos)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return;
        }

        switch (EditMode)
        {
            case IconType.Unit:
                await PlaceIcon(pos);
                break;
            case IconType.StraightLine:
                SetStartPointForArrow(pos);
                drawingShape = true;
                break;
            case IconType.CurveLine:
                await AddCurvePoint(pos);
                drawingShape = true;
                break;
        }
    }

    private async Task AddCurvePoint(Point pos)
    {
        if (drawableIcon?.Type != IconType.CurveLine)
        {
            drawableIcon = null;
        }

        if (drawableIcon == null)
        {
            drawableIcon = new Icon
            {
                Points = [pos],
                Color = SelectedColorValue,
                FilePath = string.Empty,
                Type = IconType.CurveLine,
            };
            CurrentSlide.Icons.Add(drawableIcon);
            await tacticRepository.CreateIcon(CurrentTactic, CurrentFolder.Id, CurrentSlide.Id, drawableIcon);
        }
        else if (CircleSDF(pos, drawableIcon.Points.Last(), 5) is var dist && dist < 0)
        {
            drawableIcon = null!;
        }
        else
        {
            drawableIcon.Points.Add(pos);
            await tacticRepository.UpdateIcon(
                CurrentTactic,
                CurrentFolder.Id,
                CurrentSlide.Id,
                CurrentSlide.Icons.IndexOf(drawableIcon),
                drawableIcon);
        }

        await UpdateTactic();
    }

    private void SetStartPointForArrow(Point pos)
    {
        drawableIcon = new Icon
        {
            Points = [pos, pos],
            FilePath = string.Empty,
            Type = IconType.StraightLine,
            Color = SelectedColorValue,
        };
    }

    private async Task PlaceIcon(Point pos)
    {
        var unit = new Icon
        {
            Points = [pos, pos + new Point(40, 40)],
            FilePath = "/ConquerorsBladeData/Units/" + SelectedUnit,
            Type = IconType.Unit,
            Color = SelectedColorValue,
        };

        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }

        CurrentSlide.Icons.Add(unit);
        await tacticRepository.CreateIcon(CurrentTactic, CurrentFolder.Id, CurrentSlide.Id, unit);
        await UpdateTactic();
    }

    private async Task UpdateTactic()
    {
        await hubConnectionService.UpdateTactic(CurrentTactic.Id, CurrentTactic, CurrentSlide.Id, CurrentFolder.Id);
        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }
    }

    private bool CheckLineClicked(Point mouse, Icon icon) =>
        icon.Type == IconType.StraightLine &&
        LineSegmentSDF(mouse, icon.Points[0], icon.Points[1], 10f) < 0;

    private bool CheckUnitClicked(Point mouse, Icon icon) =>
        icon.Type == IconType.Unit &&
        mouse.X > icon.Points[0].X &&
        mouse.X < icon.Points[1].X &&
        mouse.Y > icon.Points[0].Y &&
        mouse.Y < icon.Points[1].Y;

    private static float CircleSDF(Point pos, Point circleCenter, float radius)
    {
        var distanceVector = pos - circleCenter;
        var distance = MathF
            .Sqrt(distanceVector.X * distanceVector.X + distanceVector.Y * distanceVector.Y);
        return distance - radius;
    }

    private static double LineSegmentSDF(Point p, Point start, Point end, double width)
    {
        var lineLengthX = end.X - start.X;
        var lineLengthY = end.Y - start.Y;
        var lengthSq = lineLengthX * lineLengthX + lineLengthY * lineLengthY;

        if (lengthSq == 0)
        {
            var distanceToPoint = Math
                .Sqrt((p.X - start.X) * (p.X - start.X) + (p.Y - start.Y) * (p.Y - start.Y)) - width * 0.5f;
            return distanceToPoint;
        }

        // Project point onto the line segment
        var normalizedProjection = ((p.X - start.X) * lineLengthX + (p.Y - start.Y) * lineLengthY) / lengthSq;
        normalizedProjection = Math.Max(0, Math.Min(1, normalizedProjection)); // Clamp to segment

        // Closest point on the segment
        var projectionX = start.X + normalizedProjection * lineLengthX;
        var projectionY = start.Y + normalizedProjection * lineLengthY;

        // Distance to closest point
        var distance = (float)Math.Sqrt(
            (p.X - projectionX) *
            (p.X - projectionX) + (p.Y - projectionY) *
            (p.Y - projectionY));

        return distance - width * 0.5f; // signed: negative inside the stroke
    }

    public async Task<List<Icon>?> DrawingInteraction(Point pos)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic) || !drawingShape)
        {
            return null;
        }

        var icons = CurrentSlide.Icons.ToList();

        if (EditMode == IconType.CurveLine && drawingShape && drawableIcon != null)
        {
            var tempDrawableIcon = drawableIcon with { Points = [.. drawableIcon.Points, pos] };
            icons.Remove(drawableIcon);
            icons.Add(tempDrawableIcon);
            return icons;
        }

        if (EditMode == IconType.StraightLine && drawingShape && drawableIcon != null)
        {
            drawableIcon.Points[1] = pos;
            icons.Add(drawableIcon);
            return icons;
        }

        return null;
    }

    public async Task<List<Icon>?> GrabbingInteraction(Point pos)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic) || !isDragging)
        {
            return null;
        }

        var icons = CurrentSlide.Icons.ToList();

        if (draggingIcon?.Type == IconType.Unit)
        {
            draggingIcon.Points[0] = pos;
            draggingIcon.Points[1] = pos + new Point(40, 40);
            icons.Add(draggingIcon);
            return icons;
        }
        else if (draggingIcon?.Type == IconType.StraightLine)
        {
            var delta = pos - lastLineDragPosition;
            draggingIcon.Points[0] = draggingIcon.Points[0] + delta;
            draggingIcon.Points[1] = draggingIcon.Points[1] + delta;
            lastLineDragPosition = pos;
            icons.Add(draggingIcon);
            return icons;
        }

        return null;
    }

    public async Task<List<Icon>?> StopInteraction()
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return null;
        }

        var icons = CurrentSlide.Icons.ToList();

        if (EditMode == IconType.StraightLine && drawingShape)
        {
            drawingShape = false;
            CurrentSlide.Icons.Add(drawableIcon);
            await tacticRepository.CreateIcon(CurrentTactic, CurrentFolder.Id, CurrentSlide.Id, drawableIcon);
            await UpdateTactic();
            return CurrentSlide.Icons;
        }

        if (draggingIcon != null)
        {
            isDragging = false;
            CurrentSlide.Icons.Add(draggingIcon);
            await tacticRepository
                .UpdateIcon(CurrentTactic, CurrentFolder.Id, CurrentSlide.Id, draggingIconIndex, draggingIcon);
            await UpdateTactic();
            return CurrentSlide.Icons;
        }

        return null;
    }

    public async Task UpdateServerTactic()
    {
        await UpdateTactic();
    }

    public async Task SetNeedsRedraw()
    {
        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }
    }

    private async Task RefreshZoom()
    {
        zoomLevel = tacticZoomService.ZoomLevel;

        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }
    }

    public async Task SetZoom(float zoomLevel)
    {
        await tacticZoomService.SetZoomLevel(zoomLevel);
    }

    public void Dispose()
    {
        connection.Dispose();
    }
}
