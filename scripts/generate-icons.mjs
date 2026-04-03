import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';

const SIZES = [
  { name: 'favicon', size: 64 },
  { name: 'pwa-192x192', size: 192 },
  { name: 'pwa-512x512', size: 512 },
];

const BG_COLOR = '#60a5fa';
const HAND_COLOR = '#ffffff';
const GLOBE_COLOR = '#3b82f6';
const GLOBE_LINE = '#dbeafe';

function drawGlobeInHands(ctx, s) {
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.28;

  // Background circle
  ctx.beginPath();
  ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
  ctx.fillStyle = BG_COLOR;
  ctx.fill();

  // Hands (two curved arcs cradling the globe from below)
  ctx.strokeStyle = HAND_COLOR;
  ctx.lineWidth = s * 0.04;
  ctx.lineCap = 'round';

  // Left hand
  ctx.beginPath();
  ctx.arc(cx - r * 0.1, cy + r * 0.3, r * 1.15, Math.PI * 0.65, Math.PI * 1.0);
  ctx.stroke();

  // Right hand
  ctx.beginPath();
  ctx.arc(cx + r * 0.1, cy + r * 0.3, r * 1.15, Math.PI * 0.0, Math.PI * 0.35);
  ctx.stroke();

  // Globe circle
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.04, r, 0, Math.PI * 2);
  ctx.fillStyle = GLOBE_COLOR;
  ctx.fill();
  ctx.strokeStyle = GLOBE_LINE;
  ctx.lineWidth = s * 0.015;
  ctx.stroke();

  // Globe latitude lines
  const globeY = cy - s * 0.04;
  ctx.strokeStyle = GLOBE_LINE;
  ctx.lineWidth = s * 0.012;

  // Equator
  ctx.beginPath();
  ctx.ellipse(cx, globeY, r, r * 0.15, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Upper latitude
  ctx.beginPath();
  ctx.ellipse(cx, globeY - r * 0.4, r * 0.75, r * 0.12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Lower latitude
  ctx.beginPath();
  ctx.ellipse(cx, globeY + r * 0.4, r * 0.75, r * 0.12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Meridian (vertical ellipse)
  ctx.beginPath();
  ctx.ellipse(cx, globeY, r * 0.15, r, 0, 0, Math.PI * 2);
  ctx.stroke();
}

mkdirSync('public', { recursive: true });

for (const { name, size } of SIZES) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawGlobeInHands(ctx, size);

  const ext = name === 'favicon' ? 'png' : 'png';
  const path = `public/${name}.${ext}`;
  writeFileSync(path, canvas.toBuffer('image/png'));
  console.log(`✓ ${path} (${size}x${size})`);
}

console.log('\nDone! Convert favicon.png to .ico if needed.');
