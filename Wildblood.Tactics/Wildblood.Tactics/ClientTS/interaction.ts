import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';

export interface IToolHandler {
    onPointerDown(event: PointerEvent): Promise<void>;
    onPointerMove?(event: PointerEvent): Promise<void>;
    onPointerUp?(event: PointerEvent): Promise<void>;
}

export class DrawLineTool implements IToolHandler {
    private entities: Record<string, Tools.Entity>;
    private temporaryEntities: Tools.Entity[];
    private lineOptions: Tools.LineOptions;
    private start: { x: number; y: number } | null = null;
    private previewEntity: Tools.Entity | null = null;
    private addEntityCallback: (entity: Tools.Entity) => Promise<void>;

    constructor(entities: Record<string, Tools.Entity>, temporaryEntities: Tools.Entity[], lineOptions: Tools.LineOptions, updateCallback: (entity: Tools.Entity) => Promise<void>) {
        this.entities = entities;
        this.temporaryEntities = temporaryEntities;
        this.lineOptions = lineOptions;
        this.addEntityCallback = updateCallback;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    async onPointerDown(event: PointerEvent) {
        const pos = this.getLocalPos(event);
        this.start = pos;
    }

    async onPointerMove(event: PointerEvent) {
        if (!this.start) return;

        const pos = this.getLocalPos(event);

        if (this.previewEntity) {
            const index = this.temporaryEntities.indexOf(this.previewEntity);
            if (index !== -1) {
                this.temporaryEntities.splice(index, 1);
            }
            this.previewEntity = null;
        }

        this.previewEntity = this.createLine(pos.x, pos.y);
        if (this.previewEntity)
            this.temporaryEntities.push(this.previewEntity);
    }

    async onPointerUp(event: PointerEvent) {
        if (!this.start) return;

        if (this.previewEntity) {
            const index = this.temporaryEntities.indexOf(this.previewEntity);
            if (index !== -1) {
                this.temporaryEntities.splice(index, 1);
            }
            this.previewEntity = null;
        }

        const pos = this.getLocalPos(event);
        const line = this.createLine(pos.x, pos.y);
        if (line)
            await this.addEntityCallback(line);
        this.start = null;
    }

    private createLine(x: number, y: number): Tools.Entity | null {
        if (!this.start) return null;

        const position: Tools.Point = {
            x: Math.min(this.start!.x, x),
            y: Math.min(this.start!.y, y)
        };

        let line: Tools.Entity = {
            id: crypto.randomUUID(),
            toolType: Tools.ToolType.DrawLine,
            position: {
                x: Math.min(this.start!.x, x),
                y: Math.min(this.start!.y, y),
            },
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

    private getLocalPos(event: PointerEvent): { x: number; y: number } {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
}