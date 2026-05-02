/**
 * Оптимизация изображений: ресайз + WebP + сжатие JPG/PNG
 * Запуск: node scripts/optimize-images.mjs
 * 
 * Не затрагивает оригиналы — кладёт оптимизированные рядом
 * или перезаписывает если указать --overwrite.
 */
import sharp from 'sharp';
import { readdir, stat, mkdir, rename, unlink } from 'fs/promises';
import { join, parse } from 'path';

const IMG_DIR = join(import.meta.dirname, '..', 'img');
const OVERWRITE = process.argv.includes('--overwrite');

const RULES = [
  { file: 'logo.PNG',            maxSize: 1120, quality: 82 },
  { file: 'clorness-logo.PNG',   maxSize: 560,  quality: 82 },
  { file: 'full-logo.PNG',       maxSize: 1120, quality: 80 },
  { file: 'logo-word.PNG',       maxSize: 1120, quality: 85 },
  { file: 'word.PNG',            maxSize: 1120, quality: 80 },
  { file: 'injections-card.JPG', maxSize: 1200, quality: 78 },
  { file: 'cosmetology-card.JPG',maxSize: 1200, quality: 78 },
  { file: 'massage-card.JPG',    maxSize: 1200, quality: 78 },
  { file: 'bg-logo-pattern.JPG', maxSize: 1600, quality: 72 },
  { file: 'rocketship.JPG',      maxSize: 1120, quality: 78 },
  // OG-картинка — стандарт 1200x630, оригинал 6046x3023
  { file: 'OG/og-img.PNG',       maxSize: 1200, quality: 85 },
  // face-look — используется в секциях, 832x1248
  { file: 'face-look.PNG',       maxSize: 1248, quality: 80 },
  // gallery-placeholder — 1536x1024
  { file: 'gallery-placeholder.PNG', maxSize: 1200, quality: 78 },
  // иконка «Dev & Designed by T.A.D.A.» в футере (28px, 2x = 56)
  { file: 'TADA.PNG', maxSize: 56, quality: 85 },
];

async function optimizeImage(rule) {
  const srcPath = join(IMG_DIR, rule.file);
  const { dir, name, ext } = parse(rule.file);
  const outDir = dir ? join(IMG_DIR, dir) : IMG_DIR;

  try {
    await stat(srcPath);
  } catch {
    console.log(`⏭  ${rule.file} — не найден, пропуск`);
    return;
  }

  await mkdir(outDir, { recursive: true });

  const origStat = await stat(srcPath);
  const origKiB = (origStat.size / 1024).toFixed(0);

  const meta = await sharp(srcPath).metadata();
  const needsResize = meta.width > rule.maxSize || meta.height > rule.maxSize;

  let pipeline = sharp(srcPath);
  if (needsResize) {
    pipeline = pipeline.resize(rule.maxSize, rule.maxSize, { fit: 'inside', withoutEnlargement: true });
  }

  const isJpg = ext.toLowerCase() === '.jpg' || ext.toLowerCase() === '.jpeg';
  const isPng = ext.toLowerCase() === '.png';

  const tmpPath = join(outDir, `${name}-tmp${ext}`);
  const outPath = OVERWRITE ? srcPath : join(outDir, `${name}-opt${ext}`);

  if (isJpg) {
    await pipeline.jpeg({ quality: rule.quality, mozjpeg: true }).toFile(tmpPath);
  } else if (isPng) {
    await pipeline.png({ quality: rule.quality, compressionLevel: 9 }).toFile(tmpPath);
  }

  if (OVERWRITE) {
    await unlink(srcPath);
    await rename(tmpPath, srcPath);
  } else {
    await rename(tmpPath, outPath);
  }

  const newStat = await stat(outPath);
  const newKiB = (newStat.size / 1024).toFixed(0);
  const saved = ((1 - newStat.size / origStat.size) * 100).toFixed(0);

  console.log(`✅ ${rule.file}: ${origKiB} KiB → ${newKiB} KiB (−${saved}%) ${needsResize ? `[resized to ≤${rule.maxSize}px]` : '[compressed only]'}`);

  const webpPath = OVERWRITE
    ? join(outDir, `${name}.webp`)
    : join(outDir, `${name}-opt.webp`);

  await sharp(outPath).webp({ quality: rule.quality }).toFile(webpPath);

  const webpStat = await stat(webpPath);
  const webpKiB = (webpStat.size / 1024).toFixed(0);
  const webpSaved = ((1 - webpStat.size / origStat.size) * 100).toFixed(0);

  console.log(`   ↳ WebP: ${webpKiB} KiB (−${webpSaved}%)`);
}

console.log(`\n🖼  Оптимизация изображений (${OVERWRITE ? 'перезапись' : 'рядом с оригиналом'})\n`);

for (const rule of RULES) {
  await optimizeImage(rule);
  console.log('');
}

console.log('Готово. Проверьте результат и при необходимости запустите с --overwrite.\n');
