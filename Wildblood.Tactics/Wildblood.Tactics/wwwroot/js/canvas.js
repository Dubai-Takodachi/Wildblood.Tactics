let draggingIcon = null;
let offsetX, offsetY;

window.setBackground = function (background) {

    if (background == null || background == undefined) {
        return;
    }
    const canvas = document.getElementById('tacticsCanvas');
    let url = "url('/ConquerorsBladeData/Maps/" + background + ".png')";
    canvas.style.backgroundImage = url;
    canvas.style.backgroundSize = "cover";
}

window.setCanvasSize = function (canvasId) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');
    let parent = document.getElementById('tacticsCanvasContainer');
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    canvas.width = width;
    canvas.height = height;
};

window.placeIcon = function (unit) {
    const canvas = document.getElementById('tacticsCanvas');
    const ctx = canvas.getContext('2d');
    let image = new Image();
    image.src = unit.filePath;
    ctx.drawImage(image, unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY);
}

window.draw = function (icons) {
    const canvas = document.getElementById('tacticsCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ENUMS ARE ACCESSIBLE VIA THEIRE RESPECTIVE NUMBER UNIT = 0
    icons.forEach(unit => {
        if (unit.type === 1) {
            window.drawArrow(unit.startX, unit.startY, unit.endX, unit.endY, unit.color);
        }
        else if (unit.type === 0) {
            let image = new Image();
            image.src = unit.filePath;
            image.onload = () => {
                ctx.drawImage(image, unit.startX, unit.startY, unit.endX - unit.startX, unit.endY - unit.startY)
            }
        }
    })
}

window.drawArrow = function (fromX, fromY, toX, toY, color) {
    const canvas = document.getElementById('tacticsCanvas');
    const context = canvas.getContext('2d');
    var headlen = 10; // Length of arrow head
    var angle = Math.atan2(toY - fromY, toX - fromX);

    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();

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
}

window.startDrag = function (icon, x, y) {
    draggingIcon = icon;
    offsetX = x - icon.startX;
    offsetY = y - icon.startY;
    const dragImage = document.getElementById('dragImage');
    dragImage.src = icon.filePath;
    dragImage.style.display = 'block';
    dragImage.style.position = 'absolute';
    dragImage.style.width = '40px';
    dragImage.style.height = '40px';
    dragImage.style.left = `${x - offsetX}px`;
    dragImage.style.top = `${y - offsetY}px`;
};

window.dragIcon = function (x, y) {
    if (draggingIcon) {
        const dragImage = document.getElementById('dragImage');
        dragImage.style.left = `${x - offsetX}px`;
        dragImage.style.top = `${y - offsetY}px`;
    }
};

window.stopDrag = function () {
    draggingIcon = null;
    const dragImage = document.getElementById('dragImage');
    dragImage.style.display = 'none';
};

