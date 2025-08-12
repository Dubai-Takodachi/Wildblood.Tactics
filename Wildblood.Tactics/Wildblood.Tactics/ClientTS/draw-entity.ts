import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';

let units: Tools.Unit[];
let ImageCache: Record<string, PIXI.Texture> = {};
let app: PIXI.Application;

export function init(
    initUnits: Tools.Unit[],
    application: PIXI.Application): void {

    units = initUnits;
    app = application;
}

export async function drawEntity(entity: Tools.Entity): Promise<PIXI.Container | null> {
    switch (entity.toolType) {
        case Tools.ToolType.DrawLine:
            return drawLine(entity);
        case Tools.ToolType.DrawFree:
            return drawLine(entity);
        case Tools.ToolType.DrawCurve:
            return drawCurve(entity);
        case Tools.ToolType.AddIcon:
            return await drawIcon(entity);
        case Tools.ToolType.Ping:
            return drawPingAnimation(entity);
        case Tools.ToolType.AddText:
            return drawText(entity);
        case Tools.ToolType.AddShape:
            return drawShape(entity);
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
                .lineTo(path[i + 1].x, path[i + 1].y);
        }

        g.closePath()
            .stroke({ width: entity.primarySize, color: entity.primaryColor, join: 'round', cap: 'round' });

    } else if (entity.lineStyle === Tools.LineStyle.Dotted) {
        const stepSize = entity.primarySize! * 3;
        const spacedPath = getEvenlySpacedPoints(path, stepSize);
        for (var i = 0; i < spacedPath.length; i++) {
            g.circle(spacedPath[i].x, spacedPath[i].y, entity.primarySize!)
                .fill(entity.primaryColor);
        }
    } else if (entity.lineStyle === Tools.LineStyle.Dashed) {
        const stepSize = entity.primarySize! * 3;
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

        const c = {
            x: b.x + headLength * Math.cos(angle),
            y: b.y + headLength * Math.sin(angle),
        };

        const arrowAngle1 = angle - Math.PI / 6;
        const arrowAngle2 = angle + Math.PI / 6;

        const arrowPoint1 = {
            x: b.x - headLength * Math.cos(arrowAngle1),
            y: b.y - headLength * Math.sin(arrowAngle1),
        };

        const arrowPoint2 = {
            x: b.x - headLength * Math.cos(arrowAngle2),
            y: b.y - headLength * Math.sin(arrowAngle2),
        };

        g.moveTo(c.x, c.y);
        g.lineTo(arrowPoint1.x, arrowPoint1.y);
        g.lineTo(arrowPoint2.x, arrowPoint2.y);
        g.closePath();
        g.fill(entity.primaryColor);
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

function drawPingAnimation(entity: Tools.Entity): PIXI.Graphics | null {
    const ring = new PIXI.Graphics();

    let size = -20;
    let alpha = 400;

    let lastTime = performance.now();

    const baseColor = normalizeColor(entity.primaryColor!);

    const animate = (now: number) => {
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        size += 200 * delta;
        alpha -= 700 * delta;

        ring.clear();
        ring.circle(0, 0, size + 20).fill({
            color: baseColor,
            alpha: Math.min(Math.max(0, alpha / 255), 1),
        });
        ring.circle(0, 0, size).cut();

        if (alpha <= 0) {
            ring.parent?.removeChild(ring);
            ring.destroy();
            return;
        }

        requestAnimationFrame(animate);
    };

    ring.on('added', () => {
        requestAnimationFrame(animate);
    });

    return ring;
}

function normalizeColor(input: string): string {
    let hex = input.trim().toLowerCase();

    // Remove leading #
    if (hex.startsWith('#')) hex = hex.slice(1);

    // Remove alpha if 8 chars (rrggbbaa)
    if (hex.length === 8) hex = hex.slice(0, 6);

    // If only 3 chars (shorthand), expand to 6
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    // Pad if needed (e.g. rrggb -> rrggb0)
    hex = hex.padEnd(6, '0');

    return `#${hex}`;
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

function getSmoothClosedCurve(
    points: { x: number, y: number }[],
    segments = 16,
    tension = 0.2
): { x: number, y: number }[] {
    const result: { x: number, y: number }[] = [];

    const count = points.length;
    if (count < 2) return result;

    for (let i = 0; i < count; i++) {
        const p0 = points[(i - 1 + count) % count];
        const p1 = points[i];
        const p2 = points[(i + 1) % count];
        const p3 = points[(i + 2) % count];

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

async function drawIcon(entity: Tools.Entity): Promise<PIXI.Container | null> {
    const container = new PIXI.Container();

    const texture = await PIXI.Assets.load(
        "ConquerorsBladeData/Units/" + units.find(u => u.name == entity.unitName!)?.path);

    if (!texture) {
        return null;
    }

    const sprite = new PIXI.Sprite({
        texture: texture,
        x: 0,
        y: 0,
        width: entity.primarySize,
        height: entity.primarySize
    });

    container.addChild(sprite);

    if (entity.text && entity.text !== "") {
        const labelStyle = new PIXI.TextStyle({
            fontSize: entity.secondarySize,
            fill: entity.primaryColor,
        });

        const label = new PIXI.Text({ text: entity.text, style: labelStyle });

        const labelPadding = 4;
        const labelWidth = label.width + labelPadding * 2;
        const labelHeight = label.height + labelPadding * 2;
        const labelX = 0 + (container.width - labelWidth) / 2;
        const labelY = 0 + container.height + 5;

        label.x = labelX + labelPadding;
        label.y = labelY + labelPadding;

        const bitmap = convertTextToBitmapText(label);

        if (entity.hasBackground)
            container.addChild(
                new PIXI.Graphics()
                    .rect(labelX, labelY, labelWidth, labelHeight)
                    .fill(entity.secondaryColor));

        container.addChild(bitmap);
    }

    return container;
}

function drawText(entity: Tools.Entity): PIXI.Container | null {
    const container = new PIXI.Container();

    if (entity.text && entity.text !== "") {
        const textStyle = new PIXI.TextStyle({
            fontSize: entity.primarySize,
            fill: entity.primaryColor,
        });

        const label = new PIXI.Text({ text: entity.text, style: textStyle });

        const labelPadding = 4;
        const labelWidth = label.width + labelPadding * 2;
        const labelHeight = label.height + labelPadding * 2;
        const labelX = 0 + (container.width - labelWidth) / 2;
        const labelY = 0 + (container.height - labelHeight) / 2;

        label.x = labelX + labelPadding;
        label.y = labelY + labelPadding;

        const bitmap = convertTextToBitmapText(label);

        if (entity.hasBackground)
            container.addChild(
                new PIXI.Graphics()
                    .rect(labelX, labelY, labelWidth, labelHeight)
                    .fill(entity.secondaryColor));

        container.addChild(bitmap);
    }

    return container;
}

function convertTextToBitmapText(text: PIXI.Text): PIXI.BitmapText {
    const bitmapText = new PIXI.BitmapText(text);

    bitmapText.position.copyFrom(text.position);
    bitmapText.anchor?.set?.(text.anchor?.x || 0, text.anchor?.y || 0);
    return bitmapText;
}

function drawShape(entity: Tools.Entity): PIXI.Graphics | null {
    if (!entity) return null;
    if (!entity.path) return null;
    let graphics = new PIXI.Graphics();
    let path: Tools.Point[] = [];

    if (entity.shapeType === Tools.ShapeType.Circle) {
        path = getCirclePath(entity!.path[0], entity!.path[1]);
    }
    else if (entity.shapeType === Tools.ShapeType.Square) {
        path = getRectanglePath(entity!.path[0], entity!.path[1]);
    }
    else if (entity.shapeType === Tools.ShapeType.Polygon) {
        path = [...entity.path, entity.path[0]];
    }
    else if (entity.shapeType === Tools.ShapeType.Area) {
        path = getSmoothClosedCurve(entity.path);
    }

    graphics.poly(path);
    graphics.fill({ color: entity.secondaryColor, });
    graphics = drawPath(graphics, entity, path);
    return graphics;
}

function getCirclePath(a: Tools.Point, b: Tools.Point): Tools.Point[] {
    const radius = getDistance(a, b) / 2
    const center = {
        x: ((a.x + b.x) / 2),
        y: ((a.y + b.y) / 2)
    }

    const path: Tools.Point[] = [];
    const angleStep = (Math.PI * 2) / 64;

    for (let i = 0; i <= 64; i++) {
        const angle = angleStep * i;
        const x = center.x + (Math.cos(angle) * radius);
        const y = center.y + (Math.sin(angle) * radius);
        path.push({ x: x, y: y });
    }

    return path;
}

function getRectanglePath(a: Tools.Point, c: Tools.Point): Tools.Point[] {
    const b: Tools.Point = { x: a.x, y: c.y };
    const d: Tools.Point = { x: c.x, y: a.y };
    const path: Tools.Point[] = [a, b, c, d, a];
    return path;
}

function getDistance(a: Tools.Point, b: Tools.Point): number{
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}