import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e17100" />
      <stop offset="100%" stop-color="#973c00" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)" />
  <line x1="0" y1="256" x2="512" y2="256" stroke="black" stroke-opacity="0.1" stroke-width="2" />
  <line x1="256" y1="0" x2="256" y2="512" stroke="black" stroke-opacity="0.1" stroke-width="2" />
  <g transform="translate(140, 160) rotate(-12)">
    <rect width="160" height="160" rx="32" fill="white" />
    <circle cx="40" cy="40" r="16" fill="#101828" />
    <circle cx="80" cy="80" r="16" fill="#101828" />
    <circle cx="120" cy="120" r="16" fill="#101828" />
  </g>
  <g transform="translate(230, 220) rotate(12)">
    <rect width="160" height="160" rx="32" fill="white" />
    <circle cx="40" cy="40" r="16" fill="#101828" />
    <circle cx="120" cy="40" r="16" fill="#101828" />
    <circle cx="80" cy="80" r="16" fill="#101828" />
    <circle cx="40" cy="120" r="16" fill="#101828" />
    <circle cx="120" cy="120" r="16" fill="#101828" />
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve('public');
  await fs.mkdir(publicDir, { recursive: true });

  const svgPath = path.join(publicDir, 'icon.svg');
  await fs.writeFile(svgPath, svgContent);

  const buffer = Buffer.from(svgContent);

  await sharp(buffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(buffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(buffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Icons generated successfully.');
}

generate().catch(console.error);
