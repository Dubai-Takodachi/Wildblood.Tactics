import * as Tools from './tools-types.js';

export interface IToolHandler {
    onPointerDown(event: PointerEvent): Promise<void>;
    onPointerMove?(event: PointerEvent): Promise<void>;
    onPointerUp?(event: PointerEvent): Promise<void>;
}

export class DrawLineTool implements IToolHandler {
    private lineOptions: Tools.LineOptions;
    private start: { x: number; y: number } | null = null;
    private entitiyId: string | null = null;
    private addEntityCallback: (entity: Tools.Entity) => Promise<void>;

    constructor(
        lineOptions: Tools.LineOptions,
        updateCallback: (entity: Tools.Entity) => Promise<void>) {

        this.lineOptions = lineOptions;
        this.addEntityCallback = updateCallback;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    async onPointerDown(event: PointerEvent) {
        const pos = this.getLocalPos(event);
        this.start = pos;
        this.entitiyId = crypto.randomUUID();
    }

    async onPointerMove(event: PointerEvent) {
        if (!this.start || !this.entitiyId) {
            this.start = null;
            this.entitiyId = null;
            // TODO?: remove entity from list in the error case
            return;
        }

        const pos = this.getLocalPos(event);
        const line = this.createLine(pos.x, pos.y, this.entitiyId);
        if (line)
            await this.addEntityCallback(line);
    }

    async onPointerUp(event: PointerEvent) {
        if (!this.start || !this.entitiyId) {
            this.start = null;
            this.entitiyId = null;
            // TODO?: remove entity from list in the error case
            return;
        }

        const pos = this.getLocalPos(event);
        const line = this.createLine(pos.x, pos.y, this.entitiyId);
        if (line)
            await this.addEntityCallback(line);
        this.start = null;
        this.entitiyId = null;
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