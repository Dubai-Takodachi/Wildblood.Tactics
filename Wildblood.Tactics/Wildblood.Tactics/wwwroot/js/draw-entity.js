import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
let iconFileNamesByType;
let ImageCache = {};
let app;
export function init(iconNames, application) {
    iconFileNamesByType = iconNames;
    app = application;
}
export async function drawEntity(entity) {
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
function drawLine(entity) {
    let g = new PIXI.Graphics();
    g = drawPath(g, entity, entity.path);
    g = drawLineEnd(g, entity, entity.path[entity.path.length - 2], entity.path[entity.path.length - 1]);
    return g;
}
function drawCurve(entity) {
    const curvePath = getSmoothCurve(entity.path);
    let g = new PIXI.Graphics();
    g = drawPath(g, entity, curvePath);
    g = drawLineEnd(g, entity, curvePath[curvePath.length - 2], curvePath[curvePath.length - 1]);
    return g;
}
function drawPath(g, entity, path) {
    if (entity.lineStyle === Tools.LineStyle.Normal) {
        for (var i = 0; i < path.length - 1; i++) {
            g.moveTo(path[i].x, path[i].y)
                .lineTo(path[i + 1].x, path[i + 1].y)
                .stroke({ width: entity.primarySize, color: entity.primaryColor });
        }
    }
    else if (entity.lineStyle === Tools.LineStyle.Dotted) {
        const stepSize = entity.primarySize * 3;
        const spacedPath = getEvenlySpacedPoints(path, stepSize);
        for (var i = 0; i < spacedPath.length; i++) {
            g.circle(spacedPath[i].x, spacedPath[i].y, entity.primarySize)
                .fill(entity.primaryColor);
        }
    }
    else if (entity.lineStyle === Tools.LineStyle.Dashed) {
        const stepSize = entity.primarySize * 3;
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
function getEvenlySpacedPoints(path, stepSize) {
    if (path.length < 2)
        return [];
    const result = [path[0]];
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
function drawLineEnd(g, entity, a, b) {
    if (entity.lineEnd === Tools.LineEnd.Arrow) {
        const headLength = entity.secondarySize;
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
    }
    else if (entity.lineEnd === Tools.LineEnd.Flat) {
        const headLength = entity.secondarySize;
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
        g.stroke({ width: entity.primarySize, color: entity.primaryColor });
    }
    return g;
}
function drawPingAnimation(entity) {
    const ring = new PIXI.Graphics();
    let size = 0;
    let alpha = 255;
    let lastTime = performance.now();
    const animate = (now) => {
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        size += 200 * delta;
        alpha -= 500 * delta;
        ring.clear();
        ring.circle(0, 0, size + 20).fill({
            color: entity.primaryColor + Math.max(0, Math.floor(alpha)).toString(16).padStart(2, '0')
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
function getSmoothCurve(points, segments = 16, tension = 0.2) {
    const result = [];
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
function getSmoothClosedCurve(points, segments = 16, tension = 0.2) {
    const result = [];
    const count = points.length;
    if (count < 2)
        return result;
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
async function drawIcon(entity) {
    const graphic = new PIXI.Graphics();
    let texture;
    if (!ImageCache[entity.iconType]) {
        texture = await PIXI.Assets.load("ConquerorsBladeData/Units/" + iconFileNamesByType[entity.iconType]);
        ImageCache[entity.iconType] = texture;
    }
    else {
        texture = ImageCache[entity.iconType];
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
                .fill(entity.secondaryColor);
        const textTexture = app.renderer.textureGenerator.generateTexture(label);
        graphic.texture(textTexture, "#ffffffff", labelX + labelPadding, labelY + labelPadding);
    }
    return graphic;
}
function drawText(entity) {
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
            container.addChild(new PIXI.Graphics()
                .rect(labelX, labelY, labelWidth, labelHeight)
                .fill(entity.secondaryColor));
        container.addChild(bitmap);
    }
    return container;
}
function convertTextToBitmapText(text) {
    const bitmapText = new PIXI.BitmapText(text);
    bitmapText.position.copyFrom(text.position);
    bitmapText.anchor?.set?.(text.anchor?.x || 0, text.anchor?.y || 0);
    return bitmapText;
}
function drawShape(entity) {
    if (!entity)
        return null;
    if (!entity.path)
        return null;
    let graphics = new PIXI.Graphics();
    let path = [];
    if (entity.shapeType === Tools.ShapeType.Circle) {
        path = getCirclePath(entity.path[0], entity.path[1]);
    }
    else if (entity.shapeType === Tools.ShapeType.Square) {
        path = getRectanglePath(entity.path[0], entity.path[1]);
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
function getCirclePath(a, b) {
    const radius = getDistance(a, b) / 2;
    const center = {
        x: ((a.x + b.x) / 2),
        y: ((a.y + b.y) / 2)
    };
    const path = [];
    const angleStep = (Math.PI * 2) / 64;
    for (let i = 0; i <= 64; i++) {
        const angle = angleStep * i;
        const x = center.x + (Math.cos(angle) * radius);
        const y = center.y + (Math.sin(angle) * radius);
        path.push({ x: x, y: y });
    }
    return path;
}
function getRectanglePath(a, c) {
    const b = { x: a.x, y: c.y };
    const d = { x: c.x, y: a.y };
    const path = [a, b, c, d, a];
    return path;
}
function getDistance(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
//# sourceMappingURL=draw-entity.js.map