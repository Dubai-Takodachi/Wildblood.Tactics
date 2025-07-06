import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';

export interface IToolHandler {
    onPointerDown(event: PointerEvent): void;
    onPointerMove?(event: PointerEvent): void;
    onPointerUp?(event: PointerEvent): void;
}

export class DrawLineTool implements IToolHandler {
    private container: PIXI.Container;
    private lineOptions: Tools.LineOptions;
    private start: { x: number; y: number } | null = null;

    constructor(container: PIXI.Container, lineOptions: Tools.LineOptions) {
        this.container = container;
        this.lineOptions = lineOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    onPointerDown(event: PointerEvent) {
        const pos = this.getLocalPos(event);
        this.start = pos;
    }

    onPointerUp(event: PointerEvent) {
        if (!this.start) return;
        const pos = this.getLocalPos(event);
        const line = this.drawLine(pos.x, pos.y);
        this.container.addChild(line);
        this.start = null;
    }

    private drawLine(x: number, y: number): PIXI.Graphics {
        const g = new PIXI.Graphics();
        if (!this.start) return g;

        if (this.lineOptions.lineStyle === Tools.LineStyle.Normal) {
            g.moveTo(this.start.x, this.start.y)
                .lineTo(x, y)
                .stroke({ width: this.lineOptions.thickness, color: this.lineOptions.color });
        } else if (this.lineOptions.lineStyle === Tools.LineStyle.Dotted) {
            const dx = x - this.start.x;
            const dy = y - this.start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dots = Math.floor(distance / this.lineOptions.thickness);

            const stepX = dx / dots;
            const stepY = dy / dots;

            for (let i = 0; i < dots; i++) {
                const x = this.start.x + stepX * i;
                const y = this.start.y + stepY * i;
                g.circle(x, y, this.lineOptions.thickness)
                    .fill(this.lineOptions.color);
            }
        } else if (this.lineOptions.lineStyle === Tools.LineStyle.Dashed) {
            const dashLength = this.lineOptions.thickness * 3;
            const gapLength = this.lineOptions.thickness;
            const dx = x - this.start.x;
            const dy = y - this.start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dashCount = Math.floor(distance / (dashLength + gapLength));

            const stepX = dx / dashCount;
            const stepY = dy / dashCount;

            const dashX = (dashLength / (dashLength + gapLength)) * stepX;
            const dashY = (dashLength / (dashLength + gapLength)) * stepY;

            for (let i = 0; i < dashCount; i++) {
                const x1 = this.start.x + i * stepX;
                const y1 = this.start.y + i * stepY;
                const x2 = x1 + dashX;
                const y2 = y1 + dashY;

                g.moveTo(x1, y1)
                    .lineTo(x2, y2)
                    .stroke({ width: this.lineOptions.thickness, color: this.lineOptions.color });
            }
        }

        if (this.lineOptions.lineEnd === Tools.LineEnd.Arrow) {
            const headLength = 10;
            const angle = Math.atan2(y - this.start.y, x - this.start.x);

            const arrowAngle1 = angle - Math.PI / 6; // 30 degrees
            const arrowAngle2 = angle + Math.PI / 6;

            const arrowPoint1 = {
                x: x - headLength * Math.cos(arrowAngle1),
                y: y - headLength * Math.sin(arrowAngle1),
            };

            const arrowPoint2 = {
                x: x - headLength * Math.cos(arrowAngle2),
                y: y - headLength * Math.sin(arrowAngle2),
            };

            g.moveTo(x, y);
            g.lineTo(arrowPoint1.x, arrowPoint1.y);

            g.moveTo(x, y);
            g.lineTo(arrowPoint2.x, arrowPoint2.y);
        } else if (this.lineOptions.lineEnd === Tools.LineEnd.Flat) {
            const headLength = 10;
            const angle = Math.atan2(y - this.start.y, x - this.start.x);

            const arrowAngle1 = angle - Math.PI / 4; // 45 degrees
            const arrowAngle2 = angle + Math.PI / 4;

            const arrowPoint1 = {
                x: x - headLength * Math.cos(arrowAngle1),
                y: y - headLength * Math.sin(arrowAngle1),
            };

            const arrowPoint2 = {
                x: x - headLength * Math.cos(arrowAngle2),
                y: y - headLength * Math.sin(arrowAngle2),
            };

            g.moveTo(x, y);
            g.lineTo(arrowPoint1.x, arrowPoint1.y);

            g.moveTo(x, y);
            g.lineTo(arrowPoint2.x, arrowPoint2.y);
        }

        return g;
    }

    private getLocalPos(event: PointerEvent): { x: number; y: number } {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
}