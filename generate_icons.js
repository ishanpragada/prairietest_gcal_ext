/**
 * Generates simple PNG icons for the extension using the Canvas API (Node.js).
 * Run once: node generate_icons.js
 * Requires: npm install canvas
 *
 * If you'd rather skip this, replace the icons/ directory with your own PNGs
 * or any 16x16, 48x48, and 128x128 PNG files.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const r = size * 0.1; // corner radius
  const pad = Math.max(1, size * 0.06);

  // Background: Google-blue rounded rect
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(size - pad - r, pad);
  ctx.quadraticCurveTo(size - pad, pad, size - pad, pad + r);
  ctx.lineTo(size - pad, size - pad - r);
  ctx.quadraticCurveTo(size - pad, size - pad, size - pad - r, size - pad);
  ctx.lineTo(pad + r, size - pad);
  ctx.quadraticCurveTo(pad, size - pad, pad, size - pad - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();
  ctx.fillStyle = '#1a73e8';
  ctx.fill();

  // Calendar icon (white)
  const s = size - pad * 2;
  const cx = pad;
  const cy = pad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size * 0.07);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Outer rect
  const ir = s * 0.12; // inner radius
  const x0 = cx + s * 0.12, y0 = cy + s * 0.15;
  const x1 = cx + s * 0.88, y1 = cy + s * 0.88;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

  // Horizontal line (header separator)
  const headerY = cy + s * 0.38;
  ctx.beginPath();
  ctx.moveTo(x0, headerY);
  ctx.lineTo(x1, headerY);
  ctx.stroke();

  // Two "ring" ticks at top
  const tick1X = cx + s * 0.3;
  const tick2X = cx + s * 0.7;
  const tickTop = cy + s * 0.08;
  const tickBot = cy + s * 0.25;
  [tick1X, tick2X].forEach((tx) => {
    ctx.beginPath();
    ctx.moveTo(tx, tickTop);
    ctx.lineTo(tx, tickBot);
    ctx.stroke();
  });

  // Grid dots (3 columns x 2 rows)
  ctx.fillStyle = '#ffffff';
  const dotR = Math.max(1, size * 0.05);
  const cols = [cx + s * 0.28, cx + s * 0.5, cx + s * 0.72];
  const rows = [cy + s * 0.55, cy + s * 0.73];
  for (const row of rows) {
    for (const col of cols) {
      ctx.beginPath();
      ctx.arc(col, row, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas.toBuffer('image/png');
}

const sizes = [16, 48, 128];
const outDir = path.join(__dirname, 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const sz of sizes) {
  const buf = drawIcon(sz);
  const outPath = path.join(outDir, `icon${sz}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`Written ${outPath}`);
}
