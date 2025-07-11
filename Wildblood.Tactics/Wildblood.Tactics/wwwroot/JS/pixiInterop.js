/// <reference types="pixi.js" />
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
    async function createApp(dotNetRef, iconNames) {
        if (app) {
            app.destroy(true, { children: true });
        }
        dotNetObjRef = dotNetRef;
        const parent = document.getElementById("tacticsCanvasContainer");
        if (!parent)
            return;
        app = new PIXI.Application();
        Draw.init(iconNames, app);
        await app.init({ background: '#FFFFFF', resizeTo: parent });
        parent.appendChild(app.canvas);
        mainContainer = new PIXI.Container();
        mainContainer.addChild(entityContainer);
        app.stage.addChild(mainContainer);
        iconMap = {};
        bgSprite = null;
        pan = { x: 0, y: 0 };
        zoom = 1;
        isPanning = false;
    }
    PixiInterop.createApp = createApp;
    function setToolOptions(options) {
        if (interactionHandler?.onPointerDown) {
            app.canvas.removeEventListener("pointerdown", interactionHandler.onPointerDown);
        }
        if (interactionHandler?.onPointerMove) {
            app.canvas.removeEventListener("pointermove", interactionHandler.onPointerMove);
        }
        if (interactionHandler?.onPointerUp) {
            app.canvas.removeEventListener("pointerup", interactionHandler.onPointerUp);
        }
        currentTool = options;
        if (currentTool.tool || currentTool.tool === 0)
            interactionHandler = createInteractionHandler[currentTool.tool]?.();
        if (interactionHandler?.onPointerDown) {
            app.canvas.addEventListener("pointerdown", interactionHandler.onPointerDown);
        }
        if (interactionHandler?.onPointerMove) {
            app.canvas.addEventListener("pointermove", interactionHandler.onPointerMove);
        }
        if (interactionHandler?.onPointerUp) {
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
            return new Interactions.MoveTool(addEntityOnServer, setPreviewEntity, currentEntities, drawnSpriteByEntityId, app);
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
    async function addEntityOnServer(entity) {
        const graphic = await Draw.drawEntity(entity);
        if (graphic) {
            await updateSpecificServerEntities([entity]);
        }
    }
    async function setPreviewEntity(entity) {
        if (temporaryEntity && drawnSpriteByEntityId[temporaryEntity.id] && !currentEntities[temporaryEntity.id]) {
            entityContainer.removeChild(drawnSpriteByEntityId[temporaryEntity.id]);
            drawnSpriteByEntityId[temporaryEntity.id].destroy();
        }
        temporaryEntity = entity;
        if (entity) {
            await drawEntityToScreen(entity);
        }
    }
    async function updateSpecificServerEntities(entities) {
        dotNetObjRef.invokeMethodAsync('UpdateServerEntities', entities);
    }
    async function drawEntityToScreen(entity) {
        const graphic = await Draw.drawEntity(entity);
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
    }
    async function setBackground(imageUrl) {
        if (bgSprite && app) {
            app.stage.removeChild(bgSprite);
        }
        const texture = await PIXI.Assets.load("ConquerorsBladeData/Maps/" + imageUrl + ".png");
        const bg = new PIXI.Sprite(texture);
        bg.width = app.screen.width;
        bg.height = app.screen.height;
        if (bgSprite) {
            mainContainer.removeChild(bgSprite);
        }
        mainContainer.addChildAt(bg, 0);
        bgSprite = bg;
    }
    PixiInterop.setBackground = setBackground;
    async function redrawEntities(entities) {
        await removeOutdatedEntities(entities);
        await updateExistingEntities(entities);
    }
    PixiInterop.redrawEntities = redrawEntities;
    async function removeOutdatedEntities(newCurrentEntities) {
        await setPreviewEntity(null);
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
    async function updateExistingEntities(newCurrentEntities) {
        for (const entity of newCurrentEntities) {
            if (!currentEntities[entity.id]
                || (JSON.stringify(currentEntities[entity.id]) === JSON.stringify(entity)) === false) {
                await drawEntityToScreen(entity);
            }
        }
    }
})(PixiInterop || (PixiInterop = {}));
export default PixiInterop;
//# sourceMappingURL=pixiInterop.js.map