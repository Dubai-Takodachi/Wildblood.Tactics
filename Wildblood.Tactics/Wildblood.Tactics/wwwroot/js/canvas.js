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
        ctx.drawImage(image, unit.x, unit.y, unit.height, unit.width)
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

