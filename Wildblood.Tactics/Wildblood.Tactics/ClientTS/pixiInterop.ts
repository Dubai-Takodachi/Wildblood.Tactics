/// <reference types="pixi.js" />

import * as PIXI from '../lib/pixi.mjs';
import * as Tools from './tools-types.js';
import * as Interactions from './interaction.js';
import * as Draw from './draw-entity.js';

namespace PixiInterop {
    let app: PIXI.Application;
    let iconMap: Record<string, PIXI.Container> = {};
    let bgSprite: PIXI.Sprite | null = null;
    let pan: { x: number; y: number } = { x: 0, y: 0 };
    let zoom: number = 1;
    let isPanning: boolean = false;
    let panStart: { x: number; y: number } = { x: 0, y: 0 };
    let panOrigin: { x: number; y: number } = { x: 0, y: 0 };
    let mainContainer: PIXI.Container = new PIXI.Container();
    let entityContainer: PIXI.Container = new PIXI.Container();
    let dragging: boolean = false;
    let dragOffset: { x: number; y: number } = { x: 0, y: 0 };
    let wasDragging: boolean = false;
    let currentTool: Tools.ToolOptions;
    let interactionHandler: Interactions.IToolHandler | null = null;
    let currentEntities: Record<string, Tools.Entity> = {};
    let temporaryEntities: Tools.Entity[] = [];
    let drawnSpriteByEntityId: Record<string, PIXI.Sprite> = {};
    let dotNetObjRef: DotNetObjectReference;

    interface DotNetObjectReference {
        invokeMethodAsync<T = any>(methodIdentifier: string, ...args: any[]): Promise<T>;
    }

    export async function createApp(
            dotNetRef: DotNetObjectReference,
            iconNames: Record<string, string>): Promise<void> {
        if (app) {
            app.destroy(true, { children: true });
        }
        dotNetObjRef = dotNetRef;
        Draw.init(iconNames);
        const parent = document.getElementById("tacticsCanvasContainer");
        if (!parent) return;
        app = new PIXI.Application();
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

        if (currentTool.tool)
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
            return new Interactions.DrawLineTool(currentTool.lineDrawOptions, addEntityOnServer);
        },
        [Tools.ToolType.AddIcon]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Move]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Resize]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.DrawFree]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.DrawCurve]: function(): Interactions.IToolHandler | null {
            return null;
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
        [Tools.ToolType.Clear]: function(): Interactions.IToolHandler | null {
            return null;
        },
        [Tools.ToolType.Erase]: function(): Interactions.IToolHandler | null {
            return null;
        }
    };

    ////TODOS:
    //// - draw preview
    //// - other ToolTypes
    //// - bug: too many entities in tactic leading to not live updating other clients
    async function addEntityOnServer(entity: Tools.Entity): Promise<void> {
        const graphic = await Draw.drawEntity(entity);
        if (graphic) {
            await updateSpecificServerEntities([entity]);
        }
    }

    async function updateSpecificServerEntities(entities: Tools.Entity[]): Promise<void> {
        dotNetObjRef.invokeMethodAsync('UpdateServerEntities', entities);
    }

    async function drawEntityToScreen(entity: Tools.Entity): Promise<void> {
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

    export async function setBackground(imageUrl: string): Promise<void> {
        if (bgSprite && app) {
            app.stage.removeChild(bgSprite);
        }
        const texture = await PIXI.Assets.load("ConquerorsBladeData/Maps/" + imageUrl + ".png");
        const bg = new PIXI.Sprite(texture);
        bg.width = app.screen.width;
        bg.height = app.screen.height;
        mainContainer.addChild(bg);
        bgSprite = bg;
    }

    export async function redrawEntities(entities: Tools.Entity[]): Promise<void> {
        removeOutdatedEntities(entities);
        updateExistingEntities(entities);
    }

    function removeOutdatedEntities(newCurrentEntities: Tools.Entity[]): void {
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

    function updateExistingEntities(newCurrentEntities: Tools.Entity[]): void {
        for (const entity of newCurrentEntities) {
            if (!currentEntities[entity.id]
                || (JSON.stringify(currentEntities[entity.id]) === JSON.stringify(entity)) === false) {
                drawEntityToScreen(entity);
            }
        }
    }
}

export default PixiInterop;