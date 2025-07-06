var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Tools from './tools-types.js';
export class DrawLineTool {
    constructor(entities, temporaryEntities, lineOptions, updateCallback) {
        this.start = null;
        this.previewEntity = null;
        this.entities = entities;
        this.temporaryEntities = temporaryEntities;
        this.lineOptions = lineOptions;
        this.addEntityCallback = updateCallback;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    onPointerDown(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const pos = this.getLocalPos(event);
            this.start = pos;
        });
    }
    onPointerMove(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.start)
                return;
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
        });
    }
    onPointerUp(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.start)
                return;
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
                yield this.addEntityCallback(line);
            this.start = null;
        });
    }
    createLine(x, y) {
        if (!this.start)
            return null;
        const position = {
            x: Math.min(this.start.x, x),
            y: Math.min(this.start.y, y)
        };
        let line = {
            id: crypto.randomUUID(),
            toolType: Tools.ToolType.DrawLine,
            position: {
                x: Math.min(this.start.x, x),
                y: Math.min(this.start.y, y),
            },
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
    getLocalPos(event) {
        const rect = event.target.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
}
//# sourceMappingURL=interaction.js.map