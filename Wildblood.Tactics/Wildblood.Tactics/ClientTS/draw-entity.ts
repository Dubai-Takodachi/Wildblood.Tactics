import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';

let iconFileNamesByType: Record<string, string>;
let ImageCache: Record<string, PIXI.Texture> = {};
let app: PIXI.Application;

export function init(iconNames: Record<string, string>, application: PIXI.Application): void {
    iconFileNamesByType = iconNames;
    app = application;
}

export async function drawEntity(entity: Tools.Entity): Promise<PIXI.Graphics | null> {
    switch (entity.toolType) {
        case Tools.ToolType.DrawLine:
            return drawLine(entity);
        case Tools.ToolType.DrawFree:
            return drawLine(entity);
        case Tools.ToolType.DrawCurve:
            return drawCurve(entity);
        case Tools.ToolType.AddIcon:
            return await drawIcon(entity);
    }

    return null;
}

function drawLine(entity: Tools.Entity): PIXI.Graphics | null {
    let g = new PIXI.Graphics();

    g = drawPath(g, entity, entity.path!);
    g = drawLineEnd(g, entity, entity.path![entity.path!.length - 2], entity.path![entity.path!.length - 1]);

    return g;
}

function drawCurve(entity: Tools.Entity): PIXI.Graphics | null {
    const curvePath = getSmoothCurve(entity.path!)
    let g = new PIXI.Graphics();

    g = drawPath(g, entity, curvePath);
    g = drawLineEnd(g, entity, curvePath[curvePath!.length - 2], curvePath[curvePath.length - 1]);

    return g;
}

function drawPath(g: PIXI.Graphics, entity: Tools.Entity, path: Tools.Point[]): PIXI.Graphics {
    if (entity.lineStyle === Tools.LineStyle.Normal) {
        for (var i = 0; i < path.length - 1; i++) {
            g.moveTo(path[i].x, path[i].y)
                .lineTo(path[i + 1].x, path[i + 1].y)
                .stroke({ width: entity.primarySize, color: entity.primaryColor })
        }
    } else if (entity.lineStyle === Tools.LineStyle.Dotted) {
        const stepSize = entity.primarySize! * 3;
        const spacedPath = getEvenlySpacedPoints(path, stepSize);
        for (var i = 0; i < spacedPath.length; i++) {
            g.circle(spacedPath[i].x, spacedPath[i].y, entity.primarySize!)
                .fill(entity.primaryColor);
        }
    } else if (entity.lineStyle === Tools.LineStyle.Dashed) {
        const stepSize = entity.primarySize!;
        const spacedPath = getEvenlySpacedPoints(path, stepSize);
        for (var i = 0; i < spacedPath.length - 1; i++) {
            if (i % 3 > 0) {
                g.moveTo(spacedPath[i].x, spacedPath[i].y)
                    .lineTo(spacedPath[i + 1].x, spacedPath[i + 1].y)
                    .stroke({ width: entity.primarySize, color: entity.primaryColor });
            }
        }
    }

    return g;
}

function getEvenlySpacedPoints(path: Tools.Point[], stepSize: number): Tools.Point[] {
    if (path.length < 2) return [];

    const result: Tools.Point[] = [path[0]];
    let remaining = stepSize;
    let lastPoint = path[0];

    for (let i = 1; i < path.length; i++) {
        let curr = path[i];
        let dx = curr.x - lastPoint.x;
        let dy = curr.y - lastPoint.y;
        let segmentLength = Math.sqrt(dx * dx + dy * dy);

        while (segmentLength >= remaining) {
            let ratio = remaining / segmentLength;

            const newX = lastPoint.x + dx * ratio;
            const newY = lastPoint.y + dy * ratio;
            const newPoint = { x: newX, y: newY };

            result.push(newPoint);

            // Prepare for next step
            lastPoint = newPoint;
            dx = curr.x - lastPoint.x;
            dy = curr.y - lastPoint.y;
            segmentLength = Math.sqrt(dx * dx + dy * dy);
            remaining = stepSize;
        }

        // Remaining segment is smaller than stepSize, move to next
        remaining -= segmentLength;
        lastPoint = curr;
    }

    return result;
}

