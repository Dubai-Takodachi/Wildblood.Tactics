window.pixiInterop = {
    app: null,
    iconMap: {},
    bgSprite: null,
    pan: { x: 0, y: 0 },
    zoom: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    panOrigin: { x: 0, y: 0 },
    currentIcon: null,
    mainContainer: null,

    createApp: async function (canvasId) {
        if (window.pixiInterop.app) {
            window.pixiInterop.app.destroy(true, { children: true });
        }
        const parent = document.getElementById("tacticsCanvasContainer");
        window.pixiInterop.app = new PIXI.Application();
        await window.pixiInterop.app.init({ background: '#FFFFFF', resizeTo: parent })
        parent.appendChild(window.pixiInterop.app.canvas)

        this.mainContainer = new PIXI.Container();
        window.pixiInterop.app.stage.addChild(this.mainContainer);

        window.pixiInterop.iconMap = {};
        window.pixiInterop.bgSprite = null;
        window.pixiInterop.pan = { x: 0, y: 0 };
        window.pixiInterop.zoom = 1;
        window.pixiInterop.isPanning = false;
    },

    setSelectedUnit: function (unit) {
        currentIcon = "/ConquerorsBladeData/Units/" + unit;
    },

    containerOnClick: function (event) {
        console.log("Container clicked", event);
    },



    //destroyApp: function () {
    //    if (window.pixiInterop.app) {
    //        window.pixiInterop.app.destroy(true, { children: true });
    //        window.pixiInterop.app = null;
    //    }
    //    window.pixiInterop.iconMap = {};
    //    window.pixiInterop.bgSprite = null;
    //},

    setBackground: async function (imageUrl) {
        const app = window.pixiInterop.app;
        if (!app) return;
        if (window.pixiInterop.bgSprite) {
            app.stage.removeChild(window.pixiInterop.bgSprite);
        }
        const texture = await PIXI.Assets.load("ConquerorsBladeData/Maps/" + imageUrl + ".png");
        const bg = new PIXI.Sprite(texture);
        bg.width = app.screen.width;
        bg.height = app.screen.height;
        this.mainContainer.addChild(bg);
        window.pixiInterop.bgSprite = bg;
    },

    //clearStage: function () {
    //    const app = window.pixiInterop.app;
    //    if (!app) return;
    //    app.stage.removeChildren();
    //    window.pixiInterop.iconMap = {};
    //    if (window.pixiInterop.bgSprite) {
    //        app.stage.addChildAt(window.pixiInterop.bgSprite, 0);
    //    }
    //},

    //redrawAll: async function (icons) {
    //    window.pixiInterop.clearStage();
    //    if (!icons) return;
    //    for (let i = 0; i < icons.length; i++) {
    //        window.pixiInterop.addOrUpdateIcon(icons[i], i);
    //    }
    //},

    //addOrUpdateIcon: function (icon, index) {
    //    const app = window.pixiInterop.app;
    //    if (!app) return;
    //    if (window.pixiInterop.iconMap[index]) {
    //        app.stage.removeChild(window.pixiInterop.iconMap[index]);
    //    }
    //    let displayObj = null;
    //    // IconType: 0=Unit, 1=StraightLine, 2=Box, 3=CurveLine
    //    if (icon.type === 0) { // Unit/Image
    //        displayObj = PIXI.Sprite.from(icon.filePath);
    //        displayObj.x = icon.points[0].x;
    //        displayObj.y = icon.points[0].y;
    //        displayObj.width = icon.points[1].x - icon.points[0].x;
    //        displayObj.height = icon.points[1].y - icon.points[0].y;
    //    } else if (icon.type === 1) { // Straight Line
    //        displayObj = new PIXI.Graphics();
    //        displayObj.lineStyle(2, PIXI.utils.string2hex(icon.color));
    //        displayObj.moveTo(icon.points[0].x, icon.points[0].y);
    //        displayObj.lineTo(icon.points[1].x, icon.points[1].y);
    //    } else if (icon.type === 2) { // Box
    //        displayObj = new PIXI.Graphics();
    //        displayObj.lineStyle(2, PIXI.utils.string2hex(icon.color));
    //        const x = icon.points[0].x;
    //        const y = icon.points[0].y;
    //        const w = icon.points[1].x - icon.points[0].x;
    //        const h = icon.points[1].y - icon.points[0].y;
    //        displayObj.drawRect(x, y, w, h);
    //    } else if (icon.type === 3) { // Curve Line
    //        displayObj = new PIXI.Graphics();
    //        displayObj.lineStyle(2, PIXI.utils.string2hex(icon.color));
    //        if (icon.points.length > 1) {
    //            displayObj.moveTo(icon.points[0].x, icon.points[0].y);
    //            for (let i = 1; i < icon.points.length; i++) {
    //                displayObj.lineTo(icon.points[i].x, icon.points[i].y);
    //            }
    //        }
    //    }
    //    if (displayObj) {
    //        app.stage.addChild(displayObj);
    //        window.pixiInterop.iconMap[index] = displayObj;
    //    }
    //},
    //getPanning: function () {
    //    return this.isPanning;
    //},

    //removeIcon: function (index) {
    //    const app = window.pixiInterop.app;
    //    if (!app) return;
    //    const obj = window.pixiInterop.iconMap[index];
    //    if (obj) {
    //        app.stage.removeChild(obj);
    //        delete window.pixiInterop.iconMap[index];
    //    }
    //},

    //// Panning and zoom
    //startPan: function (clientX, clientY) {
    //    window.pixiInterop.isPanning = true;
    //    window.pixiInterop.panStart = { x: clientX, y: clientY };
    //    window.pixiInterop.panOrigin = { ...window.pixiInterop.pan };
    //},
    //updatePan: function (clientX, clientY) {
    //    if (!window.pixiInterop.isPanning) return;
    //    const dx = clientX - window.pixiInterop.panStart.x;
    //    const dy = clientY - window.pixiInterop.panStart.y;
    //    window.pixiInterop.pan.x = window.pixiInterop.panOrigin.x + dx;
    //    window.pixiInterop.pan.y = window.pixiInterop.panOrigin.y + dy;
    //    window.pixiInterop.applyPanZoom();
    //},
    //stopPan: function () {
    //    window.pixiInterop.isPanning = false;
    //},
    //isPanning: function () {
    //    return window.pixiInterop.isPanning;
    //},
    //setZoom: function (zoom) {
    //    window.pixiInterop.zoom = zoom;
    //    window.pixiInterop.applyPanZoom();
    //},
    //applyPanZoom: function () {
    //    const app = window.pixiInterop.app;
    //    if (!app) return;
    //    app.stage.x = window.pixiInterop.pan.x;
    //    app.stage.y = window.pixiInterop.pan.y;
    //    app.stage.scale.x = window.pixiInterop.zoom;
    //    app.stage.scale.y = window.pixiInterop.zoom;
    //},

    //// Mouse position conversion
    //getLogicalMousePosition: function (canvasId, clientX, clientY) {
    //    const canvas = document.getElementById(canvasId);
    //    const rect = canvas.getBoundingClientRect();
    //    const x = (clientX - rect.left - window.pixiInterop.pan.x) / window.pixiInterop.zoom;
    //    const y = (clientY - rect.top - window.pixiInterop.pan.y) / window.pixiInterop.zoom;
    //    return { x, y };
    //},

    //// Dragging (stub, expand as needed)
    //startDrag: function (icon, x, y) { /* implement as needed */ },
    //dragIcon: function (x, y, icons) { /* implement as needed */ },
    //stopDrag: function () { /* implement as needed */ }
};