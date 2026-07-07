// Play Store feature graphic (1024x500): SVG zemin + icon çinileri +
// ekran görüntüsünden kırpılan gerçek oyun başlığı.
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'store-assets', 'feature-graphic.png');

const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  <defs>
    <radialGradient id="g" cx="30%" cy="20%" r="110%">
      <stop offset="0%" stop-color="#163257"/>
      <stop offset="100%" stop-color="#0b1f3a"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#g)"/>
  <rect x="14" y="14" width="996" height="472" rx="26" fill="none" stroke="#d4af37" stroke-opacity="0.45" stroke-width="4"/>
  <circle cx="240" cy="250" r="205" fill="none" stroke="#d4af37" stroke-opacity="0.3" stroke-width="4"/>
</svg>`;

// Başlık: 01-gameplay.png üst kısmındaki "MOZAİK / BLOCK PUZZLE" yazısı.
// Koyu zemin pikselleri şeffaflaştırılır, yalnızca parlak yazı kalır.
const raw = await sharp(path.join(root, 'store-assets', '01-gameplay.png'))
  .extract({ left: 200, top: 130, width: 680, height: 210 })
  .resize({ width: 560 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < raw.data.length; i += 4) {
  const r = raw.data[i], g = raw.data[i + 1], b = raw.data[i + 2];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  // koyu lacivert zemin -> şeffaf; kenar yumuşatma için kademeli alfa
  if (lum < 60) raw.data[i + 3] = 0;
  else if (lum < 110) raw.data[i + 3] = Math.round(((lum - 60) / 50) * 255);
}

const title = await sharp(raw.data, {
  raw: { width: raw.info.width, height: raw.info.height, channels: 4 }
}).png().toBuffer();

const tiles = await sharp(path.join(root, 'assets', 'icon-foreground.png'))
  .extract({ left: 192, top: 192, width: 640, height: 640 }) // desenin kendisi
  .resize(330, 330)
  .png().toBuffer();

await sharp(Buffer.from(bgSvg))
  .composite([
    { input: tiles, left: 75, top: 85 },
    { input: title, left: 420, top: 165 },
  ])
  .png()
  .toFile(out);

console.log('OK', out);
