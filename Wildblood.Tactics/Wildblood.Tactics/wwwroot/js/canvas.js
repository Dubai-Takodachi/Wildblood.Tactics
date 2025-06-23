let draggingIcon = null;
let draggingArrow = null;
let dragMode = null;
let offsetX, offsetY, lastX, lastY;
let offscreenCanvas = document.createElement('canvas');
let offscreenContext = offscreenCanvas.getContext('2d');
let imageCache = {}; // Cache für Bilder

window.setBackground = function (background) {

    if (background == null || background == undefined) {
        return;
    }
    let canvas = document.getElementById('tacticsCanvas');
    let url = "url('/ConquerorsBladeData/Maps/" + background + ".png')";
    canvas.style.backgroundImage = url;
    canvas.style.backgroundSize = "cover";
}

window.setCanvasSize = function (canvasId) {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext('2d');
    let parent = document.getElementById('tacticsCanvasContainer');
    let width = parent.clientWidth;
    let height = parent.clientHeight;

    canvas.width = width;
    canvas.height = height;

    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
};

window.placeIcon = function (unit) {
    let image = new Image();
    image.src = unit.filePath;
    offscreenContext.drawImage(image, unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
}

window.draw = function (icons) {
    offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    // ENUMS ARE ACCESSIBLE VIA THEIRE RESPECTIVE NUMBER UNIT = 0
    let promises = icons.map(unit => {
        return new Promise(resolve => {
            if (unit.type === 0) {
                // Prüfe, ob das Bild bereits im Cache ist
                if (imageCache[unit.filePath]) {
                    // Verwende das gecachte Bild
                    offscreenContext.drawImage(imageCache[unit.filePath], unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
                    resolve();
                } else {
                    // Lade das Bild und speichere es im Cache
                    let image = new Image();
                    image.src = unit.filePath;
                    image.onload = () => {
                        imageCache[unit.filePath] = image; // Speichere das Bild im Cache
                        offscreenContext.drawImage(image, unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
                        resolve();
                    };
                    image.onerror = () => {
                        console.error(`Failed to load image: ${unit.filePath}`);
                        resolve(); // Fehler beim Laden, aber Promise wird erfüllt
                    };
                }
            } else if (unit.type === 1) {
                window.drawArrow(unit.startX, unit.startY, unit.endX, unit.endY, unit.color);
                resolve();
            }
        });
    });

    // Warte, bis alle Bilder geladen und gezeichnet sind
    Promise.all(promises).then(() => {
        let canvas = document.getElementById('tacticsCanvas');
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0); // Offscreen-Canvas auf Onscreen-Canvas kopieren
    });

}

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
    offscreenContext.strokeStyle = color;
    offscreenContext.lineWidth = 2;
    offscreenContext.stroke();
    offscreenContext.fillStyle = color;
    offscreenContext.fill();

};

window.dragIcon = function (x, y, icons) {
    if (draggingIcon && (x !== lastX || y !== lastY)) {
        lastX = x;
        lastY = y;
        requestAnimationFrame(() => {
            let dragImage = document.getElementById('dragImage');
            dragImage.style.left = `${x - offsetX}px`;
            dragImage.style.top = `${y - offsetY}px`;
        });
    } else if (draggingArrow) {
        let deltaX = x - offsetX;
        let deltaY = y - offsetY;

        // Update both start and end points of the arrow
        draggingArrow.startX += deltaX;
        draggingArrow.startY += deltaY;
        draggingArrow.endX += deltaX;
        draggingArrow.endY += deltaY;

        // Update offset for next movement
        offsetX = x;
        offsetY = y;

        // Redraw the arrow dynamically
        window.drawArrow(
            draggingArrow.startX,
            draggingArrow.startY,
            draggingArrow.endX,
            draggingArrow.endY,
            draggingArrow.color,
            true,
            x,
            y
        );
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
        let dragImage = document.getElementById('dragImage');
        dragImage.src = icon.filePath;
        dragImage.style.display = 'block';
        dragImage.style.position = 'absolute';
        dragImage.style.width = '40px';
        dragImage.style.height = '40px';
        dragImage.style.left = `${x}px`;
        dragImage.style.top = `${y}px`;
    }
    else if (icon.type === 1) {
        draggingArrow = icon;
        offsetX = x;
        offsetY = y;
    }
};

window.stopDrag = function () {
    draggingIcon = null;
    draggingArrow = null;
    let dragImage = document.getElementById('dragImage');
    dragImage.style.display = 'none';
};

