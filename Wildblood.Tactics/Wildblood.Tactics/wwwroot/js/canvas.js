let draggingIcon = null;
let draggingArrow = null;
let dragMode = null;
let offsetX, offsetY, lastX, lastY;
let imageCache = {}; // Cache for images
const canvasId = "tacticsCanvas";
let offscreenCanvas = document.createElement('canvas');
let offscreenContext = offscreenCanvas.getContext('2d');
let isDragging = false; // Flag to prevent multiple redraws
let currentBackground;
let backgroundImage = null; // Store the background image
let zoom = 1.0; // Default zoom

// Pan state
let panX = 0;
let panY = 0;

// Helper to get canvas center in logical coordinates
function getCanvasCenter() {
    const logicalWidth = 960;
    const logicalHeight = 540;
    return { x: logicalWidth / 2, y: logicalHeight / 2 };
}

// Set zoom, optionally around a point (in logical coordinates)
window.setZoom = function (factor, centerX = null, centerY = null) {
    factor = Math.max(0.1, factor);
    if (factor === zoom) return;

    // If no center is given, zoom around canvas center
    if (centerX === null || centerY === null) {
        const center = getCanvasCenter();
        centerX = center.x;
        centerY = center.y;
    }

    // Adjust pan so that (centerX, centerY) stays under the same screen pixel
    panX = (panX - centerX) * (factor / zoom) + centerX;
    panY = (panY - centerY) * (factor / zoom) + centerY;

    zoom = factor;
    window.draw(window.lastIcons || []);
};

window.getZoom = function () {
    return zoom;
};

window.setPan = function (x, y) {
    panX = x;
    panY = y;
    window.draw(window.lastIcons || []);
};

window.getPan = function () {
    return { x: panX, y: panY };
};

window.resetPan = function () {
    panX = 0;
    panY = 0;
    window.draw(window.lastIcons || []);
};

window.preLoadImages = function (icons) {
    imageCache = {}; // Reset the cache
    icons.forEach(unit => {
        let image = new Image();
        image.src = unit;
        imageCache[unit] = image;
    });
};

window.setBackground = function (background) {
    if (!background) return;
    let canvas = document.getElementById(canvasId);

    const logicalWidth = 960;
    const logicalHeight = 540;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    offscreenCanvas.width = logicalWidth * dpr;
    offscreenCanvas.height = logicalHeight * dpr;

    let ctx = offscreenContext;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    let img = new Image();
    img.src = "/ConquerorsBladeData/Maps/" + background + ".png";
    img.onload = function () {
        backgroundImage = img; // Store for later use in draw()
        window.draw(window.lastIcons || []);
    };

    currentBackground = background;

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    offscreenCanvas.style.width = "100%";
    offscreenCanvas.style.height = "100%";
};

window.setCanvasSize = function (canvasId) {
    let canvas = document.getElementById(canvasId);
    let parent = document.getElementById('tacticsCanvasContainer');
    let width = parent.clientWidth;
    let height = parent.clientHeight;

    canvas.width = width;
    canvas.height = height;

    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
};

window.placeIcon = function (unit) {
    offscreenContext.save();
    offscreenContext.translate(panX, panY);
    offscreenContext.scale(zoom, zoom);
    if (imageCache[unit.filePath]) {
        offscreenContext.drawImage(
            imageCache[unit.filePath],
            unit.points[0].x, unit.points[0].y,
            unit.points[1].x - unit.points[0].x, unit.points[1].y - unit.points[0].y
        );
        offscreenContext.restore();
        window.copyToVisibleCanvas();
    } else {
        let image = new Image();
        image.src = unit.filePath;
        image.onload = () => {
            imageCache[unit.filePath] = image;
            offscreenContext.drawImage(
                image,
                unit.points[0].x, unit.points[0].y,
                unit.points[1].x - unit.points[0].x, unit.points[1].y - unit.points[0].y
            );
            offscreenContext.restore();
            window.copyToVisibleCanvas();
        };
        image.onerror = () => {
            offscreenContext.restore();
            console.error(`Failed to load image: ${unit.filePath}`);
        };
    }
};

