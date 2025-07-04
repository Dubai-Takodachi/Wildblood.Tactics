/// <reference types="pixi.js" />

import * as PIXI from '../lib/pixi.mjs';

namespace PixiInterop {
    let app: PIXI.Application;
    let iconMap: Record<string, PIXI.Container> = {};
    let bgSprite: PIXI.Sprite | null = null;
    let pan: { x: number; y: number } = { x: 0, y: 0 };
    let zoom: number = 1;
    let isPanning: boolean = false;
    let panStart: { x: number; y: number } = { x: 0, y: 0 };
    let panOrigin: { x: number; y: number } = { x: 0, y: 0 };
    let currentIcon: string | null = null;
    let mainContainer: PIXI.Container = new PIXI.Container();
    let iconContainer: PIXI.Container = new PIXI.Container();
    let dragging: boolean = false;
    let dragOffset: { x: number; y: number } = { x: 0, y: 0 };
    let ImageCache: Record<string, PIXI.Texture> = {};
    let wasDragging: boolean = false;

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
        mainContainer.addChild(iconContainer);
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
        if (!currentIcon || wasDragging) {
            wasDragging = false;
            return;
        }
        const x = event.offsetX;
        const y = event.offsetY;

        const icon: Icon = {
            points: [{ x, y }, { x: x + 40, y: y + 40 },],
            type: "Unit",
            filePath: currentIcon,
            color: "#ffffff",
        };

        const sprite = await drawUnit(icon);

        const spriteContainer = new PIXI.Container();
        spriteContainer.addChild(sprite);
        spriteContainer.x = x;
        spriteContainer.y = y;

        iconMap[crypto.randomUUID()] = spriteContainer;
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        makeSpriteDraggable(sprite);
        drawIcons();
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

    type Point = {
        x: number;
        y: number;
    };

    type IconType = "Unit" | "StraightLine" | "Box" | "CurveLine";

    type Icon = {
        points: Point[];
        type: IconType;
        filePath: string;
        color: string;
    };

    export async function redrawIcons(icons: Record <string, Icon>): Promise<void> {
        iconMap = {}; // clear previous icons

        for (const key in icons) {
            if (Object.prototype.hasOwnProperty.call(icons, key)) {
                const icon = icons[key];
                const sprite = await drawIcon[icon.type](icon);

                const spriteContainer = new PIXI.Container();
                spriteContainer.x = sprite.x;
                spriteContainer.y = sprite.y;

                spriteContainer.addChild(sprite);

                iconMap[key] = spriteContainer;
            }
        }

        drawIcons();
    }

    function drawIcons(): void {
        iconContainer.removeChildren();
        for (const key in iconMap) {
            if (Object.prototype.hasOwnProperty.call(iconMap, key)) {
                const iconContainer = iconMap[key];
                mainContainer.addChild(iconContainer);
            }
        }
    }

    const drawIcon: Record<IconType, (icon: Icon) => Promise<PIXI.Sprite>> = {
        Unit: (unit) => { return drawUnit(unit) },
        StraightLine: (straightLine) => { return drawStraightLine(straightLine) },
        Box: (box) => { return drawBox(box) },
        CurveLine: (curveLine) => { return drawCurveLine(curveLine) }
    };

    async function drawUnit(icon: Icon): Promise<PIXI.Sprite> {
        let texture: PIXI.Texture;

        if (!ImageCache[icon.filePath]) {
            texture = await PIXI.Assets.load(icon.filePath);
            ImageCache[icon.filePath] = texture;
        }
        else {
            texture = ImageCache[icon.filePath];  
        }
        const sprite = new PIXI.Sprite(texture);
        sprite.width = icon.points[1].x - icon.points[0].x;
        sprite.height = icon.points[1].y - icon.points[0].y;
        return sprite;
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

    export async function preLoadImages(imagePaths: string[]): Promise<void> {
        for (let path of imagePaths) {
            if (!ImageCache[path]) {
                const texture = await PIXI.Assets.load(path);
                ImageCache[path] = texture;
            }
        }
    }

    // Add more exported functions as needed, e.g. for panning, zoom, icon management, etc.
}

export default PixiInterop;