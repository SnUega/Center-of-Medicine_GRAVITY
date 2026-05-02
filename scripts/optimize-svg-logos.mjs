/**
 * Конвертация тяжёлых SVG-логотипов (bitmap внутри) в оптимизированные PNG
 * Запуск: node scripts/optimize-svg-logos.mjs
 */
import sharp from 'sharp';
import { stat } from 'fs/promises';
import { join } from 'path';

const IMG_DIR = join(import.meta.dirname, '..', 'img');

const LOGOS = [
  { src: 'clorness-logo.svg', out: 'clorness-logo-opt.png', size: 1200 },
  { src: 'logo.svg',          out: 'logo-opt.png',          size: 1200 },
];

for (const logo of LOGOS) {
  const srcPath = join(IMG_DIR, logo.src);
  const outPath = join(IMG_DIR, logo.out);

  const origStat = await stat(srcPath);
  const origKiB = (origStat.size / 1024).toFixed(0);

  await sharp(srcPath, { density: 72, limitInputPixels: false })
    .resize(logo.size, logo.size, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 85, compressionLevel: 9 })
    .toFile(outPath);

  const newStat = await stat(outPath);
  const newKiB = (newStat.size / 1024).toFixed(0);
  const saved = ((1 - newStat.size / origStat.size) * 100).toFixed(0);
  console.log(`${logo.src}: ${origKiB} KiB → ${newKiB} KiB (−${saved}%)`);
}

console.log('\nГотово. Проверьте img/*-opt.png визуально.');
