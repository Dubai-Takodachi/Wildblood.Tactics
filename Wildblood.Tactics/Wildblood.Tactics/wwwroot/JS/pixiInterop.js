/// <reference types="pixi.js" />
import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
import * as Interactions from './interaction.js';
import * as Draw from './draw-entity.js';
var PixiInterop;
(function (PixiInterop) {
    let VIRTUAL_WIDTH = 3000;
    let VIRTUAL_HEIGHT = 3000;
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
        await app.init({
            background: '#FFFFFF',
            resizeTo: parent,
            autoDensity: true,
            resolution: window.devicePixelRatio,
        });
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
            if (event.button === 1) {
                isDragging = true;
                lastDragPos = { x: event.clientX, y: event.clientY };
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
        app.canvas.addEventListener("mouseleave", async () => {
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
            const newScale = mainContainer.scale.x * scaleFactor;
            if (newScale > 5)
                return;
            mainContainer.scale.set(newScale);
            const afterZoom = mainContainer.toLocal(mousePos);
            mainContainer.x += (afterZoom.x - beforeZoom.x) * mainContainer.scale.x;
            mainContainer.y += (afterZoom.y - beforeZoom.y) * mainContainer.scale.y;
            clampWorldPosition();
            clampWorldScale();
        });
        updateViewSize();
    }
    PixiInterop.createApp = createApp;
    function updateViewSize() {
        const ratio = app.renderer.width / app.renderer.height;
        VIRTUAL_WIDTH = 1000;
        VIRTUAL_HEIGHT = 1000 * (1 / ratio);
        const screenWidth = app.renderer.width;
        const screenHeight = app.renderer.height;
        const widthScale = screenWidth / VIRTUAL_WIDTH;
        const heightScale = screenHeight / VIRTUAL_HEIGHT;
        const scale = Math.min(screenWidth / VIRTUAL_WIDTH, screenHeight / VIRTUAL_HEIGHT);
        mainContainer.scale.set(scale);
        mainContainer.position.set((screenWidth - VIRTUAL_WIDTH * widthScale) / 2, (screenHeight - VIRTUAL_HEIGHT * heightScale) / 2);
    }
    function clampWorldPosition() {
        if (!bgSprite)
            return;
        const scaleX = mainContainer.scale.x;
        const scaleY = mainContainer.scale.y;
        const scaledWidth = bgSprite.width * scaleX;
        const scaledHeight = bgSprite.height * scaleY;
        const minX = Math.min(0, app.screen.width - scaledWidth);
        const minY = Math.min(0, app.screen.height - scaledHeight);
        mainContainer.x = Math.max(minX, Math.min(mainContainer.x, 0));
        mainContainer.y = Math.max(minY, Math.min(mainContainer.y, 0));
    }
    function clampWorldScale() {
        if (!bgSprite)
            return;
        const screenWidth = app.screen.width;
        const screenHeight = app.screen.height;
        const bgWidth = bgSprite.width;
        const bgHeight = bgSprite.height;
        const minScaleX = screenWidth / bgWidth;
        const minScaleY = screenHeight / bgHeight;
        const minScale = Math.max(minScaleX, minScaleY);
        const maxScale = 5;
        const currentScale = mainContainer.scale.x;
        if (currentScale < minScale) {
            mainContainer.scale.set(minScale);
        }
        else if (currentScale > maxScale) {
            mainContainer.scale.set(maxScale);
        }
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
        if (interactionHandler?.onPointerLeave) {
            app.canvas.removeEventListener("pointerleave", interactionHandler.onPointerLeave);
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
        if (interactionHandler?.onPointerLeave) {
            app.canvas.addEventListener("pointerleave", interactionHandler.onPointerLeave);
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
            if (!currentTool.textOptions)
                return null;
            return new Interactions.PlaceTextTool(interactionContext, currentTool.textOptions);
        },
        [Tools.ToolType.AddShape]: function () {
            if (!currentTool.shapeOptions)
                return null;
            return new Interactions.DrawShapeTool(interactionContext, currentTool.shapeOptions);
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
        if (temporaryEntity && drawnSpriteByEntityId[temporaryEntity.id] /*&& !currentEntities[temporaryEntity.id]*/) {
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
            if (entity.toolType === Tools.ToolType.Ping) {
                graphic.x = entity.position.x;
                graphic.y = entity.position.y;
                entityContainer.addChild(graphic);
                return;
            }
            if (drawnSpriteByEntityId[entity.id]) {
                entityContainer.removeChild(drawnSpriteByEntityId[entity.id]);
                drawnSpriteByEntityId[entity.id].destroy();
            }
            const padding = 2;
            const bounds = graphic.getBounds();
            const paddedBounds = new PIXI.Rectangle(bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2);
            const sprite = new PIXI.Sprite(app.renderer.generateTexture({
                target: graphic,
                frame: paddedBounds,
            }));
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
        bg.width = VIRTUAL_WIDTH;
        bg.height = VIRTUAL_HEIGHT;
        if (bgSprite) {
            mainContainer.removeChild(bgSprite);
        }
        bgSprite = bg;
        mainContainer.addChildAt(bgSprite, 0);
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