function drawLineEnd(g: PIXI.Graphics, entity: Tools.Entity, a: Tools.Point, b: Tools.Point) {
    if (entity.lineEnd === Tools.LineEnd.Arrow) {
        const headLength = entity.secondarySize!;
        const angle = Math.atan2(b.y - a.y, b.x - a.x);

        const arrowAngle1 = angle - Math.PI / 6; // 30 degrees
        const arrowAngle2 = angle + Math.PI / 6;

        const arrowPoint1 = {
            x: b.x - headLength * Math.cos(arrowAngle1),
            y: b.y - headLength * Math.sin(arrowAngle1),
        };

        const arrowPoint2 = {
            x: b.x - headLength * Math.cos(arrowAngle2),
            y: b.y - headLength * Math.sin(arrowAngle2),
        };

        g.moveTo(b.x, b.y)
            .lineTo(arrowPoint1.x, arrowPoint1.y)
            .moveTo(b.x, b.y)
            .lineTo(arrowPoint2.x, arrowPoint2.y)
            .stroke({ width: entity.primarySize, color: entity.primaryColor })
    } else if (entity.lineEnd === Tools.LineEnd.Flat) {
        const headLength = entity.secondarySize!;
        const angle = Math.atan2(b.y - a.y, b.x - a.x);

        const arrowAngle1 = angle - Math.PI / 2; // 90 degrees
        const arrowAngle2 = angle + Math.PI / 2;

        const arrowPoint1 = {
            x: b.x - headLength * Math.cos(arrowAngle1),
            y: b.y - headLength * Math.sin(arrowAngle1),
        };

        const arrowPoint2 = {
            x: b.x - headLength * Math.cos(arrowAngle2),
            y: b.y - headLength * Math.sin(arrowAngle2),
        };

        g.moveTo(b.x, b.y);
        g.lineTo(arrowPoint1.x, arrowPoint1.y);

        g.moveTo(b.x, b.y);
        g.lineTo(arrowPoint2.x, arrowPoint2.y);
        g.stroke({ width: entity.primarySize, color: entity.primaryColor })
    }

    return g;
}

function getSmoothCurve(points: { x: number, y: number }[], segments = 16, tension = 0.2): { x: number, y: number } [] {
    const result: { x: number, y: number }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;

        for (let t = 0; t <= segments; t++) {
            const s = t / segments;

            const s2 = s * s;
            const s3 = s2 * s;

            const m0x = (p2.x - p0.x) * tension;
            const m0y = (p2.y - p0.y) * tension;
            const m1x = (p3.x - p1.x) * tension;
            const m1y = (p3.y - p1.y) * tension;

            const a = 2 * s3 - 3 * s2 + 1;
            const b = s3 - 2 * s2 + s;
            const c = -2 * s3 + 3 * s2;
            const d = s3 - s2;

            const x = a * p1.x + b * m0x + c * p2.x + d * m1x;
            const y = a * p1.y + b * m0y + c * p2.y + d * m1y;

            result.push({ x, y });
        }
    }

    return result;
}

async function drawIcon(entity: Tools.Entity): Promise<PIXI.Graphics | null> {
    const graphic = new PIXI.Graphics();
    let texture: PIXI.Texture;
    if (!ImageCache[entity.iconType!]) {
        texture = await PIXI.Assets.load(
            "ConquerorsBladeData/Units/" + iconFileNamesByType[entity.iconType!]);
        ImageCache[entity.iconType!] = texture;
    }
    else {
        texture = ImageCache[entity.iconType!];
    }
    graphic.texture(texture, "#ffffffff", 0, 0, entity.primarySize, entity.primarySize);

    if (entity.text && entity.text !== "") {
        const labelStyle = new PIXI.TextStyle({
            fontSize: entity.secondarySize,
            fill: entity.primaryColor,
        });

        const label = new PIXI.Text({ text: entity.text, style: labelStyle });

        const labelPadding = 4;
        const labelWidth = label.width + labelPadding * 2;
        const labelHeight = label.height + labelPadding * 2;
        const labelX = 0 + (graphic.width - labelWidth) / 2;
        const labelY = 0 + graphic.height + 5;

        if (entity.hasBackground)
            graphic.rect(labelX, labelY, labelWidth, labelHeight)
                .fill(entity.secondaryColor)
                .stroke({ width: 1, color: 0xffffff });

        const textTexture = app.renderer.textureGenerator.generateTexture(label);
        graphic.texture(textTexture, "#ffffffff", labelX + labelPadding, labelY + labelPadding);
    }

    return graphic;
}

function calculateDistance(a: Tools.Point, b: Tools.Point): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getSteppedPointByCount(a: Tools.Point, b: Tools.Point, stepSize: number, stepCount: number): Tools.Point {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: a.x, y: a.y };

    const totalStepDistance = stepSize * stepCount;
    const ratio = totalStepDistance / distance;

    return {
        x: a.x + dx * ratio,
        y: a.y + dy * ratio
    };
}