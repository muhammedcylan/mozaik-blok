// SVG kaynaklarını @capacitor/assets'in beklediği PNG'lere çevirir.
// Kullanım: node scripts/render-assets.mjs && npx capacitor-assets generate
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const NAVY = { r: 11, g: 31, b: 58, alpha: 1 }; // #0b1f3a

const jobs = [
  { src: 'icon.svg', out: 'icon-only.png', size: 1024 },
  { src: 'icon-foreground.svg', out: 'icon-foreground.png', size: 1024 },
  { src: 'splash.svg', out: 'splash.png', size: 2732 },
  { src: 'splash.svg', out: 'splash-dark.png', size: 2732 },
];

for (const j of jobs) {
  await sharp(path.join(dir, j.src), { density: 300 })
    .resize(j.size, j.size)
    .png()
    .toFile(path.join(dir, j.out));
  console.log('OK', j.out);
}

// Adaptive icon arka planı: düz lacivert
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: NAVY } })
  .png()
  .toFile(path.join(dir, 'icon-background.png'));
console.log('OK icon-background.png');
