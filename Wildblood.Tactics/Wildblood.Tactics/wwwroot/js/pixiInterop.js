/// <reference types="pixi.js" />
import * as PIXI from 'pixi.js';
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
    let pingContainer = new PIXI.Container();
    let bgSprite = null;
    let isDragging = false;
    let lastDragPos = null;
    let currentEntities = {};
    let drawnSpriteByEntityId = {};
    /**
     * Tracks entities that were added locally but haven't been confirmed by the server yet.
     *
     * Race Condition Prevention:
     * When an entity is placed locally, it's immediately drawn and added to this set.
     * SignalR echoes updates back to the same client, which triggers redrawEntities().
     * Without this tracking, removeOutdatedEntities() would remove the just-placed entity
     * because it's not yet in the server's entity list (race condition).
     *
     * The entity ID is removed from this set once the server confirms it via SignalR.
     */
    let locallyAddedEntityIds = new Set();
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
        Draw.init(unitsMemory, app);
        await app.init({
            background: '#FFFFFF',
            resizeTo: parent,
            autoDensity: true,
            resolution: window.devicePixelRatio,
        });
        parent.appendChild(app.canvas);
        mainContainer = new PIXI.Container();
        mainContainer.addChild(entityContainer);
        mainContainer.addChild(pingContainer);
        app.stage.addChild(mainContainer);
        bgSprite = null;
        interactionContext = {
            addEntityCallback: addEntityOnServer,
            removeEntityCallback: removeEntityOnServer,
            setPreviewEntityCallback: setPreviewEntity,
            sendPingCallback: pingToServer,
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
        const previousTool = currentTool?.tool;
        const newTool = options.tool;
        currentTool = options;
        // If the tool type hasn't changed and we have an existing handler, just update its options
        if (previousTool === newTool && interactionHandler && interactionHandler.updateOptions) {
            // Update options based on the tool type
            switch (newTool) {
                case Tools.ToolType.DrawLine:
                    if (options.lineDrawOptions) {
                        interactionHandler.updateOptions(options.lineDrawOptions);
                    }
                    break;
                case Tools.ToolType.DrawCurve:
                    if (options.curveDrawOptions) {
                        interactionHandler.updateOptions(options.curveDrawOptions);
                    }
                    break;
                case Tools.ToolType.DrawFree:
                    if (options.freeDrawOptions) {
                        interactionHandler.updateOptions(options.freeDrawOptions);
                    }
                    break;
                case Tools.ToolType.AddIcon:
                    if (options.iconOptions) {
                        interactionHandler.updateOptions(options.iconOptions);
                    }
                    break;
                case Tools.ToolType.AddText:
                    if (options.textOptions) {
                        interactionHandler.updateOptions(options.textOptions);
                    }
                    break;
                case Tools.ToolType.AddShape:
                    if (options.shapeOptions) {
                        interactionHandler.updateOptions(options.shapeOptions);
                    }
                    break;
                case Tools.ToolType.Ping:
                    if (options.pingOptions) {
                        interactionHandler.updateOptions(options.pingOptions);
                    }
                    break;
            }
            return; // No need to recreate handler or re-register events
        }
        // Tool type changed - need to remove old listeners and create new handler
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
    /**
     * Adds an entity to the canvas and sends it to the server.
     *
     * Performance Optimization:
     * - Draws entity locally first for immediate visual feedback (0ms lag)
     * - Marks entity as "locally added" to prevent premature removal
     * - Sends to server asynchronously for persistence and SignalR broadcast
     * - Server-side batching reduces DB writes when placing icons rapidly
     *
     * Error Handling:
     * - Drawing and server communication are separately caught to prevent one failure from affecting the other
     * - Errors are logged to console for debugging
     */
    async function addEntityOnServer(entity) {
        try {
            // Mark as locally added to prevent premature removal by SignalR echo
            locallyAddedEntityIds.add(entity.id);
            // Draw the entity to the screen immediately for local responsiveness
            await drawEntityToScreen(entity);
        }
        catch (error) {
            console.error('Error drawing entity to screen:', error, entity);
        }
        try {
            // Send to server for persistence and SignalR broadcast (batched server-side)
            await updateSpecificServerEntities([entity], []);
        }
        catch (error) {
            console.error('Error updating server entities:', error, entity);
        }
    }
    async function removeEntityOnServer(entityId) {
        await updateSpecificServerEntities([], [entityId]);
    }
    async function updateSpecificServerEntities(entities, removedEntityIds) {
        await dotNetObjRef.invokeMethodAsync('UpdateServerEntities', entities, removedEntityIds);
    }
    /**
     * Manages preview entity display during mouse movement.
     *
     * Important: Handles cleanup of previous preview without removing committed entities.
     *
     * Bug Fix:
     * When placing an icon while moving the mouse, the preview and placed icon share the same ID.
     * After placement, the next mouse move creates a new preview with a different ID.
     * Without the locallyAddedEntityIds check, this function would remove the just-placed icon
     * thinking it was an old preview. Now we skip removal if the entity has been committed.
     */
    async function setPreviewEntity(entity) {
        if (temporaryEntity && drawnSpriteByEntityId[temporaryEntity.id]) {
            // Don't remove entities that have been committed (locally added)
            // This prevents removing a just-clicked icon when the mouse moves again
            if (!locallyAddedEntityIds.has(temporaryEntity.id)) {
                entityContainer.removeChild(drawnSpriteByEntityId[temporaryEntity.id]);
                drawnSpriteByEntityId[temporaryEntity.id].destroy();
                delete drawnSpriteByEntityId[temporaryEntity.id];
                delete currentEntities[temporaryEntity.id];
            }
        }
        temporaryEntity = entity;
        if (entity) {
            await drawEntityToScreen(entity);
        }
    }
    async function drawEntityToScreen(entity) {
        if (entity.toolType === Tools.ToolType.Ping)
            return;
        const container = await Draw.drawEntity(entity);
        if (!container) {
            console.warn('drawEntityToScreen: Failed to create container for entity', entity);
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
    async function pingToServer(ping) {
        dotNetObjRef.invokeMethodAsync('PingToServer', ping);
    }
    async function drawPing(ping) {
        if (ping.toolType !== Tools.ToolType.Ping)
            return;
        const container = await Draw.drawEntity(ping);
        if (!container)
            return;
        container.x = ping.position.x;
        container.y = ping.position.y;
        pingContainer.addChild(container);
    }
    PixiInterop.drawPing = drawPing;
    /**
     * Redraws entities when receiving updates from the server (usually via SignalR).
     * Called by C# RedrawEntities() method.
     */
    async function redrawEntities(entities) {
        await removeOutdatedEntities(entities);
        await updateExistingEntities(entities);
    }
    PixiInterop.redrawEntities = redrawEntities;
    /**
     * Removes entities that are no longer in the server's entity list.
     *
     * Race Condition Handling:
     * When an entity is placed locally, there's a delay before it's confirmed by the server.
     * This function protects locally-added entities from being removed during this window.
     * Once the server confirms the entity (it appears in the server list), we clear the flag.
     *
     * This prevents the issue where:
     * 1. User places icon → drawn locally
     * 2. SignalR echoes back before batch completes
     * 3. Server list doesn't include the new icon yet
     * 4. This function would remove it thinking it's outdated
     * 5. Icon disappears immediately after placement!
     */
    async function removeOutdatedEntities(newCurrentEntities) {
        await setPreviewEntity(null);
        const currentIds = Object.keys(currentEntities);
        const newEntityIds = new Set(newCurrentEntities.map(e => e.id));
        for (const id of currentIds) {
            // Don't remove entities that were just added locally (not yet confirmed by server)
            if (locallyAddedEntityIds.has(id)) {
                // If the entity is in the new list from server, it's been confirmed
                if (newEntityIds.has(id)) {
                    locallyAddedEntityIds.delete(id);
                }
                // Don't remove it even if not in server list yet (waiting for confirmation)
                continue;
            }
            // Only remove entities that are explicitly not in the new list
            if (!newEntityIds.has(id)) {
                entityContainer.removeChild(drawnSpriteByEntityId[id]);
                drawnSpriteByEntityId[id].destroy();
                delete drawnSpriteByEntityId[id];
                delete currentEntities[id];
            }
        }
    }
    /**
     * Updates or draws entities that have changed or are new from the server.
     */
    async function updateExistingEntities(newCurrentEntities) {
        for (const entity of newCurrentEntities) {
            const existing = currentEntities[entity.id];
            if (!existing || !areEntitiesEqual(existing, entity)) {
                await drawEntityToScreen(entity);
            }
        }
    }
    /**
     * Checks if two entities are equal (for change detection).
     */
    function areEntitiesEqual(a, b) {
        return (a.id === b.id &&
            a.position.x === b.position.x &&
            a.position.y === b.position.y &&
            a.path?.length === b.path?.length);
    }
})(PixiInterop || (PixiInterop = {}));
export default PixiInterop;
//# sourceMappingURL=pixiInterop.js.map