window.draw = function (icons) {
    window.lastIcons = icons; // Store for redraws
    offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Draw everything with pan and zoom
    offscreenContext.save();
    offscreenContext.translate(panX, panY);
    offscreenContext.scale(zoom, zoom);

    // Draw background image if loaded
    if (backgroundImage) {
        const logicalWidth = 960;
        const logicalHeight = 540;
        const imgAspect = backgroundImage.width / backgroundImage.height;
        const canvasAspect = logicalWidth / logicalHeight;

        let drawWidth, drawHeight, offsetX, offsetY;
        if (imgAspect > canvasAspect) {
            drawWidth = logicalWidth;
            drawHeight = logicalWidth / imgAspect;
            offsetX = 0;
            offsetY = (logicalHeight - drawHeight) / 2;
        } else {
            drawHeight = logicalHeight;
            drawWidth = logicalHeight * imgAspect;
            offsetX = (logicalWidth - drawWidth) / 2;
            offsetY = 0;
        }
        offscreenContext.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Draw icons/arrows
    icons.forEach(unit => {
        if (unit.type === 0) {
            if (imageCache[unit.filePath]) {
                offscreenContext.drawImage(
                    imageCache[unit.filePath],
                    unit.points[0].x, unit.points[0].y,
                    unit.points[1].x - unit.points[0].x, unit.points[1].y - unit.points[0].y
                );
            }
        } else if (unit.type === 1) {
            window.drawArrow(unit.points[0].x, unit.points[0].y, unit.points[1].x, unit.points[1].y, unit.color, true);
        } else if (unit.type === 3) {
            window.drawSpline(unit.points, 0.5, 16, unit.color);
        }
    });

    offscreenContext.restore();
    window.copyToVisibleCanvas();
};

window.drawArrow = function (fromX, fromY, toX, toY, color, skipZoom) {
    // skipZoom: if true, don't scale again (already scaled in draw)
    if (!skipZoom) {
        offscreenContext.save();
        offscreenContext.translate(panX, panY);
        offscreenContext.scale(zoom, zoom);
    }

    var headlen = 10; // Length of arrow head
    var angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw the arrow line
    offscreenContext.beginPath();
    offscreenContext.moveTo(fromX, fromY);
    offscreenContext.lineTo(toX, toY);
    offscreenContext.strokeStyle = color;
    offscreenContext.lineWidth = 2;
    offscreenContext.stroke();

    // Draw the arrowhead
    offscreenContext.beginPath();
    offscreenContext.moveTo(toX, toY);
    offscreenContext.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    offscreenContext.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    offscreenContext.lineTo(toX, toY);
    offscreenContext.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    offscreenContext.strokeStyle = color;
    offscreenContext.lineWidth = 2;
    offscreenContext.stroke();
    offscreenContext.fillStyle = color;
    offscreenContext.fill();

    if (!skipZoom) offscreenContext.restore();
};

window.dragIcon = function (x, y, icons) {
    if (!isDragging) {
        isDragging = true;
        requestAnimationFrame(() => {
            if (draggingIcon && (x !== lastX || y !== lastY)) {
                lastX = x;
                lastY = y;
                draggingIcon.points[0].x = (x - offsetX);
                draggingIcon.points[0].y = (y - offsetY);
                draggingIcon.points[1].x = draggingIcon.points[0].x + 40;
                draggingIcon.points[1].y = draggingIcon.points[0].y + 40;

                window.draw(icons);
            } else if (draggingArrow) {
                let deltaX = x - offsetX;
                let deltaY = y - offsetY;

                draggingArrow.points[0].x += deltaX;
                draggingArrow.points[0].y += deltaY;
                draggingArrow.points[1].x += deltaX;
                draggingArrow.points[1].y += deltaY;

                offsetX = x;
                offsetY = y;

                window.draw(icons);
            }
            isDragging = false;
        });
    }
};

window.startDrag = function (icon, x, y) {
    if (icon.type === 0) {
        draggingIcon = icon;
        offsetX = x - icon.points[0].x;
        offsetY = y - icon.points[0].y;
        lastX = x;
        lastY = y;
    } else if (icon.type === 1) {
        draggingArrow = icon;
        offsetX = x;
        offsetY = y;
    }
};

window.stopDrag = function () {
    draggingIcon = null;
    draggingArrow = null;
};

window.copyToVisibleCanvas = function () {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(offscreenCanvas, 0, 0);
};

// Adjust mouse position for pan and zoom
window.getLogicalMousePosition = function (canvasId, clientX, clientY) {
    const canvas = document.getElementById(canvasId);
    const rect = canvas.getBoundingClientRect();
    // Logical size (as used for drawing)
    const logicalWidth = 960;
    const logicalHeight = 540;
    // Adjust for pan and zoom
    const x = (((clientX - rect.left) / rect.width) * logicalWidth - panX) / zoom;
    const y = (((clientY - rect.top) / rect.height) * logicalHeight - panY) / zoom;
    return { x, y };
};

window.drawSpline = function (points, tension = 0.5, segments = 16, color = '#ffffff') {
    offscreenContext.beginPath();
    offscreenContext.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        for (let j = 0; j <= segments; j++) {
            const t = j / segments;

            const tt = t * t;
            const ttt = tt * t;

            const q1 = -tension * ttt + 2 * tension * tt - tension * t;
            const q2 = (2 - tension) * ttt + (tension - 3) * tt + 1;
            const q3 = (tension - 2) * ttt + (3 - 2 * tension) * tt + tension * t;
            const q4 = tension * ttt - tension * tt;

            const x = q1 * p0.x + q2 * p1.x + q3 * p2.x + q4 * p3.x;
            const y = q1 * p0.y + q2 * p1.y + q3 * p2.y + q4 * p3.y;

            offscreenContext.lineTo(x, y);
        }
    }

    offscreenContext.strokeStyle = color;
    offscreenContext.lineWidth = 2;
    offscreenContext.stroke();

    offscreenContext.restore();
    window.copyToVisibleCanvas();
};
