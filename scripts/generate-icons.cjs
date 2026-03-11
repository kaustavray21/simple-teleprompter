const sharp = require('sharp');
const fs = require('fs');

async function generate() {
    const svg = fs.readFileSync('./public/screen.svg');
    await sharp(svg).resize(192, 192).png().toFile('./public/icon-192x192.png');
    await sharp(svg).resize(512, 512).png().toFile('./public/icon-512x512.png');

    // Create a maskable icon with a solid background (black #000000)
    await sharp(svg)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .png()
        .toFile('./public/maskable-icon-512x512.png');

    console.log("Generated PWA icons!");
}
generate();
