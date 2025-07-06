/// <reference types="pixi.js" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
import * as Interactions from './interaction.js';
import * as Draw from './draw-entity.js';
var PixiInterop;
(function (PixiInterop) {
    let app;
    let iconMap = {};
    let bgSprite = null;
    let pan = { x: 0, y: 0 };
    let zoom = 1;
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let panOrigin = { x: 0, y: 0 };
    let mainContainer = new PIXI.Container();
    let iconContainer = new PIXI.Container();
    let dragging = false;
    let dragOffset = { x: 0, y: 0 };
    let wasDragging = false;
    let currentTool;
    let interactionHandler = null;
    let entities = [];
    let temporaryEntities = [];
    let drawnSpriteByEntityId = {};
    function createApp(iconNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app) {
                app.destroy(true, { children: true });
            }
            Draw.init(iconNames);
            const parent = document.getElementById("tacticsCanvasContainer");
            if (!parent)
                return;
            app = new PIXI.Application();
            yield app.init({ background: '#FFFFFF', resizeTo: parent });
            parent.appendChild(app.canvas);
            mainContainer = new PIXI.Container();
            mainContainer.addChild(iconContainer);
            app.stage.addChild(mainContainer);
            app.canvas.addEventListener("click", containerOnClick);
            iconMap = {};
            bgSprite = null;
            pan = { x: 0, y: 0 };
            zoom = 1;
            isPanning = false;
        });
    }
    PixiInterop.createApp = createApp;
    function setToolOptions(options) {
        var _a;
        if (interactionHandler === null || interactionHandler === void 0 ? void 0 : interactionHandler.onPointerDown) {
            app.canvas.removeEventListener("pointerdown", interactionHandler.onPointerDown);
        }
        if (interactionHandler === null || interactionHandler === void 0 ? void 0 : interactionHandler.onPointerMove) {
            app.canvas.removeEventListener("pointermove", interactionHandler.onPointerMove);
        }
        if (interactionHandler === null || interactionHandler === void 0 ? void 0 : interactionHandler.onPointerUp) {
            app.canvas.removeEventListener("pointerup", interactionHandler.onPointerUp);
        }
        currentTool = options;
        if (currentTool.tool)
            interactionHandler = (_a = createInteractionHandler[currentTool.tool]) === null || _a === void 0 ? void 0 : _a.call(createInteractionHandler);
        if (interactionHandler === null || interactionHandler === void 0 ? void 0 : interactionHandler.onPointerDown) {
            app.canvas.addEventListener("pointerdown", interactionHandler.onPointerDown);
        }
        if (interactionHandler === null || interactionHandler === void 0 ? void 0 : interactionHandler.onPointerMove) {
            app.canvas.addEventListener("pointermove", interactionHandler.onPointerMove);
        }
        if (interactionHandler === null || interactionHandler === void 0 ? void 0 : interactionHandler.onPointerUp) {
            app.canvas.addEventListener("pointerup", interactionHandler.onPointerUp);
        }
    }
    PixiInterop.setToolOptions = setToolOptions;
    const createInteractionHandler = {
        [Tools.ToolType.DrawLine]: () => {
            if (!currentTool.lineDrawOptions)
                return null;
            return new Interactions.DrawLineTool(entities, temporaryEntities, currentTool.lineDrawOptions, updateEntity);
        },
        [Tools.ToolType.AddIcon]: function () {
            return null;
        },
        [Tools.ToolType.Move]: function () {
            return null;
        },
        [Tools.ToolType.Resize]: function () {
            return null;
        },
        [Tools.ToolType.DrawFree]: function () {
            return null;
        },
        [Tools.ToolType.DrawCurve]: function () {
            return null;
        },
        [Tools.ToolType.AddText]: function () {
            return null;
        },
        [Tools.ToolType.AddShape]: function () {
            return null;
        },
        [Tools.ToolType.Undo]: function () {
            return null;
        },
        [Tools.ToolType.Redo]: function () {
            return null;
        },
        [Tools.ToolType.Clear]: function () {
            return null;
        },
        [Tools.ToolType.Erase]: function () {
            return null;
        }
    };
    function containerOnClick(event) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!((_a = currentTool.iconOptions) === null || _a === void 0 ? void 0 : _a.iconType) || wasDragging) {
                wasDragging = false;
                return;
            }
            const x = event.offsetX;
            const y = event.offsetY;
            const icon = {
                points: [{ x, y }, { x: x + 40, y: y + 40 },],
                type: "Unit",
                iconType: (_b = currentTool.iconOptions) === null || _b === void 0 ? void 0 : _b.iconType,
                color: "#ffffff",
            };
            ////const sprite = await drawUnit(icon);
            ////const spriteContainer = new PIXI.Container();
            ////spriteContainer.addChild(sprite);
            ////spriteContainer.x = x;
            ////spriteContainer.y = y;
            ////iconMap[crypto.randomUUID()] = spriteContainer;
            ////sprite.eventMode = "static";
            ////sprite.cursor = "pointer";
            ////makeSpriteDraggable(sprite);
            drawIcons();
        });
    }
    function updateEntity(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const graphic = yield Draw.drawEntity(entity);
            if (graphic) {
                if (drawnSpriteByEntityId[entity.id]) {
                    iconContainer.removeChild(drawnSpriteByEntityId[entity.id]);
                }
                const sprite = new PIXI.Sprite(app.renderer.generateTexture(graphic));
                sprite.x = entity.position.x;
                sprite.y = entity.position.y;
                drawnSpriteByEntityId[entity.id] = sprite;
                iconContainer.addChild(sprite);
            }
        });
    }
    function makeSpriteDraggable(sprite) {
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        let dragging = false;
        let offset = { x: 0, y: 0 };
        function onPointerMove(event) {
            if (dragging) {
                // Koordinaten relativ zum Canvas berechnen
                const rect = app.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                sprite.x = x - offset.x;
                sprite.y = y - offset.y;
            }
        }
        // Handler f�r das Loslassen
        function onPointerUp() {
            dragging = false;
            wasDragging = true;
            sprite.alpha = 1.0;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        }
        sprite.on('pointerdown', (event) => {
            dragging = true;
            offset.x = event.global.x - sprite.x;
            offset.y = event.global.y - sprite.y;
            sprite.alpha = 0.7;
            // Globale Events hinzuf�gen
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        });
    }
    function setBackground(imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (bgSprite && app) {
                app.stage.removeChild(bgSprite);
            }
            const texture = yield PIXI.Assets.load("ConquerorsBladeData/Maps/" + imageUrl + ".png");
            const bg = new PIXI.Sprite(texture);
            bg.width = app.screen.width;
            bg.height = app.screen.height;
            mainContainer.addChild(bg);
            bgSprite = bg;
        });
    }
    PixiInterop.setBackground = setBackground;
    ////export async function redrawIcons(icons: Record <string, Icon>): Promise<void> {
    ////    iconMap = {}; // clear previous icons
    ////    for (const key in icons) {
    ////        if (Object.prototype.hasOwnProperty.call(icons, key)) {
    ////            const icon = icons[key];
    ////            const sprite = await drawIcon[icon.type](icon);
    ////            const spriteContainer = new PIXI.Container();
    ////            spriteContainer.x = sprite.x;
    ////            spriteContainer.y = sprite.y;
    ////            spriteContainer.addChild(sprite);
    ////            iconMap[key] = spriteContainer;
    ////        }
    ////    }
    ////    drawIcons();
    ////}
    function drawIcons() {
        iconContainer.removeChildren();
        for (const key in iconMap) {
            if (Object.prototype.hasOwnProperty.call(iconMap, key)) {
                const iconContainer = iconMap[key];
                mainContainer.addChild(iconContainer);
            }
        }
    }
    function drawStraightLine(icon) {
        return __awaiter(this, void 0, void 0, function* () {
            const graphics = new PIXI.Graphics();
            var spritePosX = Math.min(icon.points[0].x, icon.points[1].x);
            var spritePosY = Math.min(icon.points[0].y, icon.points[1].y);
            graphics.moveTo(icon.points[0].x - spritePosX, icon.points[0].y - spritePosY);
            graphics.lineTo(icon.points[1].x - spritePosX, icon.points[1].y - spritePosY);
            app.stage.addChild(graphics);
            const texture = app.renderer.generateTexture(graphics);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = spritePosX;
            sprite.y = spritePosY;
            return sprite;
        });
    }
    function drawBox(icon) {
        return __awaiter(this, void 0, void 0, function* () {
            const graphics = new PIXI.Graphics()
                .setFillStyle(icon.color)
                .filletRect(0, 0, icon.points[1].x - icon.points[0].x, icon.points[1].y - icon.points[0].y, 0);
            const texture = app.renderer.generateTexture(graphics);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = icon.points[0].x;
            sprite.y = icon.points[0].y;
            return sprite;
        });
    }
    function drawCurveLine(icon) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: actual curve
            const graphics = new PIXI.Graphics();
            var spritePosX = Math.min(icon.points[0].x, icon.points[1].x);
            var spritePosY = Math.min(icon.points[0].y, icon.points[1].y);
            graphics.moveTo(icon.points[0].x - spritePosX, icon.points[0].y - spritePosY);
            graphics.lineTo(icon.points[1].x - spritePosX, icon.points[1].y - spritePosY);
            app.stage.addChild(graphics);
            const texture = app.renderer.generateTexture(graphics);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = spritePosX;
            sprite.y = spritePosY;
            return sprite;
        });
    }
    // Add more exported functions as needed, e.g. for panning, zoom, icon management, etc.
})(PixiInterop || (PixiInterop = {}));
export default PixiInterop;
//# sourceMappingURL=pixiInterop.js.map