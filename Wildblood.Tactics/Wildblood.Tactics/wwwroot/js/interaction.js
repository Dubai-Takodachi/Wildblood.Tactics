import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
export class DrawLineTool {
    constructor(container, lineOptions) {
        this.start = null;
        this.previewGraphics = null;
        this.container = container;
        this.lineOptions = lineOptions;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    onPointerDown(event) {
        const pos = this.getLocalPos(event);
        this.start = pos;
    }
    onPointerMove(event) {
        if (!this.start)
            return;
        const pos = this.getLocalPos(event);
        // Remove old preview
        if (this.previewGraphics) {
            this.container.removeChild(this.previewGraphics);
            this.previewGraphics.destroy(); // clean up GPU memory
            this.previewGraphics = null;
        }
        // Draw new preview line
        this.previewGraphics = this.drawLine(pos.x, pos.y);
        this.container.addChild(this.previewGraphics);
    }
    onPointerUp(event) {
        if (!this.start)
            return;
        if (this.previewGraphics) {
            this.container.removeChild(this.previewGraphics);
            this.previewGraphics.destroy();
            this.previewGraphics = null;
        }
        const pos = this.getLocalPos(event);
        const line = this.drawLine(pos.x, pos.y);
        this.container.addChild(line);
        this.start = null;
    }
    drawLine(x, y) {
        const g = new PIXI.Graphics();
        if (!this.start)
            return g;
        if (this.lineOptions.lineStyle === Tools.LineStyle.Normal) {
            g.moveTo(this.start.x, this.start.y)
                .lineTo(x, y)
                .stroke({ width: this.lineOptions.thickness, color: this.lineOptions.color });
        }
        else if (this.lineOptions.lineStyle === Tools.LineStyle.Dotted) {
            const dx = x - this.start.x;
            const dy = y - this.start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dots = Math.floor((distance / this.lineOptions.thickness) / 4);
            const stepDistX = dx / dots;
            const stepDistY = dy / dots;
            for (let i = 0; i < dots; i++) {
                const stepX = this.start.x + stepDistX * i;
                const stepY = this.start.y + stepDistY * i;
                g.circle(stepX, stepY, this.lineOptions.thickness)
                    .fill(this.lineOptions.color);
            }
        }
        else if (this.lineOptions.lineStyle === Tools.LineStyle.Dashed) {
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
            const headLength = this.lineOptions.endSize;
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
            g.moveTo(x, y)
                .lineTo(arrowPoint1.x, arrowPoint1.y)
                .moveTo(x, y)
                .lineTo(arrowPoint2.x, arrowPoint2.y)
                .stroke({ width: this.lineOptions.thickness, color: this.lineOptions.color });
        }
        else if (this.lineOptions.lineEnd === Tools.LineEnd.Flat) {
            const headLength = this.lineOptions.endSize;
            const angle = Math.atan2(y - this.start.y, x - this.start.x);
            const arrowAngle1 = angle - Math.PI / 2; // 45 degrees
            const arrowAngle2 = angle + Math.PI / 2;
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
            g.stroke({ width: this.lineOptions.thickness, color: this.lineOptions.color });
        }
        return g;
    }
    getLocalPos(event) {
        const rect = event.target.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
}
//# sourceMappingURL=interaction.js.map