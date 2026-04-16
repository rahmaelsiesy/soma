// Generate Soma PWA icons using canvas
// Run with: node generate-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background: dark surface
  ctx.fillStyle = '#1c1c22';
  ctx.fillRect(0, 0, size, size);

  // Rounded rect clipping (simulate border radius = size * 0.22)
  const r = Math.round(size * 0.22);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = '#1c1c22';
  ctx.fill();
  ctx.clip();

  // Re-fill background after clip
  ctx.fillStyle = '#1c1c22';
  ctx.fillRect(0, 0, size, size);

  // Letter S in gold
  ctx.fillStyle = '#d4a44c';
  const fontSize = Math.round(size * 0.56);
  ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size / 2, size / 2 + size * 0.03);

  return canvas.toBuffer('image/png');
}

const dir = __dirname;

try {
  const buf192 = generateIcon(192);
  fs.writeFileSync(path.join(dir, 'icon-192.png'), buf192);
  console.log('icon-192.png written');

  const buf512 = generateIcon(512);
  fs.writeFileSync(path.join(dir, 'icon-512.png'), buf512);
  console.log('icon-512.png written');
} catch (e) {
  console.error('canvas module not available, using fallback Python script');
  process.exit(1);
}
