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
    let unitsMemory;
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
    async function createApp(dotNetRef, units) {
        if (app) {
            app.destroy(true, { children: true });
        }
        dotNetObjRef = dotNetRef;
        unitsMemory = units;
        const parent = document.getElementById("tacticsCanvasContainer");
        if (!parent)
            return;
        app = new PIXI.Application();
        Draw.init(unitsMemory, app, removeEntityOnServer);
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
        app.canvas.setAttribute('draggable', 'false');
        app.canvas.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
        app.canvas.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
        app.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
        app.canvas.addEventListener("mousedown", (event) => {
            if (event.button === 1 || event.button === 2) {
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
            if (event.button === 1 || event.button === 2) {
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
        if (parent) {
            const initialWidth = parent.offsetWidth;
            const resizeObserver = new ResizeObserver((e) => {
                if (e.length < 0)
                    return;
                if (Math.abs(Math.round(e[0].contentRect.width) - initialWidth) > 5) {
                    location.reload();
                }
            });
            resizeObserver.observe(parent);
        }
    }
    PixiInterop.createApp = createApp;
    function updateViewSize() {
        const ratio = app.renderer.width / app.renderer.height;
        VIRTUAL_WIDTH = 4000;
        VIRTUAL_HEIGHT = 4000 * (1 / ratio);
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
            if (!currentTool.pingOptions)
                return null;
            return new Interactions.PingTool(interactionContext, currentTool.pingOptions);
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
        if (temporaryEntity && drawnSpriteByEntityId[temporaryEntity.id]) {
            entityContainer.removeChild(drawnSpriteByEntityId[temporaryEntity.id]);
            drawnSpriteByEntityId[temporaryEntity.id].destroy();
            delete drawnSpriteByEntityId[temporaryEntity.id];
            delete currentEntities[temporaryEntity.id];
        }
        temporaryEntity = entity;
        if (entity) {
            await drawEntityToScreen(entity);
        }
    }
    async function drawEntityToScreen(entity) {
        const container = await Draw.drawEntity(entity);
        if (container) {
            if (entity.toolType === Tools.ToolType.Ping) {
                container.x = entity.position.x;
                container.y = entity.position.y;
                entityContainer.addChild(container);
                return;
            }
            if (drawnSpriteByEntityId[entity.id]) {
                entityContainer.removeChild(drawnSpriteByEntityId[entity.id]);
                drawnSpriteByEntityId[entity.id].destroy();
            }
            const padding = 2;
            const bounds = container.getBounds();
            const paddedBounds = new PIXI.Rectangle(bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2);
            const sprite = createSafeSprite(container, paddedBounds);
            sprite.x = entity.position.x + container.getBounds().minX;
            sprite.y = entity.position.y + container.getBounds().minY;
            currentEntities[entity.id] = entity;
            drawnSpriteByEntityId[entity.id] = sprite;
            entityContainer.addChild(sprite);
        }
    }
    function createSafeSprite(container, bounds) {
        const webGlRenderer = app.renderer;
        const maxSize = Math.sqrt(webGlRenderer.gl.getParameter(webGlRenderer.gl.MAX_TEXTURE_SIZE)) * 25;
        const scaleFactor = Math.min(1, maxSize / Math.max(bounds.width, bounds.height));
        const texture = app.renderer.generateTexture({
            target: container,
            resolution: scaleFactor,
            frame: bounds,
        });
        const sprite = new PIXI.Sprite(texture);
        return sprite;
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
            const existing = currentEntities[entity.id];
            if (!existing || !areEntitiesEqual(existing, entity)) {
                await drawEntityToScreen(entity);
            }
        }
    }
    function areEntitiesEqual(a, b) {
        return (a.id === b.id &&
            a.position.x === b.position.x &&
            a.position.y === b.position.y &&
            a.path?.length === b.path?.length);
    }
})(PixiInterop || (PixiInterop = {}));
export default PixiInterop;
//# sourceMappingURL=pixiInterop.js.map