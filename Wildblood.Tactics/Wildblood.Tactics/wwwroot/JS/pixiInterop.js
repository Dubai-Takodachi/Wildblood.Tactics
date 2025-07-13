/// <reference types="pixi.js" />
import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
import * as Interactions from './interaction.js';
import * as Draw from './draw-entity.js';
var PixiInterop;
(function (PixiInterop) {
    let app;
    let dotNetObjRef;
    let mainContainer = new PIXI.Container();
    let entityContainer = new PIXI.Container();
    let bgSprite = null;
    let isDragging = false;
    let lastDragPos = null;
    let currentEntities = {};
    let drawnSpriteByEntityId = {};
    let currentTool;
    let interactionHandler = null;
    let interactionContext;
    let temporaryEntity = null;
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
        bgSprite = null;
        interactionContext = {
            addEntityCallback: addEntityOnServer,
            removeEntityCallback: removeEntityOnServer,
            setPreviewEntityCallback: setPreviewEntity,
            app: app,
            container: mainContainer,
        };
        app.canvas.addEventListener("mousedown", (event) => {
            if (event.button === 1) { // Middle mouse button
                isDragging = true;
                lastDragPos = { x: event.clientX, y: event.clientY };
                // Prevent default middle-mouse scroll behavior
                event.preventDefault();
            }
        });
        app.canvas.addEventListener("mousemove", (event) => {
            if (isDragging && lastDragPos) {
                const dx = event.clientX - lastDragPos.x;
                const dy = event.clientY - lastDragPos.y;
                mainContainer.x += dx;
                mainContainer.y += dy;
                lastDragPos = { x: event.clientX, y: event.clientY };
                clampWorldPosition();
            }
        });
        app.canvas.addEventListener("mouseup", (event) => {
            if (event.button === 1) {
                isDragging = false;
                lastDragPos = null;
            }
        });
        app.canvas.addEventListener("mouseleave", () => {
            isDragging = false;
            lastDragPos = null;
        });
        app.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();
            const zoomAmount = 1.1;
            const direction = event.deltaY > 0 ? 1 : -1;
            const scaleFactor = direction > 0 ? 1 / zoomAmount : zoomAmount;
            const mousePos = new PIXI.Point();
            app.renderer.events.mapPositionToPoint(mousePos, event.clientX, event.clientY);
            const beforeZoom = mainContainer.toLocal(mousePos);
            // Proposed new scale
            const newScaleX = mainContainer.scale.x * scaleFactor;
            const newScaleY = mainContainer.scale.y * scaleFactor;
            // Clamp the scale
            if (newScaleX < 1 || newScaleX > 5)
                return;
            // Apply the clamped scale
            mainContainer.scale.set(newScaleX, newScaleY);
            const afterZoom = mainContainer.toLocal(mousePos);
            // Adjust position to keep zoom centered on pointer
            mainContainer.x += (afterZoom.x - beforeZoom.x) * mainContainer.scale.x;
            mainContainer.y += (afterZoom.y - beforeZoom.y) * mainContainer.scale.y;
            clampWorldPosition();
        });
    }
    PixiInterop.createApp = createApp;
    function clampWorldPosition() {
        if (!bgSprite)
            return;
        const scale = mainContainer.scale.x; // Assuming uniform scaling
        const scaledWidth = bgSprite.width * scale;
        const scaledHeight = bgSprite.height * scale;
        const minX = Math.min(0, app.screen.width - scaledWidth);
        const minY = Math.min(0, app.screen.height - scaledHeight);
        mainContainer.x = Math.max(minX, Math.min(mainContainer.x, 0));
        mainContainer.y = Math.max(minY, Math.min(mainContainer.y, 0));
    }
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
            return new Interactions.DrawLineTool(interactionContext, currentTool.lineDrawOptions);
        },
        [Tools.ToolType.AddIcon]: function () {
            if (!currentTool.iconOptions)
                return null;
            return new Interactions.PlaceIconTool(interactionContext, currentTool.iconOptions);
        },
        [Tools.ToolType.Move]: function () {
            return new Interactions.MoveTool(interactionContext, currentEntities, drawnSpriteByEntityId);
        },
        [Tools.ToolType.DrawFree]: function () {
            if (!currentTool.freeDrawOptions)
                return null;
            return new Interactions.DrawFree(interactionContext, currentTool.freeDrawOptions);
        },
        [Tools.ToolType.DrawCurve]: function () {
            if (!currentTool.curveDrawOptions)
                return null;
            return new Interactions.DrawCurve(interactionContext, currentTool.curveDrawOptions);
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
        [Tools.ToolType.Erase]: function () {
            return new Interactions.EraseTool(interactionContext, drawnSpriteByEntityId);
        },
        [Tools.ToolType.Ping]: function () {
            return new Interactions.PingTool(interactionContext);
        }
    };
    async function addEntityOnServer(entity) {
        const graphic = await Draw.drawEntity(entity);
        if (graphic) {
            await updateSpecificServerEntities([entity], []);
        }
    }
    async function removeEntityOnServer(entityId) {
        await updateSpecificServerEntities([], [entityId]);
    }
    async function updateSpecificServerEntities(entities, removedEntityIds) {
        dotNetObjRef.invokeMethodAsync('UpdateServerEntities', entities, removedEntityIds);
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
    async function drawEntityToScreen(entity) {
        const graphic = await Draw.drawEntity(entity);
        if (graphic) {
            if (drawnSpriteByEntityId[entity.id]) {
                entityContainer.removeChild(drawnSpriteByEntityId[entity.id]);
                drawnSpriteByEntityId[entity.id].destroy();
            }
            const sprite = new PIXI.Sprite(app.renderer.generateTexture(graphic));
            sprite.x = entity.position.x + graphic.bounds.minX;
            sprite.y = entity.position.y + graphic.bounds.minY;
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