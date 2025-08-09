/// <reference types="pixi.js" />

import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
import * as Interactions from './interaction.js';
import * as Draw from './draw-entity.js';

namespace PixiInterop {
    let VIRTUAL_WIDTH = 3000;
    let VIRTUAL_HEIGHT = 3000;

    let app: PIXI.Application;
    let dotNetObjRef: DotNetObjectReference;
    let unitsMemory: Tools.Unit[];

    let mainContainer: PIXI.Container = new PIXI.Container();
    let entityContainer: PIXI.Container = new PIXI.Container();
    let bgSprite: PIXI.Sprite | null = null;

    let isDragging: boolean = false;
    let lastDragPos: Tools.Point | null = null;

    let currentEntities: Record<string, Tools.Entity> = {};
    let drawnSpriteByEntityId: Record<string, PIXI.Sprite> = {};

    let currentTool: Tools.ToolOptions;
    let interactionHandler: Interactions.IToolHandler | null = null;
    let interactionContext: Interactions.InteractionContext;
    let temporaryEntity: Tools.Entity | null = null;

    export async function createApp(
            dotNetRef: DotNetObjectReference,
            units: Tools.Unit[]): Promise<void> {
        if (app) {
            app.destroy(true, { children: true });
        }
        dotNetObjRef = dotNetRef;
        unitsMemory = units;
        const parent = document.getElementById("tacticsCanvasContainer");
        if (!parent) return;
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
        }

        app.canvas.setAttribute('draggable', 'false');

