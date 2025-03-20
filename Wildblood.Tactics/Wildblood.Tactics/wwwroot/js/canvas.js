window.setBackground = function (background) {

    if (background == null || background == undefined) {
        return;
    }
    const canvas = document.getElementById('tacticsCanvas');
    let url = "url('/ConquerorsBladeData/Maps/" + background + ".png')";
    canvas.style.backgroundImage = url;
    canvas.style.backgroundSize = "cover";
}

window.placeIcon = function (unit) {
    const canvas = document.getElementById('tacticsCanvas');
    const ctx = canvas.getContext('2d');
    let image = new Image();
    image.src = unit.filePath;
    ctx.drawImage(image, unit.x, unit.y, unit.height, unit.width);
}

window.draw = function (icons) {
    const canvas = document.getElementById('tacticsCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    icons.forEach(unit => {
        let image = new Image();
        image.src = unit.filePath;
        image.onload = () => {
            ctx.drawImage(image, unit.x, unit.y, unit.height, unit.width)
        }
    })
}

window.getFilesFromDirectory = async function (directory) {
    const response = await fetch(directory);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));
    return links.map(link => link.href).filter(href => href.endsWith('.png') || href.endsWith('.jpg') || href.endsWith('.jpeg'));
};

window.drawArrow = async function (context, fromX, fromY, toX, toY, color) {
    var headlen = 10; // Länge des Pfeilkopfes
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

