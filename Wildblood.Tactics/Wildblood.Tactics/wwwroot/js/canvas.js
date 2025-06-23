let draggingIcon = null;
let draggingArrow = null;
let dragMode = null;
let offsetX, offsetY, lastX, lastY;
let imageCache = {}; // Cache für Bilder
const canvasId = "tacticsCanvas";

window.setBackground = function (background) {
    if (background == null || background == undefined) {
        return;
    }
    let canvas = document.getElementById(canvasId);
    let url = "url('/ConquerorsBladeData/Maps/" + background + ".png')";
    canvas.style.backgroundImage = url;
    canvas.style.backgroundSize = "cover";
};

window.setCanvasSize = function (canvasId) {
    let canvas = document.getElementById(canvasId);
    let parent = document.getElementById('tacticsCanvasContainer');
    let width = parent.clientWidth;
    let height = parent.clientHeight;

    canvas.width = width;
    canvas.height = height;
};

window.placeIcon = function (unit) {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext('2d');

    if (imageCache[unit.filePath]) {
        context.drawImage(imageCache[unit.filePath], unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
    } else {
        let image = new Image();
        image.src = unit.filePath;
        image.onload = () => {
            imageCache[unit.filePath] = image;
            context.drawImage(image, unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
        };
        image.onerror = () => {
            console.error(`Failed to load image: ${unit.filePath}`);
        };
    }
};

window.draw = function (icons) {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    icons.forEach(unit => {
        if (unit.type === 0) {
            if (imageCache[unit.filePath]) {
                context.drawImage(imageCache[unit.filePath], unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
            } else {
                let image = new Image();
                image.src = unit.filePath;
                image.onload = () => {
                    imageCache[unit.filePath] = image;
                    context.drawImage(image, unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
                };
                image.onerror = () => {
                    console.error(`Failed to load image: ${unit.filePath}`);
                };
            }
        } else if (unit.type === 1) {
            window.drawArrow(unit.startX, unit.startY, unit.endX, unit.endY, unit.color);
        }
    });
};

window.drawArrow = function (fromX, fromY, toX, toY, color) {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext('2d');
    var headlen = 10; // Length of arrow head
    var angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw the arrow line
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();

    // Draw the arrowhead
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    context.lineTo(toX, toY);
    context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = color;
    context.fill();
};

window.dragIcon = function (x, y, icons) {
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

