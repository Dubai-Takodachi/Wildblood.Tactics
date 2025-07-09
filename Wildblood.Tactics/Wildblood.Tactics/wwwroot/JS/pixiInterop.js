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
    let entityContainer = new PIXI.Container();
    let dragging = false;
    let dragOffset = { x: 0, y: 0 };
    let wasDragging = false;
    let currentTool;
    let interactionHandler = null;
    let currentEntities = {};
    let temporaryEntity = null;
    let drawnSpriteByEntityId = {};
    let dotNetObjRef;
    function createApp(dotNetRef, iconNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app) {
                app.destroy(true, { children: true });
            }
            dotNetObjRef = dotNetRef;
            const parent = document.getElementById("tacticsCanvasContainer");
            if (!parent)
                return;
            app = new PIXI.Application();
            Draw.init(iconNames, app);
            yield app.init({ background: '#FFFFFF', resizeTo: parent });
            parent.appendChild(app.canvas);
            mainContainer = new PIXI.Container();
            mainContainer.addChild(entityContainer);
            app.stage.addChild(mainContainer);
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
        if (currentTool.tool || currentTool.tool === 0)
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
            return new Interactions.DrawLineTool(currentTool.lineDrawOptions, addEntityOnServer, setPreviewEntity);
        },
        [Tools.ToolType.AddIcon]: function () {
            if (!currentTool.iconOptions)
                return null;
            return new Interactions.PlaceIconTool(currentTool.iconOptions, addEntityOnServer, setPreviewEntity);
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
    ////TODOS:
    //// - draw preview
    //// - other ToolTypes
    //// - bug: too many entities in tactic leading to not live updating other clients
    function addEntityOnServer(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const graphic = yield Draw.drawEntity(entity);
            if (graphic) {
                yield updateSpecificServerEntities([entity]);
            }
        });
    }
    function setPreviewEntity(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (temporaryEntity && drawnSpriteByEntityId[temporaryEntity.id]) {
                entityContainer.removeChild(drawnSpriteByEntityId[temporaryEntity.id]);
                drawnSpriteByEntityId[temporaryEntity.id].destroy();
            }
            if (entity) {
                yield drawEntityToScreen(entity);
            }
        });
    }
    function updateSpecificServerEntities(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            dotNetObjRef.invokeMethodAsync('UpdateServerEntities', entities);
        });
    }
    function drawEntityToScreen(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const graphic = yield Draw.drawEntity(entity);
            if (graphic) {
                if (drawnSpriteByEntityId[entity.id]) {
                    entityContainer.removeChild(drawnSpriteByEntityId[entity.id]);
                    drawnSpriteByEntityId[entity.id].destroy();
                }
                const sprite = new PIXI.Sprite(app.renderer.generateTexture(graphic));
                sprite.x = entity.position.x;
                sprite.y = entity.position.y;
                currentEntities[entity.id] = entity;
                drawnSpriteByEntityId[entity.id] = sprite;
                entityContainer.addChild(sprite);
            }
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
    function redrawEntities(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            removeOutdatedEntities(entities);
            updateExistingEntities(entities);
        });
    }
    PixiInterop.redrawEntities = redrawEntities;
    function removeOutdatedEntities(newCurrentEntities) {
        const currentIds = Object.keys(currentEntities);
        for (const id of currentIds) {
            let isStillExisting = false;
            for (const entity of newCurrentEntities) {
                if (entity.id === id)
                    isStillExisting = true;
            }
            if (isStillExisting === false) {
                entityContainer.removeChild(drawnSpriteByEntityId[id]);
                drawnSpriteByEntityId[id].destroy();
                delete drawnSpriteByEntityId[id];
                delete currentEntities[id];
            }
        }
    }
    function updateExistingEntities(newCurrentEntities) {
        for (const entity of newCurrentEntities) {
            if (!currentEntities[entity.id]
                || (JSON.stringify(currentEntities[entity.id]) === JSON.stringify(entity)) === false) {
                drawEntityToScreen(entity);
            }
        }
    }
})(PixiInterop || (PixiInterop = {}));
export default PixiInterop;
//# sourceMappingURL=pixiInterop.js.map