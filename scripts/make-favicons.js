const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = 'C:/Users/lenovo/.gemini/antigravity/brain/531473c0-9adb-4998-a737-fbac458743c6/.user_uploaded/media_1792055399911_131c3f6f.png';

async function main() {
  const raw = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const { width, height, channels } = info;

  // Ribbon bounds: minX: 27, maxX: 98 (w: 72), minY: 16, maxY: 144 (h: 129)
  const cropX = 27;
  const cropY = 16;
  const cropW = 72;
  const cropH = 129;

  const bg = 32;
  const ribbonData = Buffer.alloc(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((cropY + y) * width + (cropX + x)) * channels;
      const dstIdx = (y * cropW + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const diff = Math.max(Math.abs(r - bg), Math.abs(g - bg), Math.abs(b - bg));

      if (diff <= 3) {
        ribbonData[dstIdx] = 0;
        ribbonData[dstIdx + 1] = 0;
        ribbonData[dstIdx + 2] = 0;
        ribbonData[dstIdx + 3] = 0;
      } else if (diff < 20) {
        // Edge anti-aliasing: recover original color and alpha
        const alpha = Math.min(1.0, (diff - 3) / 17);
        const unblendR = Math.min(255, Math.max(0, Math.round((r - (1 - alpha) * bg) / alpha)));
        const unblendG = Math.min(255, Math.max(0, Math.round((g - (1 - alpha) * bg) / alpha)));
        const unblendB = Math.min(255, Math.max(0, Math.round((b - (1 - alpha) * bg) / alpha)));

        ribbonData[dstIdx] = unblendR;
        ribbonData[dstIdx + 1] = unblendG;
        ribbonData[dstIdx + 2] = unblendB;
        ribbonData[dstIdx + 3] = Math.round(alpha * 255);
      } else {
        ribbonData[dstIdx] = r;
        ribbonData[dstIdx + 1] = g;
        ribbonData[dstIdx + 2] = b;
        ribbonData[dstIdx + 3] = 255;
      }
    }
  }

  const ribbonPngBuffer = await sharp(ribbonData, {
    raw: { width: cropW, height: cropH, channels: 4 }
  }).png().toBuffer();

  // Create 512x512 transparent
  const targetH = 430;
  const targetW = Math.round((cropW / cropH) * targetH); // ~240px

  const resizedRibbon = await sharp(ribbonPngBuffer)
    .resize(targetW, targetH, { fit: 'fill' })
    .toBuffer();

  const leftOffset = Math.round((512 - targetW) / 2);
  const topOffset = Math.round((512 - targetH) / 2);

  const transparent512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: resizedRibbon, left: leftOffset, top: topOffset }])
  .png()
  .toBuffer();

  // Save full logo transparent asset as well (entire HIPZONE AUTOMATION logo)
  // Let's also extract entire logo (ribbon + text) on transparent background!
  const fullLogoData = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      const dstIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const diff = Math.max(Math.abs(r - bg), Math.abs(g - bg), Math.abs(b - bg));
      if (diff <= 3) {
        fullLogoData[dstIdx] = 0;
        fullLogoData[dstIdx + 1] = 0;
        fullLogoData[dstIdx + 2] = 0;
        fullLogoData[dstIdx + 3] = 0;
      } else if (diff < 20) {
        const alpha = Math.min(1.0, (diff - 3) / 17);
        fullLogoData[dstIdx] = Math.min(255, Math.max(0, Math.round((r - (1 - alpha) * bg) / alpha)));
        fullLogoData[dstIdx + 1] = Math.min(255, Math.max(0, Math.round((g - (1 - alpha) * bg) / alpha)));
        fullLogoData[dstIdx + 2] = Math.min(255, Math.max(0, Math.round((b - (1 - alpha) * bg) / alpha)));
        fullLogoData[dstIdx + 3] = Math.round(alpha * 255);
      } else {
        fullLogoData[dstIdx] = r;
        fullLogoData[dstIdx + 1] = g;
        fullLogoData[dstIdx + 2] = b;
        fullLogoData[dstIdx + 3] = 255;
      }
    }
  }

  await sharp(fullLogoData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/hipzone-logo.png');
  console.log('Saved public/hipzone-logo.png');

  // Also create squircle 512
  const squircleSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="512" height="512" rx="100" fill="#1b1c20"/>
    <rect x="2" y="2" width="508" height="508" rx="98" fill="none" stroke="#2c3038" stroke-width="4"/>
  </svg>`;

  const squircle512 = await sharp(Buffer.from(squircleSvg))
    .composite([{ input: resizedRibbon, left: leftOffset, top: topOffset }])
    .png()
    .toBuffer();

  await sharp(transparent512).toFile('public/icon-transparent-512.png');
  await sharp(squircle512).toFile('public/icon-squircle-512.png');

  // Next.js standard files:
  // 1. app/icon.png (512x512) and public/icon.png
  await sharp(squircle512).toFile('app/icon.png');
  await sharp(squircle512).toFile('public/icon.png');

  // 2. app/apple-icon.png (180x180)
  await sharp(squircle512)
    .resize(180, 180)
    .toFile('app/apple-icon.png');
  await sharp(squircle512)
    .resize(180, 180)
    .toFile('public/apple-icon.png');

  // 3. Multi-resolution ICO generator (16x16, 32x32, 48x48)
  const sizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of sizes) {
    const buf = await sharp(squircle512).resize(s, s).png().toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  // Create standard ICO format
  // Header: 6 bytes (0, 0, 1, 0, count_low, count_high)
  const numImages = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);

  // Directory entries: 16 bytes per image
  const dirEntries = Buffer.alloc(numImages * 16);
  let currentOffset = 6 + numImages * 16;

  for (let i = 0; i < numImages; i++) {
    const img = pngBuffers[i];
    const offset = i * 16;
    dirEntries.writeUInt8(img.size, offset + 0); // width
    dirEntries.writeUInt8(img.size, offset + 1); // height
    dirEntries.writeUInt8(0, offset + 2);        // colors
    dirEntries.writeUInt8(0, offset + 3);        // reserved
    dirEntries.writeUInt16LE(1, offset + 4);     // planes
    dirEntries.writeUInt16LE(32, offset + 6);    // bpp
    dirEntries.writeUInt32LE(img.buffer.length, offset + 8); // size
    dirEntries.writeUInt32LE(currentOffset, offset + 12);     // offset

    currentOffset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    dirEntries,
    ...pngBuffers.map(p => p.buffer)
  ]);

  fs.writeFileSync('app/favicon.ico', icoBuffer);
  fs.writeFileSync('public/favicon.ico', icoBuffer);
  console.log('Saved app/favicon.ico and public/favicon.ico successfully!');
}

main().catch(console.error);
