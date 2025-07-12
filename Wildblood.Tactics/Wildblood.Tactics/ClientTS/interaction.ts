import * as Tools from './tools-types.js';
import * as PIXI from '../lib/pixi.mjs';

export interface IToolHandler {
    onPointerDown(event: PointerEvent): Promise<void>;
    onPointerMove?(event: PointerEvent): Promise<void>;
    onPointerUp?(event: PointerEvent): Promise<void>;
}

export interface InteractionContext {
    app: PIXI.Application;
    container: PIXI.Container;
    addEntityCallback: (entity: Tools.Entity) => Promise<void>;
    setPreviewEntityCallback: (entity: Tools.Entity | null) => Promise<void>;
}

export class DrawLineTool implements IToolHandler {
    private context: InteractionContext;
    private lineOptions: Tools.LineOptions;
    private start: { x: number; y: number } | null = null;
    private entitiyId: string | null = null;

    constructor(context: InteractionContext, lineOptions: Tools.LineOptions) {
        this.context = context;
        this.lineOptions = lineOptions;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    async onPointerDown(event: PointerEvent) {
        const pos = getPosition(event, this.context);
        this.start = pos;
        this.entitiyId = crypto.randomUUID();
    }

    async onPointerMove(event: PointerEvent) {
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

    async onPointerUp(event: PointerEvent) {
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

    private createLine(x: number, y: number, entityId: string): Tools.Entity | null {
        if (!this.start) return null;

        const position: Tools.Point = {
            x: Math.min(this.start!.x, x),
            y: Math.min(this.start!.y, y)
        };

        let line: Tools.Entity = {
            id: entityId,
            toolType: Tools.ToolType.DrawLine,
            position: position,
            path: [
                { x: this.start.x - position.x, y: this.start.y - position.y },
                { x: x - position.x, y: y - position.y }],
            lineEnd: this.lineOptions.lineEnd,
            lineStyle: this.lineOptions.lineStyle,
            primarySize: this.lineOptions.thickness,
            secondarySize: this.lineOptions.endSize,
            primaryColor: this.lineOptions.color,
        }

        return line;
    }
}

export class DrawCurve implements IToolHandler {
    private context: InteractionContext;
    private lineOptions: Tools.LineOptions;
    private path: Tools.Point[] = [];
    private entityId: string | null = null;

    constructor(
        context: InteractionContext,
        lineOptions: Tools.LineOptions) {

        this.context = context;
        this.lineOptions = lineOptions;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }

    async onPointerDown(event: PointerEvent) {
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

    async onPointerMove(event: PointerEvent) {
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

    private calculateDistance(a: Tools.Point, b: Tools.Point): number {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    private createCurve(path: Tools.Point[]): Tools.Entity | null {
        if (path.length < 1 || !this.entityId) return null;

        const position: Tools.Point = {
            x: Math.min(...path.map(p => p.x)),
            y: Math.min(...path.map(p => p.y))
        };

        let curve: Tools.Entity = {
            id: this.entityId,
            toolType: Tools.ToolType.DrawCurve,
            position: position,
            path: path.map(p => ({ x: p.x - position.x, y: p.y - position.y })),
            lineEnd: this.lineOptions.lineEnd,
            lineStyle: this.lineOptions.lineStyle,
            primarySize: this.lineOptions.thickness,
            secondarySize: this.lineOptions.endSize,
            primaryColor: this.lineOptions.color,
        }

        return curve;
    }
}

export class DrawFree implements IToolHandler {
    private context: InteractionContext;
    private lineOptions: Tools.LineOptions;
    private path: Tools.Point[] = [];
    private entityId: string | null = null;

    constructor(context: InteractionContext, lineOptions: Tools.LineOptions) {
        this.context = context;
        this.lineOptions = lineOptions;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    async onPointerDown(event: PointerEvent) {
        const pos = getPosition(event, this.context);
        this.entityId = crypto.randomUUID();
        this.path = [pos];
    }

    async onPointerMove(event: PointerEvent) {
        if (this.path.length === 0) return;

        const pos = getPosition(event, this.context);
        if (calculateDistance(pos, this.path[this.path.length - 1]) >= 1.4) {
            this.path.push(pos);
            const freeDrawing = this.createFreeDrawing(this.path);
            if (freeDrawing)
                await this.context.setPreviewEntityCallback(freeDrawing);
        }
    }

    async onPointerUp(event: PointerEvent) {
        if (this.path.length === 0) return;
        const freeDrawing = this.createFreeDrawing(this.path);
        if (freeDrawing)
            await this.context.addEntityCallback(freeDrawing);
        this.path = [];
        this.entityId = null;
    }

    private createFreeDrawing(path: Tools.Point[]): Tools.Entity | null {
        if (path.length === 0 || !this.entityId) return null;

        const position: Tools.Point = {
            x: Math.min(...path.map(p => p.x)),
            y: Math.min(...path.map(p => p.y))
        };

        let freeDrawing: Tools.Entity = {
            id: this.entityId,
            toolType: Tools.ToolType.DrawFree,
            position: position,
            path: path.map(p => ({ x: p.x - position.x, y: p.y - position.y })),
            lineEnd: this.lineOptions.lineEnd,
            lineStyle: this.lineOptions.lineStyle,
            primarySize: this.lineOptions.thickness,
            secondarySize: this.lineOptions.endSize,
            primaryColor: this.lineOptions.color,
        }

        return freeDrawing;
    }
}

export class PlaceIconTool implements IToolHandler {
    private context: InteractionContext;
    private iconOptions: Tools.IconOptions;
    private entitiyId: string = crypto.randomUUID();

    constructor(context: InteractionContext, iconOptions: Tools.IconOptions) {
        this.context = context;
        this.iconOptions = iconOptions;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }

    async onPointerDown(event: PointerEvent) {
        const pos = getPosition(event, this.context);
        const icon = this.createIcon(pos.x, pos.y, this.entitiyId);
        if (icon)
            await this.context.addEntityCallback(icon);
        this.entitiyId = crypto.randomUUID();
    }

    async onPointerMove(event: PointerEvent) {
        const pos = getPosition(event, this.context);
        const icon = this.createIcon(pos.x, pos.y, this.entitiyId);
        if (icon)
            await this.context.setPreviewEntityCallback(icon);
    }

    private createIcon(x: number, y: number, entityId: string): Tools.Entity | null {
        const position: Tools.Point = {
            x: x,
            y: y
        };

        let icon: Tools.Entity = {
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
        }

        return icon;
    }
}

export class MoveTool implements IToolHandler {
    private context: InteractionContext;
    private entityId: string | null = null;
    private entityClickedPosition: Tools.Point | null = null;
    private drawnSpriteByEntityId: Record<string, PIXI.Sprite>;
    private currentEntities: Record<string, Tools.Entity>;

    constructor(
        context: InteractionContext,
        currentEntities: Record<string, Tools.Entity>,
        drawnSpriteByEntityId: Record<string, PIXI.Sprite>) {

        this.context = context;
        this.drawnSpriteByEntityId = drawnSpriteByEntityId;
        this.currentEntities = currentEntities;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    async onPointerDown(event: PointerEvent) {
        const pos = getPosition(event, this.context);

        const keys = Object.keys(this.drawnSpriteByEntityId).reverse();
        for (const key of keys) {
            const sprite = this.drawnSpriteByEntityId[key];
            if (!sprite.position) continue;
            const local = { x: pos.x - sprite.x, y: pos.y - sprite.y };

            if (this.hitTestPixelPerfect(sprite, local)) {
                this.entityClickedPosition = local;
                this.entityId = key;
                break;
            }
        }
    }

    async onPointerMove(event: PointerEvent) {
        if (!this.entityId || !this.entityClickedPosition) return;
        const pos = getPosition(event, this.context);
        this.currentEntities[this.entityId].position = {
            x: pos.x - this.entityClickedPosition.x,
            y: pos.y - this.entityClickedPosition.y
        };
        await this.context.setPreviewEntityCallback({ ...this.currentEntities[this.entityId] });
    }

    async onPointerUp(event: PointerEvent) {
        if (!this.entityId) return;
        await this.context.addEntityCallback({ ...this.currentEntities[this.entityId] });
        this.entityId = null;
        this.entityClickedPosition = null;
    }

    private hitTestPixelPerfect(sprite: PIXI.Sprite, localPos: Tools.Point): boolean {
        const bounds = sprite.getBounds();

        if (localPos.x < 0 || localPos.y < 0 || localPos.x >= bounds.width || localPos.y >= bounds.height) {
            return false;
        }

        const tempSprite = new PIXI.Sprite(sprite.texture);
        const pixels = this.context.app.renderer.extract.pixels({
            target: tempSprite,
            frame: new PIXI.Rectangle(localPos.x, localPos.y, 1, 1),
        }).pixels;
        return pixels[3] > 0;
    }
}

function getPosition(event: PointerEvent, context: InteractionContext): { x: number; y: number } {
    const point = new PIXI.Point();
    context.app.renderer.events.mapPositionToPoint(point, event.clientX, event.clientY);
    const local = context.container.toLocal(point);
    return { x: local.x, y: local.y };
}

function calculateDistance(a: Tools.Point, b: Tools.Point): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}