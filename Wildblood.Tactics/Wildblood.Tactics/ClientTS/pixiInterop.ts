/// <reference types="pixi.js" />

import * as PIXI from '../lib/pixi.mjs';

namespace PixiInterop {
    let app: PIXI.Application | null = null;
    let iconMap: Record<string | number, PIXI.Sprite> = {};
    let bgSprite: PIXI.Sprite | null = null;
    let pan: { x: number; y: number } = { x: 0, y: 0 };
    let zoom: number = 1;
    let isPanning: boolean = false;
    let panStart: { x: number; y: number } = { x: 0, y: 0 };
    let panOrigin: { x: number; y: number } = { x: 0, y: 0 };
    let currentIcon: string | null = null;
    let mainContainer: PIXI.Container | null = null;
    let dragging: boolean = false;
    let dragOffset: { x: number; y: number } = { x: 0, y: 0 };

    export async function createApp(canvasId: string): Promise<void> {
        if (app) {
            app.destroy(true, { children: true });
        }
        const parent = document.getElementById("tacticsCanvasContainer");
        if (!parent) return;
        app = new PIXI.Application();
        await app.init({ background: '#FFFFFF', resizeTo: parent });
        parent.appendChild(app.canvas);

        mainContainer = new PIXI.Container();
        app.stage.addChild(mainContainer);

        app.canvas.addEventListener("click", containerOnClick);

        iconMap = {};
        bgSprite = null;
        pan = { x: 0, y: 0 };
        zoom = 1;
        isPanning = false;
    }

    export function setSelectedUnit(unit: string): void {
        currentIcon = "ConquerorsBladeData/Units/" + unit;
    }

    async function containerOnClick(event: MouseEvent): Promise<void> {
        if (!mainContainer || !currentIcon) return;
        const x = event.offsetX;
        const y = event.offsetY;
        const spriteContainer = new PIXI.Container();
        spriteContainer.x = x;
        spriteContainer.y = y;

        mainContainer.addChild(spriteContainer);
        const texture = await PIXI.Assets.load(currentIcon);
        const sprite = new PIXI.Sprite(texture);
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        makeSpriteDraggable(sprite);
        spriteContainer.addChild(sprite);
    }

    function makeSpriteDraggable(sprite: PIXI.Sprite): void {
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';

        let dragging = false;
        let offset = { x: 0, y: 0 };

        sprite.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            dragging = true;
            offset.x = event.global.x - sprite.x;
            offset.y = event.global.y - sprite.y;
            sprite.alpha = 0.7;
        });

        sprite.on('pointerup', () => {
            dragging = false;
            sprite.alpha = 1.0;
        });

        sprite.on('pointerupoutside', () => {
            dragging = false;
            sprite.alpha = 1.0;
        });

        sprite.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
            if (dragging) {
                sprite.x = event.global.x - offset.x;
                sprite.y = event.global.y - offset.y;
            }
        });
    }

    export async function setBackground(imageUrl: string): Promise<void> {
        if (!app || !mainContainer) return;
        if (bgSprite) {
            app.stage.removeChild(bgSprite);
        }
        const texture = await PIXI.Assets.load("ConquerorsBladeData/Maps/" + imageUrl + ".png");
        const bg = new PIXI.Sprite(texture);
        bg.width = app.screen.width;
        bg.height = app.screen.height;
        mainContainer.addChild(bg);
        bgSprite = bg;
    }

    // Add more exported functions as needed, e.g. for panning, zoom, icon management, etc.
}

export default PixiInterop;