import * as Tools from './tools-types.js';
import * as PIXI from '../lib/pixi.mjs';
export class DrawLineTool {
    lineOptions;
    start = null;
    entitiyId = null;
    addEntityCallback;
    setPreviewEntityCallback;
    constructor(lineOptions, updateCallback, previewCallback) {
        this.lineOptions = lineOptions;
        this.addEntityCallback = updateCallback;
        this.setPreviewEntityCallback = previewCallback;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    async onPointerDown(event) {
        const pos = getGlobalPos(event);
        this.start = pos;
        this.entitiyId = crypto.randomUUID();
    }
    async onPointerMove(event) {
        if (!this.start || !this.entitiyId) {
            this.start = null;
            this.entitiyId = null;
            return;
        }
        const pos = getGlobalPos(event);
        const line = this.createLine(pos.x, pos.y, this.entitiyId);
        if (line)
            await this.setPreviewEntityCallback(line);
    }
    async onPointerUp(event) {
        if (!this.start || !this.entitiyId) {
            this.start = null;
            this.entitiyId = null;
            return;
        }
        const pos = getGlobalPos(event);
        const line = this.createLine(pos.x, pos.y, this.entitiyId);
        if (line)
            await this.addEntityCallback(line);
        this.start = null;
        this.entitiyId = null;
        this.setPreviewEntityCallback(null);
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
    lineOptions;
    path = [];
    entityId = null;
    addEntityCallback;
    setPreviewEntityCallback;
    constructor(lineOptions, updateCallback, previewCallback) {
        this.lineOptions = lineOptions;
        this.addEntityCallback = updateCallback;
        this.setPreviewEntityCallback = previewCallback;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    async onPointerDown(event) {
        const pos = getGlobalPos(event);
        if (this.path.length === 0) {
            this.path.push(pos);
            this.entityId = crypto.randomUUID();
            return;
        }
        if (this.calculateDistance(pos, this.path[this.path.length - 1]) < 10) {
            const curve = this.createCurve(this.path);
            if (curve)
                await this.addEntityCallback(curve);
            this.path = [];
            return;
        }
        this.path.push(pos);
        const curve = this.createCurve(this.path);
        if (curve)
            await this.addEntityCallback(curve);
    }
    async onPointerMove(event) {
        const pos = getGlobalPos(event);
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
            await this.setPreviewEntityCallback(curve);
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
    lineOptions;
    path = [];
    entityId = null;
    addEntityCallback;
    setPreviewEntityCallback;
    constructor(lineOptions, updateCallback, previewCallback) {
        this.lineOptions = lineOptions;
        this.addEntityCallback = updateCallback;
        this.setPreviewEntityCallback = previewCallback;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    async onPointerDown(event) {
        const pos = getGlobalPos(event);
        this.entityId = crypto.randomUUID();
        this.path = [pos];
    }
    async onPointerMove(event) {
        if (this.path.length === 0)
            return;
        const pos = getGlobalPos(event);
        if (calculateDistance(pos, this.path[this.path.length - 1]) >= 1.4) {
            this.path.push(pos);
            const freeDrawing = this.createFreeDrawing(this.path);
            if (freeDrawing)
                await this.setPreviewEntityCallback(freeDrawing);
        }
    }
    async onPointerUp(event) {
        if (this.path.length === 0)
            return;
        const freeDrawing = this.createFreeDrawing(this.path);
        if (freeDrawing)
            await this.addEntityCallback(freeDrawing);
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
    iconOptions;
    entitiyId = crypto.randomUUID();
    addEntityCallback;
    setPreviewEntityCallback;
    constructor(iconOptions, updateCallback, previewCallback) {
        this.iconOptions = iconOptions;
        this.addEntityCallback = updateCallback;
        this.setPreviewEntityCallback = previewCallback;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    async onPointerDown(event) {
        const pos = getGlobalPos(event);
        const icon = this.createIcon(pos.x, pos.y, this.entitiyId);
        if (icon)
            await this.addEntityCallback(icon);
        this.entitiyId = crypto.randomUUID();
    }
    async onPointerMove(event) {
        const pos = getGlobalPos(event);
        const icon = this.createIcon(pos.x, pos.y, this.entitiyId);
        if (icon)
            await this.setPreviewEntityCallback(icon);
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
export class MoveTool {
    entityId = null;
    entityClickedPosition = null;
    addEntityCallback;
    setPreviewEntityCallback;
    drawnSpriteByEntityId;
    currentEntities;
    app;
    constructor(updateCallback, previewCallback, currentEntities, drawnSpriteByEntityId, app) {
        this.addEntityCallback = updateCallback;
        this.setPreviewEntityCallback = previewCallback;
        this.drawnSpriteByEntityId = drawnSpriteByEntityId;
        this.currentEntities = currentEntities;
        this.app = app;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    async onPointerDown(event) {
        const pos = getGlobalPos(event);
        const keys = Object.keys(this.drawnSpriteByEntityId).reverse();
        for (const key of keys) {
            const sprite = this.drawnSpriteByEntityId[key];
            if (!sprite.position)
                continue;
            const local = { x: pos.x - sprite.x, y: pos.y - sprite.y };
            if (this.hitTestPixelPerfect(sprite, pos, local)) {
                this.entityClickedPosition = local;
                this.entityId = key;
                break;
            }
        }
    }
    async onPointerMove(event) {
        if (!this.entityId || !this.entityClickedPosition)
            return;
        const pos = getGlobalPos(event);
        this.currentEntities[this.entityId].position = {
            x: pos.x - this.entityClickedPosition.x,
            y: pos.y - this.entityClickedPosition.y
        };
        await this.setPreviewEntityCallback({ ...this.currentEntities[this.entityId] });
    }
    async onPointerUp(event) {
        if (!this.entityId)
            return;
        await this.addEntityCallback({ ...this.currentEntities[this.entityId] });
        this.entityId = null;
        this.entityClickedPosition = null;
    }
    hitTestPixelPerfect(sprite, globalPos, localPos) {
        const bounds = sprite.getBounds();
        if (localPos.x < 0 || localPos.y < 0 || localPos.x >= bounds.width || localPos.y >= bounds.height) {
            return false;
        }
        const tempSprite = new PIXI.Sprite(sprite.texture);
        const pixels = this.app.renderer.extract.pixels({
            target: tempSprite,
            frame: new PIXI.Rectangle(localPos.x, localPos.y, 1, 1),
        }).pixels;
        return pixels[3] > 0;
    }
}
function getGlobalPos(event) {
    const rect = event.target.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
function calculateDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
//# sourceMappingURL=interaction.js.map