        app.canvas.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });

        app.canvas.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });

        app.canvas.addEventListener("contextmenu", (event: MouseEvent) => {
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
            if (newScale > 5) return;
            mainContainer.scale.set(newScale);

            const afterZoom = mainContainer.toLocal(mousePos);
            mainContainer.x += (afterZoom.x - beforeZoom.x) * mainContainer.scale.x;
            mainContainer.y += (afterZoom.y - beforeZoom.y) * mainContainer.scale.y;

            clampWorldPosition();
            clampWorldScale()
        });

        updateViewSize();

        if (parent) {
            const initialWidth = parent.offsetWidth;

            const resizeObserver = new ResizeObserver((e) => {
                if (e.length < 0) return;

                if (Math.abs(Math.round(e[0].contentRect.width) - initialWidth) > 5) {
                    location.reload();
                }
            });

            resizeObserver.observe(parent);
        }
    }

    function updateViewSize() {
        const ratio = app.renderer.width / app.renderer.height;
        VIRTUAL_WIDTH = 4000;
        VIRTUAL_HEIGHT = 4000 * (1 / ratio);

        const screenWidth = app.renderer.width;
        const screenHeight = app.renderer.height;

        const widthScale = screenWidth / VIRTUAL_WIDTH;
        const heightScale = screenHeight / VIRTUAL_HEIGHT;

        const scale = Math.min(
            screenWidth / VIRTUAL_WIDTH,
            screenHeight / VIRTUAL_HEIGHT
        );

        mainContainer.scale.set(scale);
        mainContainer.position.set(
            (screenWidth - VIRTUAL_WIDTH * widthScale) / 2,
            (screenHeight - VIRTUAL_HEIGHT * heightScale) / 2
        );
    }

    function clampWorldPosition() {
        if (!bgSprite) return;
        const scaleX = mainContainer.scale.x;
        const scaleY = mainContainer.scale.y;

        const scaledWidth = bgSprite!.width * scaleX;
        const scaledHeight = bgSprite!.height * scaleY;

        const minX = Math.min(0, app.screen.width - scaledWidth);
        const minY = Math.min(0, app.screen.height - scaledHeight);

        mainContainer.x = Math.max(minX, Math.min(mainContainer.x, 0));
        mainContainer.y = Math.max(minY, Math.min(mainContainer.y, 0));
    }

    function clampWorldScale() {
        if (!bgSprite) return;

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
        } else if (currentScale > maxScale) {
            mainContainer.scale.set(maxScale);
        }
    }

    export function setToolOptions(options: Tools.ToolOptions): void {
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

    const createInteractionHandler: Record<Tools.ToolType, () => Interactions.IToolHandler | null> = {
        [Tools.ToolType.DrawLine]: () => {
            if (!currentTool.lineDrawOptions) return null;
            return new Interactions.DrawLineTool(interactionContext, currentTool.lineDrawOptions);
        },
        [Tools.ToolType.AddIcon]: function (): Interactions.IToolHandler | null {
            if (!currentTool.iconOptions) return null;
            return new Interactions.PlaceIconTool(interactionContext, currentTool.iconOptions);
        },
        [Tools.ToolType.Move]: function (): Interactions.IToolHandler | null {
            return new Interactions.MoveTool(interactionContext, currentEntities, drawnSpriteByEntityId);
        },
        [Tools.ToolType.DrawFree]: function (): Interactions.IToolHandler | null {
            if (!currentTool.freeDrawOptions) return null;
            return new Interactions.DrawFree(interactionContext, currentTool.freeDrawOptions);
        },
        [Tools.ToolType.DrawCurve]: function (): Interactions.IToolHandler | null {
            if (!currentTool.curveDrawOptions) return null;
            return new Interactions.DrawCurve(interactionContext, currentTool.curveDrawOptions);
        },
        [Tools.ToolType.AddText]: function (): Interactions.IToolHandler | null {
            if (!currentTool.textOptions) return null;
            return new Interactions.PlaceTextTool(interactionContext, currentTool.textOptions);
        },
        [Tools.ToolType.AddShape]: function (): Interactions.IToolHandler | null {
            if (!currentTool.shapeOptions) return null;
            return new Interactions.DrawShapeTool(interactionContext, currentTool.shapeOptions);
        },
        [Tools.ToolType.Undo]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Redo]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Erase]: function (): Interactions.IToolHandler | null {
            return new Interactions.EraseTool(interactionContext, drawnSpriteByEntityId);
        },
        [Tools.ToolType.Ping]: function (): Interactions.IToolHandler | null {
            if (!currentTool.pingOptions) return null;
            return new Interactions.PingTool(interactionContext, currentTool.pingOptions);
        }
    };

    async function addEntityOnServer(entity: Tools.Entity): Promise<void> {
        const graphic = await Draw.drawEntity(entity);
        if (graphic) {
            await updateSpecificServerEntities([entity], []);
        }
    }

    async function removeEntityOnServer(entityId: string): Promise<void> {
        await updateSpecificServerEntities([], [entityId]);
    }

    async function updateSpecificServerEntities(entities: Tools.Entity[], removedEntityIds: string[]): Promise<void> {
        dotNetObjRef.invokeMethodAsync('UpdateServerEntities', entities, removedEntityIds);
    }

    async function setPreviewEntity(entity: Tools.Entity | null): Promise<void> {
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

    async function drawEntityToScreen(entity: Tools.Entity): Promise<void> {
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
            const paddedBounds = new PIXI.Rectangle(
                bounds.x - padding,
                bounds.y - padding,
                bounds.width + padding * 2,
                bounds.height + padding * 2
            );

            const sprite = createSafeSprite(container, paddedBounds);

            sprite.x = entity.position.x + container.getBounds().minX;
            sprite.y = entity.position.y + container.getBounds().minY;
            currentEntities[entity.id] = entity;
            drawnSpriteByEntityId[entity.id] = sprite;
            entityContainer.addChild(sprite);
        }
    }

    function createSafeSprite(container: PIXI.Container, bounds: PIXI.Rectangle): PIXI.Sprite {
        const webGlRenderer = app.renderer as PIXI.WebGLRenderer;
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

    export async function setBackground(imageUrl: string): Promise<void> {
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

    export async function redrawEntities(entities: Tools.Entity[]): Promise<void> {
        await removeOutdatedEntities(entities);
        await updateExistingEntities(entities);
    }

    async function removeOutdatedEntities(newCurrentEntities: Tools.Entity[]): Promise<void> {
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

    async function updateExistingEntities(newCurrentEntities: Tools.Entity[]): Promise<void> {
        for (const entity of newCurrentEntities) {
            const existing = currentEntities[entity.id];

            if (!existing || !areEntitiesEqual(existing, entity)) {
                await drawEntityToScreen(entity);
            }
        }
    }

    function areEntitiesEqual(a: Tools.Entity, b: Tools.Entity): boolean {
        return (
            a.id === b.id &&
            a.position.x === b.position.x &&
            a.position.y === b.position.y &&
            a.path?.length === b.path?.length
        );
    }

    interface DotNetObjectReference {
        invokeMethodAsync<T = any>(methodIdentifier: string, ...args: any[]): Promise<T>;
    }
}

export default PixiInterop;