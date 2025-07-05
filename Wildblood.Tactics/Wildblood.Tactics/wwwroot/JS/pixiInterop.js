/// <reference types="pixi.js" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as PIXI from '../lib/pixi.mjs';
var PixiInterop;
(function (PixiInterop) {
    let app;
    let iconMap = {};
    let bgSprite = null;
    let pan = { x: 0, y: 0 };
    let zoom = 1;
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let panOrigin = { x: 0, y: 0 };
    let currentIcon = null;
    let mainContainer = new PIXI.Container();
    let iconContainer = new PIXI.Container();
    let dragging = false;
    let dragOffset = { x: 0, y: 0 };
    let ImageCache = {};
    let wasDragging = false;
    let currentTool;
    function createApp(canvasId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app) {
                app.destroy(true, { children: true });
            }
            const parent = document.getElementById("tacticsCanvasContainer");
            if (!parent)
                return;
            app = new PIXI.Application();
            yield app.init({ background: '#FFFFFF', resizeTo: parent });
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
        });
    }
    PixiInterop.createApp = createApp;
    function setSelectedUnit(unit) {
        currentIcon = "ConquerorsBladeData/Units/" + unit;
    }
    PixiInterop.setSelectedUnit = setSelectedUnit;
    function containerOnClick(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!currentIcon || wasDragging) {
                wasDragging = false;
                return;
            }
            const x = event.offsetX;
            const y = event.offsetY;
            const icon = {
                points: [{ x, y }, { x: x + 40, y: y + 40 },],
                type: "Unit",
                filePath: currentIcon,
                color: "#ffffff",
            };
            const sprite = yield drawUnit(icon);
            const spriteContainer = new PIXI.Container();
            spriteContainer.addChild(sprite);
            spriteContainer.x = x;
            spriteContainer.y = y;
            iconMap[crypto.randomUUID()] = spriteContainer;
            sprite.eventMode = "static";
            sprite.cursor = "pointer";
            makeSpriteDraggable(sprite);
            drawIcons();
        });
    }
    function makeSpriteDraggable(sprite) {
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        let dragging = false;
        let offset = { x: 0, y: 0 };
        function onPointerMove(event) {
            if (dragging) {
                // Koordinaten relativ zum Canvas berechnen
                const rect = app.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                sprite.x = x - offset.x;
                sprite.y = y - offset.y;
            }
        }
        // Handler f�r das Loslassen
        function onPointerUp() {
            dragging = false;
            wasDragging = true;
            sprite.alpha = 1.0;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        }
        sprite.on('pointerdown', (event) => {
            dragging = true;
            offset.x = event.global.x - sprite.x;
            offset.y = event.global.y - sprite.y;
            sprite.alpha = 0.7;
            // Globale Events hinzuf�gen
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        });
    }
    function setBackground(imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (bgSprite && app) {
                app.stage.removeChild(bgSprite);
            }
            const texture = yield PIXI.Assets.load("ConquerorsBladeData/Maps/" + imageUrl + ".png");
            const bg = new PIXI.Sprite(texture);
            bg.width = app.screen.width;
            bg.height = app.screen.height;
            mainContainer.addChild(bg);
            bgSprite = bg;
        });
    }
    PixiInterop.setBackground = setBackground;
    function redrawIcons(icons) {
        return __awaiter(this, void 0, void 0, function* () {
            iconMap = {}; // clear previous icons
            for (const key in icons) {
                if (Object.prototype.hasOwnProperty.call(icons, key)) {
                    const icon = icons[key];
                    const sprite = yield drawIcon[icon.type](icon);
                    const spriteContainer = new PIXI.Container();
                    spriteContainer.x = sprite.x;
                    spriteContainer.y = sprite.y;
                    spriteContainer.addChild(sprite);
                    iconMap[key] = spriteContainer;
                }
            }
            drawIcons();
        });
    }
    PixiInterop.redrawIcons = redrawIcons;
    function drawIcons() {
        iconContainer.removeChildren();
        for (const key in iconMap) {
            if (Object.prototype.hasOwnProperty.call(iconMap, key)) {
                const iconContainer = iconMap[key];
                mainContainer.addChild(iconContainer);
            }
        }
    }
    const drawIcon = {
        Unit: (unit) => { return drawUnit(unit); },
        StraightLine: (straightLine) => { return drawStraightLine(straightLine); },
        Box: (box) => { return drawBox(box); },
        CurveLine: (curveLine) => { return drawCurveLine(curveLine); }
    };
    function drawUnit(icon) {
        return __awaiter(this, void 0, void 0, function* () {
            let texture;
            if (!ImageCache[icon.filePath]) {
                texture = yield PIXI.Assets.load(icon.filePath);
                ImageCache[icon.filePath] = texture;
            }
            else {
                texture = ImageCache[icon.filePath];
            }
            const sprite = new PIXI.Sprite(texture);
            sprite.width = icon.points[1].x - icon.points[0].x;
            sprite.height = icon.points[1].y - icon.points[0].y;
            return sprite;
        });
    }
    function drawStraightLine(icon) {
        return __awaiter(this, void 0, void 0, function* () {
            const graphics = new PIXI.Graphics();
            var spritePosX = Math.min(icon.points[0].x, icon.points[1].x);
            var spritePosY = Math.min(icon.points[0].y, icon.points[1].y);
            graphics.moveTo(icon.points[0].x - spritePosX, icon.points[0].y - spritePosY);
            graphics.lineTo(icon.points[1].x - spritePosX, icon.points[1].y - spritePosY);
            app.stage.addChild(graphics);
            const texture = app.renderer.generateTexture(graphics);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = spritePosX;
            sprite.y = spritePosY;
            return sprite;
        });
    }
    function drawBox(icon) {
        return __awaiter(this, void 0, void 0, function* () {
            const graphics = new PIXI.Graphics()
                .setFillStyle(icon.color)
                .filletRect(0, 0, icon.points[1].x - icon.points[0].x, icon.points[1].y - icon.points[0].y, 0);
            const texture = app.renderer.generateTexture(graphics);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = icon.points[0].x;
            sprite.y = icon.points[0].y;
            return sprite;
        });
    }
    function drawCurveLine(icon) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: actual curve
            const graphics = new PIXI.Graphics();
            var spritePosX = Math.min(icon.points[0].x, icon.points[1].x);
            var spritePosY = Math.min(icon.points[0].y, icon.points[1].y);
            graphics.moveTo(icon.points[0].x - spritePosX, icon.points[0].y - spritePosY);
            graphics.lineTo(icon.points[1].x - spritePosX, icon.points[1].y - spritePosY);
            app.stage.addChild(graphics);
            const texture = app.renderer.generateTexture(graphics);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = spritePosX;
            sprite.y = spritePosY;
            return sprite;
        });
    }
    function preLoadImages(imagePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let path of imagePaths) {
                if (!ImageCache[path]) {
                    const texture = yield PIXI.Assets.load(path);
                    ImageCache[path] = texture;
                }
            }
        });
    }
    PixiInterop.preLoadImages = preLoadImages;
    // Add more exported functions as needed, e.g. for panning, zoom, icon management, etc.
})(PixiInterop || (PixiInterop = {}));
export default PixiInterop;
//# sourceMappingURL=pixiInterop.js.map