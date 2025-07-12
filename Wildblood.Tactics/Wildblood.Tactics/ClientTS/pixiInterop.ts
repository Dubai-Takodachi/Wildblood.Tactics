/// <reference types="pixi.js" />

import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
import * as Interactions from './interaction.js';
import * as Draw from './draw-entity.js';

namespace PixiInterop {
    let app: PIXI.Application;
    let dotNetObjRef: DotNetObjectReference;

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
            iconNames: Record<string, string>): Promise<void> {
        if (app) {
            app.destroy(true, { children: true });
        }
        dotNetObjRef = dotNetRef;
        const parent = document.getElementById("tacticsCanvasContainer");
        if (!parent) return;
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
            setPreviewEntityCallback: setPreviewEntity,
            app: app,
            container: mainContainer,
        }

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

                clampWorldPosition()
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
            if (newScaleX < 1 || newScaleX > 5) return;

            // Apply the clamped scale
            mainContainer.scale.set(newScaleX, newScaleY);

            const afterZoom = mainContainer.toLocal(mousePos);

            // Adjust position to keep zoom centered on pointer
            mainContainer.x += (afterZoom.x - beforeZoom.x) * mainContainer.scale.x;
            mainContainer.y += (afterZoom.y - beforeZoom.y) * mainContainer.scale.y;

            clampWorldPosition()
        });
    }

    function clampWorldPosition() {
        if (!bgSprite) return;
        const scale = mainContainer.scale.x; // Assuming uniform scaling

        const scaledWidth = bgSprite!.width * scale;
        const scaledHeight = bgSprite!.height * scale;

        const minX = Math.min(0, app.screen.width - scaledWidth);
        const minY = Math.min(0, app.screen.height - scaledHeight);

        mainContainer.x = Math.max(minX, Math.min(mainContainer.x, 0));
        mainContainer.y = Math.max(minY, Math.min(mainContainer.y, 0));
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
        [Tools.ToolType.AddText]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.AddShape]: function (): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Undo]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Redo]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Erase]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Ping]: function (): Interactions.IToolHandler | null {
            return null;
        }
    };

    async function addEntityOnServer(entity: Tools.Entity): Promise<void> {
        const graphic = await Draw.drawEntity(entity);
        if (graphic) {
            await updateSpecificServerEntities([entity]);
        }
    }

    async function updateSpecificServerEntities(entities: Tools.Entity[]): Promise<void> {
        dotNetObjRef.invokeMethodAsync('UpdateServerEntities', entities);
    }

    async function setPreviewEntity(entity: Tools.Entity | null): Promise<void> {
        if (temporaryEntity && drawnSpriteByEntityId[temporaryEntity.id] && !currentEntities[temporaryEntity.id]) {
            entityContainer.removeChild(drawnSpriteByEntityId[temporaryEntity.id]);
            drawnSpriteByEntityId[temporaryEntity.id].destroy();
        }

        temporaryEntity = entity;

        if (entity) {
            await drawEntityToScreen(entity);
        }
    }

    async function drawEntityToScreen(entity: Tools.Entity): Promise<void> {
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

    export async function setBackground(imageUrl: string): Promise<void> {
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
            if (!currentEntities[entity.id]
                || (JSON.stringify(currentEntities[entity.id]) === JSON.stringify(entity)) === false) {
                await drawEntityToScreen(entity);
            }
        }
    }

    interface DotNetObjectReference {
        invokeMethodAsync<T = any>(methodIdentifier: string, ...args: any[]): Promise<T>;
    }
}

export default PixiInterop;