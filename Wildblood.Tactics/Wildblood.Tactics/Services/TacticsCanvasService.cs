namespace Wildblood.Tactics.Services;

using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;

public class TacticsCanvasService : ITacticsCanvasService, IDisposable
{
    private IconType editMode;
    private Tactic tactic = null!;
    private Icon? draggingIcon;
    private bool drawingShape = false;
    private Folder currentFolder = null!;
    private Slide currentSlide = null!;
    private int draggingIconIndex = 0;
    private bool isDragging = false;
    private Point lastLineDragPosition = null!;
    private string selectedUnit = null!;
    private string colorValue = null!;
    private bool needsRedraw = false;
    private Icon drawableIcon = null!;

    private IUserService userService;
    private ITacticRepository tacticRepository;
    private IHubConnectionService hubConnectionService;

    private IDisposable connection;

    public TacticsCanvasService(
        IUserService userService,
        ITacticRepository tacticRepository,
        IHubConnectionService hubConnectionService)
    {
        this.userService = userService;
        this.tacticRepository = tacticRepository;
        this.hubConnectionService = hubConnectionService;

        this.connection = hubConnectionService.Register(hub =>
            hub.On<string, object, object, object>(
            "ReceiveTacticUpdate", async (tacticId, updatedData, slideId, folderId) =>
            {
                if (tacticId == tactic.Id)
                {
                    Console.WriteLine($"Received update for tactic {tacticId}");
                    var json = updatedData.ToString();
                    var slideStringId = slideId.ToString();
                    var folderStringId = folderId.ToString();
                    var options = new JsonSerializerOptions()
                    {
                        PropertyNameCaseInsensitive = true,
                    };

                    tactic = JsonSerializer.Deserialize<Tactic>(json!, options)!;

                    if (slideStringId == currentSlide.Id && folderStringId == currentFolder.Id)
                    {
                        currentSlide = tactic.Folders
                            .Single(folder => folder.Id == folderStringId).Slides
                            .Single(slide => slide.Id == slideStringId);
                        currentFolder = tactic.Folders.Single(folder => folder.Id == folderStringId);
                    }

                    needsRedraw = true;
                    ////await InvokeAsync(StateHasChanged);
                }
            }));
    }

    public List<Icon>? GetRedrawIconsWhenRequested()
    {
        if (needsRedraw)
        {
            needsRedraw = false;
            return currentSlide.Icons;
        }

        return null;
    }

    public void SetEditMode(IconType editMode) => this.editMode = editMode;

    public async Task<Icon?> CreateDraggingIcon(Point pos)
    {
        if (drawingShape || !await userService.CheckHasEditAcces(tactic))
        {
            return null;
        }

        if (currentSlide.Icons
            .FirstOrDefault(icon => CheckLineClicked(pos, icon) || CheckUnitClicked(pos, icon))
            is Icon selectedIcon)
        {
            draggingIcon = selectedIcon with { };
            draggingIconIndex = currentSlide.Icons.IndexOf(selectedIcon);
            isDragging = true;
            lastLineDragPosition = pos;
            currentSlide.Icons.Remove(selectedIcon);
            return draggingIcon;
        }

        return null;
    }

    public async Task CreateIcon(Point pos)
    {
        if (!await userService.CheckHasEditAcces(tactic))
        {
            return;
        }

        switch (editMode)
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
        if (drawableIcon == null)
        {
            drawableIcon = new Icon
            {
                Points = [pos],
                Color = colorValue,
                FilePath = string.Empty,
                Type = IconType.CurveLine,
            };
            currentSlide.Icons.Add(drawableIcon);
            await tacticRepository.CreateIcon(tactic, currentFolder.Id, currentSlide.Id, drawableIcon);
        }
        else if (CircleSDF(pos, drawableIcon.Points.Last(), 5) is var dist && dist < 0)
        {
            drawableIcon.Points.Add(pos);
            await tacticRepository.UpdateIcon(
                tactic,
                currentFolder.Id,
                currentSlide.Id,
                currentSlide.Icons.IndexOf(drawableIcon),
                drawableIcon);
            drawableIcon = null!;
        }
        else
        {
            drawableIcon.Points.Add(pos);
            await tacticRepository.UpdateIcon(
                tactic,
                currentFolder.Id,
                currentSlide.Id,
                currentSlide.Icons.IndexOf(drawableIcon),
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
            Color = colorValue,
        };
    }

    private async Task PlaceIcon(Point pos)
    {
        var unit = new Icon
        {
            Points = [pos, pos + new Point(40, 40)],
            FilePath = "/ConquerorsBladeData/Units/" + selectedUnit,
            Type = IconType.Unit,
            Color = colorValue,
        };

        needsRedraw = true;
        ////await JS.InvokeVoidAsync("placeIcon", unit);

        currentSlide.Icons.Add(unit);
        await tacticRepository.CreateIcon(tactic, currentFolder.Id, currentSlide.Id, unit);
        await UpdateTactic();
    }

    private async Task UpdateTactic()
    {
        await hubConnectionService.UpdateTactic(tactic.Id, tactic, currentSlide.Id, currentFolder.Id);
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
        if (!await userService.CheckHasEditAcces(tactic) || !drawingShape)
        {
            return null;
        }

        var icons = currentSlide.Icons.ToList();

        if (editMode == IconType.CurveLine && drawingShape && drawableIcon != null)
        {
            var tempDrawableIcon = drawableIcon with { Points = [.. drawableIcon.Points, pos] };
            icons.Remove(drawableIcon);
            icons.Add(tempDrawableIcon);
            return icons;
        }

        if (editMode == IconType.StraightLine && drawingShape && drawableIcon != null)
        {
            drawableIcon.Points[1] = pos;
            icons.Add(drawableIcon);
            return icons;
        }

        return null;
    }

    public async Task<List<Icon>?> GrabbingInteraction(Point pos)
    {
        if (!await userService.CheckHasEditAcces(tactic) || !isDragging)
        {
            return null;
        }

        var icons = currentSlide.Icons.ToList();

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
        if (!await userService.CheckHasEditAcces(tactic))
        {
            return null;
        }

        var icons = currentSlide.Icons.ToList();

        if (editMode == IconType.StraightLine && drawingShape)
        {
            drawingShape = false;
            currentSlide.Icons.Add(drawableIcon);
            await tacticRepository.CreateIcon(tactic, currentFolder.Id, currentSlide.Id, drawableIcon);
            return currentSlide.Icons;
        }

        if (draggingIcon != null)
        {
            isDragging = false;
            currentSlide.Icons.Add(draggingIcon);
            await tacticRepository
                .UpdateIcon(tactic, currentFolder.Id, currentSlide.Id, draggingIconIndex, draggingIcon);
            await UpdateTactic();
            return currentSlide.Icons;
        }

        return null;
    }

    public async Task SetMap(string mapPath)
    {
        currentSlide.MapPath = mapPath;
        await tacticRepository.UpdateMap(tactic, currentFolder.Id, currentSlide.Id, mapPath);
    }

    public void SetSelectedUnit(string unit)
    {
        selectedUnit = unit;
    }

    public void SetColorValue(string color)
    {
        colorValue = color;
    }

    public void Dispose()
    {
        connection.Dispose();
    }
}
