import * as Tools from './tools-types.js';
import * as PIXI from '../lib/pixi.mjs';
export class DrawLineTool {
    context;
    lineOptions;
    start = null;
    entitiyId = null;
    constructor(context, lineOptions) {
        this.context = context;
        this.lineOptions = lineOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    async onPointerDown(event) {
        if (event.button !== 0)
            return;
        const pos = getPosition(event, this.context);
        this.start = pos;
        this.entitiyId = crypto.randomUUID();
    }
    async onPointerMove(event) {
        if (!this.start || !this.entitiyId) {
            this.start = null;
            this.entitiyId = null;
            return;
        }
        const pos = getPosition(event, this.context);
        const line = this.createLine(pos.x, pos.y, this.entitiyId);
        if (line)
            await this.context.setPreviewEntityCallback(line);
    }
    async onPointerUp(event) {
        if (event.button !== 0)
            return;
        if (!this.start || !this.entitiyId) {
            this.start = null;
            this.entitiyId = null;
            return;
        }
        const pos = getPosition(event, this.context);
        const line = this.createLine(pos.x, pos.y, this.entitiyId);
        if (line)
            await this.context.addEntityCallback(line);
        this.start = null;
        this.entitiyId = null;
        this.context.setPreviewEntityCallback(null);
    }
    createLine(x, y, entityId) {
        if (!this.start)
            return null;
        const position = {
            x: Math.min(this.start.x, x),
            y: Math.min(this.start.y, y)
        };
        let line = {
            id: entityId,
            toolType: Tools.ToolType.DrawLine,
            position: position,
            path: [
                { x: this.start.x - position.x, y: this.start.y - position.y },
                { x: x - position.x, y: y - position.y }
            ],
            lineEnd: this.lineOptions.lineEnd,
            lineStyle: this.lineOptions.lineStyle,
            primarySize: this.lineOptions.thickness,
            secondarySize: this.lineOptions.endSize,
            primaryColor: this.lineOptions.color,
        };
        return line;
    }
}
export class DrawCurve {
    context;
    lineOptions;
    path = [];
    entityId = null;
    constructor(context, lineOptions) {
        this.context = context;
        this.lineOptions = lineOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    async onPointerDown(event) {
        if (event.button !== 0)
            return;
        const pos = getPosition(event, this.context);
        if (this.path.length === 0) {
            this.path.push(pos);
            this.entityId = crypto.randomUUID();
            return;
        }
        if (this.calculateDistance(pos, this.path[this.path.length - 1]) < 10) {
            const curve = this.createCurve(this.path);
            if (curve)
                await this.context.addEntityCallback(curve);
            this.path = [];
            return;
        }
        this.path.push(pos);
        const curve = this.createCurve(this.path);
        if (curve)
            await this.context.addEntityCallback(curve);
    }
    async onPointerMove(event) {
        const pos = getPosition(event, this.context);
        if (this.path.length === 0 || !this.entityId) {
            this.path = [];
            this.entityId = null;
            return;
        }
        if (this.calculateDistance(pos, this.path[this.path.length - 1]) < 10) {
            return;
        }
        const curve = this.createCurve(([...this.path, pos]));
        if (curve)
            await this.context.setPreviewEntityCallback(curve);
    }
    calculateDistance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
    createCurve(path) {
        if (path.length < 1 || !this.entityId)
            return null;
        const position = {
            x: Math.min(...path.map(p => p.x)),
            y: Math.min(...path.map(p => p.y))
        };
        let curve = {
            id: this.entityId,
            toolType: Tools.ToolType.DrawCurve,
            position: position,
            path: path.map(p => ({ x: p.x - position.x, y: p.y - position.y })),
            lineEnd: this.lineOptions.lineEnd,
            lineStyle: this.lineOptions.lineStyle,
            primarySize: this.lineOptions.thickness,
            secondarySize: this.lineOptions.endSize,
            primaryColor: this.lineOptions.color,
        };
        return curve;
    }
}
export class DrawFree {
    context;
    lineOptions;
    path = [];
    entityId = null;
    constructor(context, lineOptions) {
        this.context = context;
        this.lineOptions = lineOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    async onPointerDown(event) {
        if (event.button !== 0)
            return;
        const pos = getPosition(event, this.context);
        this.entityId = crypto.randomUUID();
        this.path = [pos];
    }
    async onPointerMove(event) {
        if (this.path.length === 0)
            return;
        const pos = getPosition(event, this.context);
        if (calculateDistance(pos, this.path[this.path.length - 1]) >= 1.4) {
            this.path.push(pos);
            const freeDrawing = this.createFreeDrawing(this.path);
            if (freeDrawing)
                await this.context.setPreviewEntityCallback(freeDrawing);
        }
    }
    async onPointerUp(event) {
        if (event.button !== 0)
            return;
        if (this.path.length === 0)
            return;
        const freeDrawing = this.createFreeDrawing(this.path);
        if (freeDrawing)
            await this.context.addEntityCallback(freeDrawing);
        this.path = [];
        this.entityId = null;
    }
    createFreeDrawing(path) {
        if (path.length === 0 || !this.entityId)
            return null;
        const position = {
            x: Math.min(...path.map(p => p.x)),
            y: Math.min(...path.map(p => p.y))
        };
        let freeDrawing = {
            id: this.entityId,
            toolType: Tools.ToolType.DrawFree,
            position: position,
            path: path.map(p => ({ x: p.x - position.x, y: p.y - position.y })),
            lineEnd: this.lineOptions.lineEnd,
            lineStyle: this.lineOptions.lineStyle,
            primarySize: this.lineOptions.thickness,
            secondarySize: this.lineOptions.endSize,
            primaryColor: this.lineOptions.color,
        };
        return freeDrawing;
    }
}
export class PlaceIconTool {
    context;
    iconOptions;
    entitiyId = crypto.randomUUID();
    constructor(context, iconOptions) {
        this.context = context;
        this.iconOptions = iconOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    async onPointerDown(event) {
        if (event.button !== 0)
            return;
        const pos = getPosition(event, this.context);
        const icon = this.createIcon(pos.x - (this.iconOptions.iconSize / 2), pos.y - (this.iconOptions.iconSize / 2), this.entitiyId);
        if (icon)
            await this.context.addEntityCallback(icon);
        this.entitiyId = crypto.randomUUID();
    }
    async onPointerMove(event) {
        const pos = getPosition(event, this.context);
        const icon = this.createIcon(pos.x - (this.iconOptions.iconSize / 2), pos.y - (this.iconOptions.iconSize / 2), this.entitiyId);
        if (icon)
            await this.context.setPreviewEntityCallback(icon);
    }
    createIcon(x, y, entityId) {
        const position = {
            x: x,
            y: y
        };
        let icon = {
            id: entityId,
            toolType: Tools.ToolType.AddIcon,
            position: position,
            iconType: this.iconOptions.iconType,
            primarySize: this.iconOptions.iconSize,
            text: this.iconOptions.labelOptions.text,
            secondarySize: this.iconOptions.labelOptions.size,
            primaryColor: this.iconOptions.labelOptions.color,
            hasBackground: this.iconOptions.labelOptions.hasBackground,
            secondaryColor: this.iconOptions.labelOptions.backgroundColor,
        };
        return icon;
    }
}
export class PlaceTextTool {
    context;
    textOptions;
    entitiyId = crypto.randomUUID();
    constructor(context, textOptions) {
        this.context = context;
        this.textOptions = textOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    async onPointerDown(event) {
        if (event.button !== 0)
            return;
        const pos = getPosition(event, this.context);
        const text = this.createText(pos.x, pos.y, this.entitiyId);
        if (text)
            await this.context.addEntityCallback(text);
        this.entitiyId = crypto.randomUUID();
    }
    async onPointerMove(event) {
        const pos = getPosition(event, this.context);
        const text = this.createText(pos.x, pos.y, this.entitiyId);
        if (text)
            await this.context.setPreviewEntityCallback(text);
    }
    createText(x, y, entityId) {
        const position = {
            x: x,
            y: y
        };
        let icon = {
            id: entityId,
            toolType: Tools.ToolType.AddText,
            position: position,
            primarySize: this.textOptions.size,
            text: this.textOptions.text,
            primaryColor: this.textOptions.color,
            hasBackground: this.textOptions.hasBackground,
            secondaryColor: this.textOptions.backgroundColor,
        };
        return icon;
    }
}
export class MoveTool {
    context;
    entityId = null;
    entityClickedPosition = null;
    drawnSpriteByEntityId;
    currentEntities;
    constructor(context, currentEntities, drawnSpriteByEntityId) {
        this.context = context;
        this.drawnSpriteByEntityId = drawnSpriteByEntityId;
        this.currentEntities = currentEntities;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    async onPointerDown(event) {
        if (event.button !== 0)
            return;
        const pos = getPosition(event, this.context);
        const keys = Object.keys(this.drawnSpriteByEntityId).reverse();
        for (const key of keys) {
            const sprite = this.drawnSpriteByEntityId[key];
            if (!sprite.position)
                continue;
            const entity = this.currentEntities[key];
            const spriteLocal = { x: pos.x - sprite.x, y: pos.y - sprite.y };
            const entityLocal = { x: pos.x - entity.position.x, y: pos.y - entity.position.y };
            if (hitTestPixelPerfect(sprite, spriteLocal, this.context.app)) {
                this.entityClickedPosition = entityLocal;
                this.entityId = key;
                break;
            }
        }
    }
    async onPointerMove(event) {
        if (!this.entityId || !this.entityClickedPosition)
            return;
        const pos = getPosition(event, this.context);
        this.currentEntities[this.entityId].position = {
            x: pos.x - this.entityClickedPosition.x,
            y: pos.y - this.entityClickedPosition.y
        };
        await this.context.setPreviewEntityCallback({ ...this.currentEntities[this.entityId] });
    }
    async onPointerUp(event) {
        if (event.button !== 0)
            return;
        if (!this.entityId)
            return;
        await this.context.addEntityCallback({ ...this.currentEntities[this.entityId] });
        this.entityId = null;
        this.entityClickedPosition = null;
    }
}
export class EraseTool {
    context;
    drawnSpriteByEntityId;
    constructor(context, drawnSpriteByEntityId) {
        this.context = context;
        this.drawnSpriteByEntityId = drawnSpriteByEntityId;
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    async onPointerMove(event) {
        if ((event.buttons & 1) !== 1)
            return;
        const pos = getPosition(event, this.context);
        const keys = Object.keys(this.drawnSpriteByEntityId);
        for (const key of keys) {
            const sprite = this.drawnSpriteByEntityId[key];
            if (!sprite.position)
                continue;
            const local = { x: pos.x - sprite.x, y: pos.y - sprite.y };
            if (hitTestPixelPerfect(sprite, local, this.context.app)) {
                this.context.removeEntityCallback(key);
            }
        }
    }
}
export class PingTool {
    context;
    lastPingTime = 0;
    constructor(context) {
        this.context = context;
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    async onPointerMove(event) {
        if ((event.buttons & 1) !== 1)
            return;
        if (performance.now() - this.lastPingTime < 100)
            return;
        this.lastPingTime = performance.now();
        let ping = {
            id: crypto.randomUUID(),
            toolType: Tools.ToolType.Ping,
            position: getPosition(event, this.context),
        };
        await this.context.addEntityCallback(ping);
        await delay(50);
        await this.context.removeEntityCallback(ping.id);
    }
}
export class DrawShapeTool {
    context;
    shapeOptions;
    path = [];
    entitiyId = null;
    constructor(context, shapeOptions) {
        this.context = context;
        this.shapeOptions = shapeOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    async onPointerDown(event) {
        if (event.button !== 0)
            return;
        const pos = getPosition(event, this.context);
        if (this.shapeOptions.shapeType === Tools.ShapeType.Circle ||
            this.shapeOptions.shapeType === Tools.ShapeType.Square) {
            this.entitiyId = crypto.randomUUID();
            this.path = [pos];
            return;
        }
        if (this.shapeOptions.shapeType === Tools.ShapeType.Polygon ||
            this.shapeOptions.shapeType === Tools.ShapeType.Area) {
            if (this.path.length === 0) {
                this.entitiyId = crypto.randomUUID();
                this.path.push(pos);
                return;
            }
            if (calculateDistance(this.path[this.path.length - 1], pos) < 5) {
                const shape = this.createShape(this.path);
                if (shape)
                    await this.context.addEntityCallback(shape);
                this.path = [];
                return;
            }
            this.path.push(pos);
        }
    }
    async onPointerMove(event) {
        const pos = getPosition(event, this.context);
        if (this.shapeOptions.shapeType === Tools.ShapeType.Circle ||
            this.shapeOptions.shapeType === Tools.ShapeType.Square) {
            if ((event.buttons & 1) !== 1)
                return;
            if (this.path.length === 0)
                return;
            const shape = this.createShape([...this.path, pos]);
            if (shape)
                await this.context.setPreviewEntityCallback(shape);
            return;
        }
        if (this.shapeOptions.shapeType === Tools.ShapeType.Polygon ||
            this.shapeOptions.shapeType === Tools.ShapeType.Area) {
            if (this.path.length === 0)
                return;
            const shape = this.createShape([...this.path, pos]);
            if (shape)
                await this.context.setPreviewEntityCallback(shape);
            return;
        }
    }
    async onPointerUp(event) {
        const pos = getPosition(event, this.context);
        if (this.shapeOptions.shapeType === Tools.ShapeType.Circle ||
            this.shapeOptions.shapeType === Tools.ShapeType.Square) {
            if (event.button !== 0)
                return;
            if (this.path.length === 0)
                return;
            const shape = this.createShape([...this.path, pos]);
            if (shape)
                await this.context.addEntityCallback(shape);
            return;
        }
    }
    createShape(path) {
        const position = { x: 0, y: 0 };
        const shape = {
            id: this.entitiyId,
            position: position,
            toolType: Tools.ToolType.AddShape,
            shapeType: this.shapeOptions.shapeType,
            path: path,
            primaryColor: this.shapeOptions.outlineColor,
            primarySize: this.shapeOptions.outlineThickness,
            lineStyle: this.shapeOptions.outlineStyle,
            secondaryColor: this.shapeOptions.fillColor
        };
        return shape;
    }
}
function getPosition(event, context) {
    const point = new PIXI.Point();
    context.app.renderer.events.mapPositionToPoint(point, event.clientX, event.clientY);
    const local = context.container.toLocal(point);
    return { x: local.x, y: local.y };
}
function calculateDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function hitTestPixelPerfect(sprite, localPos, app) {
    const bounds = sprite.getBounds();
    if (localPos.x < 0 || localPos.y < 0 || localPos.x >= bounds.width || localPos.y >= bounds.height) {
        return false;
    }
    const tempSprite = new PIXI.Sprite(sprite.texture);
    const pixels = app.renderer.extract.pixels({
        target: tempSprite,
        frame: new PIXI.Rectangle(localPos.x, localPos.y, 1, 1),
    }).pixels;
    return pixels[3] > 0;
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=interaction.js.map