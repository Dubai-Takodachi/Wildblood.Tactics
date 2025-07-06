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
    let iconContainer: PIXI.Container = new PIXI.Container();
    let dragging: boolean = false;
    let dragOffset: { x: number; y: number } = { x: 0, y: 0 };
    let wasDragging: boolean = false;
    let currentTool: Tools.ToolOptions;
    let interactionHandler: Interactions.IToolHandler | null = null;
    let entities: Tools.Entity[] = [];
    let temporaryEntities: Tools.Entity[] = [];
    let drawnSpriteByEntityId: Record<string, PIXI.Sprite> = {};

    export async function createApp(iconNames: Record<string, string>): Promise<void> {
        if (app) {
            app.destroy(true, { children: true });
        }
        Draw.init(iconNames);
        const parent = document.getElementById("tacticsCanvasContainer");
        if (!parent) return;
        app = new PIXI.Application();
        await app.init({ background: '#FFFFFF', resizeTo: parent });
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
            return new Interactions.DrawLineTool(entities, temporaryEntities, currentTool.lineDrawOptions, updateEntity);
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

    async function containerOnClick(event: MouseEvent): Promise<void> {
        if (!currentTool.iconOptions?.iconType || wasDragging) {
            wasDragging = false;
            return;
        }
        const x = event.offsetX;
        const y = event.offsetY;

        const icon: Icon = {
            points: [{ x, y }, { x: x + 40, y: y + 40 },],
            type: "Unit",
            iconType: currentTool.iconOptions?.iconType,
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
    }


    ////TODOS:
    //// - draw preview
    //// - load entites from server
    //// - save entities to server
    //// - other ToolTypes
    //// - cleanup
    async function updateEntity(entity: Tools.Entity): Promise<void> {
        const graphic = await Draw.drawEntity(entity);
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
    }

    function makeSpriteDraggable(sprite: PIXI.Sprite): void {
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        let dragging = false;
        let offset = { x: 0, y: 0 };

        function onPointerMove(event: PointerEvent) {
            if (dragging) {
                // Koordinaten relativ zum Canvas berechnen
                const rect = app.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                sprite.x = x - offset.x;
                sprite.y = y - offset.y;
            }
        }

        // Handler für das Loslassen
        function onPointerUp() {
            dragging = false;
            wasDragging = true;
            sprite.alpha = 1.0;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        }

        sprite.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            dragging = true;
            offset.x = event.global.x - sprite.x;
            offset.y = event.global.y - sprite.y;
            sprite.alpha = 0.7;
            // Globale Events hinzufügen
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        });
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

    type IconType = "Unit" | "StraightLine" | "Box" | "CurveLine";

    type Icon = {
        points: Tools.Point[];
        type: IconType;
        iconType: string;
        color: string;
    };

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

    function drawIcons(): void {
        iconContainer.removeChildren();
        for (const key in iconMap) {
            if (Object.prototype.hasOwnProperty.call(iconMap, key)) {
                const iconContainer = iconMap[key];
                mainContainer.addChild(iconContainer);
            }
        }
    }

    async function drawStraightLine(icon: Icon): Promise<PIXI.Sprite> {
        const graphics = new PIXI.Graphics();
        var spritePosX = Math.min(icon.points[0].x, icon.points[1].x);
        var spritePosY = Math.min(icon.points[0].y, icon.points[1].y)
        graphics.moveTo(icon.points[0].x - spritePosX, icon.points[0].y - spritePosY);
        graphics.lineTo(icon.points[1].x - spritePosX, icon.points[1].y - spritePosY);
        app.stage.addChild(graphics);

        const texture = app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = spritePosX;
        sprite.y = spritePosY;

        return sprite;
    }

    async function drawBox(icon: Icon): Promise<PIXI.Sprite> {
        const graphics = new PIXI.Graphics()
            .setFillStyle(icon.color)
            .filletRect(0, 0, icon.points[1].x - icon.points[0].x, icon.points[1].y - icon.points[0].y, 0);
        const texture = app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = icon.points[0].x;
        sprite.y = icon.points[0].y;
        return sprite;
    }

    async function drawCurveLine(icon: Icon): Promise<PIXI.Sprite> {
        // TODO: actual curve
        const graphics = new PIXI.Graphics();
        var spritePosX = Math.min(icon.points[0].x, icon.points[1].x);
        var spritePosY = Math.min(icon.points[0].y, icon.points[1].y)
        graphics.moveTo(icon.points[0].x - spritePosX, icon.points[0].y - spritePosY);
        graphics.lineTo(icon.points[1].x - spritePosX, icon.points[1].y - spritePosY);
        app.stage.addChild(graphics);

        const texture = app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = spritePosX;
        sprite.y = spritePosY;

        return sprite;
    }

    // Add more exported functions as needed, e.g. for panning, zoom, icon management, etc.
}

export default PixiInterop;