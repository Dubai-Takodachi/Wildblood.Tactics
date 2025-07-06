import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';

let iconFileNamesByType: Record<string, string>;
let ImageCache: Record<string, PIXI.Texture> = {};

export function init(iconNames: Record<string, string>): void {
    iconFileNamesByType = iconNames;
}

export async function drawEntity(entity: Tools.Entity): Promise<PIXI.Graphics | null> {
    switch (entity.toolType) {
        case Tools.ToolType.DrawLine:
            return drawLine(entity);
        case Tools.ToolType.AddIcon:
            return await drawIcon(entity);
    }

    return null;
}

function drawLine(entity: Tools.Entity): PIXI.Graphics | null {
    const g = new PIXI.Graphics();

    if (entity.lineStyle === Tools.LineStyle.Normal) {
        g.moveTo(entity.path![0].x, entity.path![0].y)
            .lineTo(entity.path![1].x, entity.path![1].y)
            .stroke({ width: entity.primarySize, color: entity.primaryColor })
    } else if (entity.lineStyle === Tools.LineStyle.Dotted) {
        const dx = entity.path![1].x - entity.path![0].x;
        const dy = entity.path![1].y - entity.path![0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dots = Math.floor((distance / entity.primarySize!) / 4);

        const stepDistX = dx / dots;
        const stepDistY = dy / dots;

        for (let i = 0; i < dots; i++) {
            const stepX = entity.path![0].x + stepDistX * i;
            const stepY = entity.path![0].y + stepDistY * i;
            g.circle(stepX, stepY, entity.primarySize!)
                .fill(entity.primaryColor);
        }
    } else if (entity.lineStyle === Tools.LineStyle.Dashed) {
        const dashLength = entity.primarySize! * 3;
        const gapLength = entity.primarySize!;
        const dx = entity.path![1].x - entity.path![0].x;
        const dy = entity.path![1].y - entity.path![0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dashCount = Math.floor(distance / (dashLength + gapLength));

        const stepX = dx / dashCount;
        const stepY = dy / dashCount;

        const dashX = (dashLength / (dashLength + gapLength)) * stepX;
        const dashY = (dashLength / (dashLength + gapLength)) * stepY;

        for (let i = 0; i < dashCount; i++) {
            const x1 = entity.path![0].x + i * stepX;
            const y1 = entity.path![0].y + i * stepY;
            const x2 = x1 + dashX;
            const y2 = y1 + dashY;

            g.moveTo(x1, y1)
                .lineTo(x2, y2)
                .stroke({ width: entity.primarySize, color: entity.primaryColor });
        }
    }

    if (entity.lineEnd === Tools.LineEnd.Arrow) {
        const headLength = entity.secondarySize!;
        const angle = Math.atan2(entity.path![1].y - entity.path![0].y, entity.path![1].x - entity.path![0].x);

        const arrowAngle1 = angle - Math.PI / 6; // 30 degrees
        const arrowAngle2 = angle + Math.PI / 6;

        const arrowPoint1 = {
            x: entity.path![1].x - headLength * Math.cos(arrowAngle1),
            y: entity.path![1].y - headLength * Math.sin(arrowAngle1),
        };

        const arrowPoint2 = {
            x: entity.path![1].x - headLength * Math.cos(arrowAngle2),
            y: entity.path![1].y - headLength * Math.sin(arrowAngle2),
        };

        g.moveTo(entity.path![1].x, entity.path![1].y)
            .lineTo(arrowPoint1.x, arrowPoint1.y)
            .moveTo(entity.path![1].x, entity.path![1].y)
            .lineTo(arrowPoint2.x, arrowPoint2.y)
            .stroke({ width: entity.primarySize, color: entity.primaryColor })
    } else if (entity.lineEnd === Tools.LineEnd.Flat) {
        const headLength = entity.secondarySize!;
        const angle = Math.atan2(entity.path![1].y - entity.path![0].y, entity.path![1].x - entity.path![0].x);

        const arrowAngle1 = angle - Math.PI / 2; // 90 degrees
        const arrowAngle2 = angle + Math.PI / 2;

        const arrowPoint1 = {
            x: entity.path![1].x - headLength * Math.cos(arrowAngle1),
            y: entity.path![1].y - headLength * Math.sin(arrowAngle1),
        };

        const arrowPoint2 = {
            x: entity.path![1].x - headLength * Math.cos(arrowAngle2),
            y: entity.path![1].y - headLength * Math.sin(arrowAngle2),
        };

        g.moveTo(entity.path![1].x, entity.path![1].y);
        g.lineTo(arrowPoint1.x, arrowPoint1.y);

        g.moveTo(entity.path![1].x, entity.path![1].y);
        g.lineTo(arrowPoint2.x, arrowPoint2.y);
        g.stroke({ width: entity.primarySize, color: entity.primaryColor })
    }

    return g;
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
    graphic.texture(texture);
    graphic.setSize(entity.primarySize!);
    return graphic;
}