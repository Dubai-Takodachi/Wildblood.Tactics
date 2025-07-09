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
    constructor(lineOptions, updateCallback, previewCallback) {
        this.start = null;
        this.entitiyId = null;
        this.lineOptions = lineOptions;
        this.addEntityCallback = updateCallback;
        this.setPreviewEntityCallback = previewCallback;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    onPointerDown(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const pos = getLocalPos(event);
            this.start = pos;
            this.entitiyId = crypto.randomUUID();
        });
    }
    onPointerMove(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.start || !this.entitiyId) {
                this.start = null;
                this.entitiyId = null;
                // TODO?: remove entity from list in the error case
                return;
            }
            const pos = getLocalPos(event);
            const line = this.createLine(pos.x, pos.y, this.entitiyId);
            if (line)
                yield this.setPreviewEntityCallback(line);
        });
    }
    onPointerUp(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.start || !this.entitiyId) {
                this.start = null;
                this.entitiyId = null;
                // TODO?: remove entity from list in the error case
                return;
            }
            const pos = getLocalPos(event);
            const line = this.createLine(pos.x, pos.y, this.entitiyId);
            if (line)
                yield this.addEntityCallback(line);
            this.start = null;
            this.entitiyId = null;
            this.setPreviewEntityCallback(null);
        });
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
export class PlaceIconTool {
    constructor(iconOptions, updateCallback, previewCallback) {
        this.entitiyId = crypto.randomUUID();
        this.iconOptions = iconOptions;
        this.addEntityCallback = updateCallback;
        this.setPreviewEntityCallback = previewCallback;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }
    onPointerDown(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const pos = getLocalPos(event);
            const icon = this.createIcon(pos.x, pos.y, this.entitiyId);
            if (icon)
                yield this.addEntityCallback(icon);
            this.entitiyId = crypto.randomUUID();
        });
    }
    onPointerMove(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const pos = getLocalPos(event);
            const icon = this.createIcon(pos.x, pos.y, this.entitiyId);
            if (icon)
                yield this.setPreviewEntityCallback(icon);
        });
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
function getLocalPos(event) {
    const rect = event.target.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
//# sourceMappingURL=interaction.js.map