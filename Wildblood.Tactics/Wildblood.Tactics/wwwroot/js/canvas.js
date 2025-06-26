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

window.preLoadImages = function (icons) {
    imageCache = {}; // Reset the cache
    icons.forEach(unit => {
        let image = new Image();
        image.src = unit;
        imageCache[unit] = image
    });
}

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
        // Optionally, trigger a redraw here if needed
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
    if (imageCache[unit.filePath]) {
        offscreenContext.drawImage(imageCache[unit.filePath], unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
        window.copyToVisibleCanvas();
    } else {
        let image = new Image();
        image.src = unit.filePath;
        image.onload = () => {
            imageCache[unit.filePath] = image;
            offscreenContext.drawImage(image, unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
            window.copyToVisibleCanvas();
        };
        image.onerror = () => {
            console.error(`Failed to load image: ${unit.filePath}`);
        };
    }
};

window.draw = function (icons) {
    window.lastIcons = icons; // Store for redraws
    offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Draw background image if loaded
    if (backgroundImage) {
        // "Contain" logic as before
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
                offscreenContext.drawImage(imageCache[unit.filePath], unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
            }
        } else if (unit.type === 1) {
            window.drawArrow(unit.startX, unit.startY, unit.endX, unit.endY, unit.color);
        }
    });

    window.copyToVisibleCanvas();
};

window.drawArrow = function (fromX, fromY, toX, toY, color) {
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
    offscreenContext.strokeStyle = color
    offscreenContext.lineWidth = 2;
    offscreenContext.stroke();
    offscreenContext.fillStyle = color;
    offscreenContext.fill();

    window.copyToVisibleCanvas();
};

window.dragIcon = function (x, y, icons) {
    if (!isDragging) {
        isDragging = true;
        requestAnimationFrame(() => {
            if (draggingIcon && (x !== lastX || y !== lastY)) {
                lastX = x;
                lastY = y;
                draggingIcon.startX = x - offsetX;
                draggingIcon.startY = y - offsetY;
                draggingIcon.endX = draggingIcon.startX + 40; // Assuming the icon size is 40x40
                draggingIcon.endY = draggingIcon.startY + 40;

                window.draw(icons);
            } else if (draggingArrow) {
                let deltaX = x - offsetX;
                let deltaY = y - offsetY;

                draggingArrow.startX += deltaX;
                draggingArrow.startY += deltaY;
                draggingArrow.endX += deltaX;
                draggingArrow.endY += deltaY;

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
        offsetX = x - icon.startX;
        offsetY = y - icon.startY;
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

window.getLogicalMousePosition = function (canvasId, clientX, clientY) {
    const canvas = document.getElementById(canvasId);
    const rect = canvas.getBoundingClientRect();
    // Logical size (as used for drawing)
    const logicalWidth = 960;
    const logicalHeight = 540;
    const x = ((clientX - rect.left) / rect.width) * logicalWidth;
    const y = ((clientY - rect.top) / rect.height) * logicalHeight;
    return { x, y };
};
