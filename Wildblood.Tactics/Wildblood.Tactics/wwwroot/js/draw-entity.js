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
    }
    return null;
}
function drawLine(entity) {
    let g = new PIXI.Graphics();
    for (var i = 0; i < entity.path.length - 1; i++) {
        g = drawLinePointToPoint(g, entity, entity.path[i], entity.path[i + 1]);
    }
    g = drawLineEnd(g, entity, entity.path[entity.path.length - 2], entity.path[entity.path.length - 1]);
    return g;
}
function drawCurve(entity) {
    const curvePath = getSmoothCurve(entity.path);
    let g = new PIXI.Graphics();
    for (var i = 0; i < curvePath.length - 1; i++) {
        g = drawLinePointToPoint(g, entity, curvePath[i], curvePath[i + 1]);
    }
    g = drawLineEnd(g, entity, curvePath[curvePath.length - 2], curvePath[curvePath.length - 1]);
    return g;
}
function drawLinePointToPoint(g, entity, a, b) {
    if (entity.lineStyle === Tools.LineStyle.Normal) {
        g.moveTo(a.x, a.y)
            .lineTo(b.x, b.y)
            .stroke({ width: entity.primarySize, color: entity.primaryColor });
    }
    else if (entity.lineStyle === Tools.LineStyle.Dotted) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dots = Math.floor((distance / entity.primarySize) / 4);
        const stepDistX = dx / dots;
        const stepDistY = dy / dots;
        for (let i = 0; i < dots; i++) {
            const stepX = a.x + stepDistX * i;
            const stepY = a.y + stepDistY * i;
            g.circle(stepX, stepY, entity.primarySize)
                .fill(entity.primaryColor);
        }
    }
    else if (entity.lineStyle === Tools.LineStyle.Dashed) {
        const dashLength = entity.primarySize * 3;
        const gapLength = entity.primarySize;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dashCount = Math.floor(distance / (dashLength + gapLength));
        const stepX = dx / dashCount;
        const stepY = dy / dashCount;
        const dashX = (dashLength / (dashLength + gapLength)) * stepX;
        const dashY = (dashLength / (dashLength + gapLength)) * stepY;
        for (let i = 0; i < dashCount; i++) {
            const x1 = a.x + i * stepX;
            const y1 = a.y + i * stepY;
            const x2 = x1 + dashX;
            const y2 = y1 + dashY;
            g.moveTo(x1, y1)
                .lineTo(x2, y2)
                .stroke({ width: entity.primarySize, color: entity.primaryColor });
        }
    }
    return g;
}
function drawLineEnd(g, entity, a, b) {
    if (entity.lineEnd === Tools.LineEnd.Arrow) {
        const headLength = entity.secondarySize;
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
            .stroke({ width: entity.primarySize, color: entity.primaryColor });
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
                .fill(entity.secondaryColor)
                .stroke({ width: 1, color: 0xffffff });
        const textTexture = app.renderer.textureGenerator.generateTexture(label);
        graphic.texture(textTexture, "#ffffffff", labelX + labelPadding, labelY + labelPadding);
    }
    return graphic;
}
//# sourceMappingURL=draw-entity.js.map