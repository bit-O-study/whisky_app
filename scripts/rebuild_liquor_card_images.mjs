#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const requireFromFrontend = createRequire(join(ROOT, 'frontend', 'package.json'));
const sharp = requireFromFrontend('sharp');

const FRONTEND_ENV_PATH = join(ROOT, 'frontend', '.env.local');
const DEFAULT_BUCKET = 'whisky-images';
const DEFAULT_PREFIX = 'liquor-search-reference-final';
const SERVER_UA = 'bitO-liquor-server-job/1.0';
const BROWSER_UA = 'Mozilla/5.0';

const REFERENCE_OVERRIDES = {
  863: {
    referencePage: 'https://www.johnniewalker.com/en-us/our-whisky/core-range/johnnie-walker-blue-label',
    referenceImage: 'https://images.ctfassets.net/waruwpig3jxu/1mDb1GoHH0RwOoLZeeRyRu/8f84ddb44319f604030c08f02cb1b231/Blue_Label_Front_transparent_bottle.avif?fm=png&w=2000&q=100',
    backgroundSvg: '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#16243b"/><stop offset="45%" stop-color="#0f1118"/><stop offset="100%" stop-color="#3a2616"/></linearGradient><radialGradient id="r" cx="18%" cy="18%" r="55%"><stop offset="0%" stop-color="#f6cf89" stop-opacity="0.95"/><stop offset="100%" stop-color="#f6cf89" stop-opacity="0"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#g)"/><rect width="1024" height="1024" fill="url(#r)"/><rect y="820" width="1024" height="204" fill="#1a1512" fill-opacity="0.65"/></svg>',
    scale: 0.72,
    filename: 'johnnie-walker-blue-label.jpg',
  },
  866: {
    referencePage: 'https://www.glenfiddich.com/en-us/12-year-old/',
    referenceImage: 'https://www.glenfiddich.com/sites/default/files/2022-05/GLEN_12YO-min_2.png',
    backgroundSvg: '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ebe7de"/><stop offset="55%" stop-color="#d9d9d0"/><stop offset="100%" stop-color="#806542"/></linearGradient><radialGradient id="r" cx="70%" cy="18%" r="55%"><stop offset="0%" stop-color="#f4df9d" stop-opacity="0.72"/><stop offset="100%" stop-color="#f4df9d" stop-opacity="0"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#g)"/><rect width="1024" height="1024" fill="url(#r)"/><rect y="820" width="1024" height="204" fill="#e9dfc8" fill-opacity="0.55"/></svg>',
    scale: 0.78,
    filename: 'glenfiddich-12.jpg',
  },
  873: {
    referencePage: 'https://www.royalsalute.com/en-us/whisky/21-year-old-the-signature-blend/',
    referenceImage: 'https://ik.imagekit.io/cvygf2xse/royalsalute//wp-content/uploads/2020/12/01RS21SIGBOTTLEFRONThiRes.png?tr=q-80%2Cw-1000',
    backgroundSvg: '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"></svg>',
    scale: 0.60,
    filename: 'royal-salute-21.jpg',
  },
  870: {
    referencePage: 'https://www.lotteon.com/p/product/LM5000281005409',
    referenceImage: 'https://contents.lotteon.com/itemimage/20260326111139/LM/50/00/28/10/05/40/9_/00/1/LM5000281005409_001_1.jpg',
    backgroundSvg: '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"></svg>',
    crop: { left: 0, top: 0, width: 360, height: 500 },
    scale: 0.74,
    filename: 'lagavulin-16.jpg',
  },
  872: {
    referencePage: 'https://sunsetliquorstore.com/products/chivas-regal-12-year-scotch-whisky-750ml',
    referenceImage: 'https://sunsetliquorstore.com/cdn/shop/files/chivas-regal-12-year-scotch-whisky_1024x1024.png?v=1767765981',
    backgroundSvg: '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"></svg>',
    scale: 0.74,
    filename: 'chivas-regal-12.jpg',
  },
  864: {
    referencePage: 'https://www.johnniewalker.com/en/our-whisky/core-range/johnnie-walker-black-ruby',
    referenceImage: 'https://sitem.ssgcdn.com/23/25/90/item/1000675902523_i1_232.jpg',
    backgroundSvg: '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"></svg>',
    scale: 0.72,
    filename: 'johnnie-walker-black-ruby.jpg',
  },
};

const SLUG_MAP = [
  ['조니워커 블루라벨', 'johnnie-walker-blue-label'],
  ['조니워커 블랙 루비', 'johnnie-walker-black-ruby'],
  ['조니워커 블론드', 'johnnie-walker-blonde'],
  ['글렌피딕12년', 'glenfiddich-12'],
  ['글렌리벳12년', 'the-glenlivet-12'],
  ['글렌드로낙 12년', 'glendronach-12'],
  ['더 글렌드로낙 12년', 'glendronach-12'],
  ['아드벡 10년', 'ardbeg-10'],
  ['라가불린 16년', 'lagavulin-16'],
  ['산토리 가쿠빈', 'suntory-kakubin'],
  ['시바스리갈 12년', 'chivas-regal-12'],
  ['로얄살루트 21년', 'royal-salute-21'],
  ['짐빔화이트', 'jim-beam-white'],
  ['버팔로트레이스', 'buffalo-trace'],
  ['제임슨 스탠다드', 'jameson-standard'],
  ['벨즈 블렌디드 스카치 위스키', 'bells-blended-scotch-whisky'],
];

function parseArgs(argv) {
  const options = { apply: false, all: false, ids: [], limit: 0, bucket: DEFAULT_BUCKET, prefix: DEFAULT_PREFIX, outputDir: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--apply') options.apply = true;
    else if (token === '--all') options.all = true;
    else if (token === '--limit') options.limit = Number(argv[++i] ?? 0);
    else if (token === '--ids') options.ids = String(argv[++i] ?? '').split(',').map((v) => Number(v.trim())).filter((v) => Number.isInteger(v) && v > 0);
    else if (token === '--bucket') options.bucket = String(argv[++i] ?? DEFAULT_BUCKET).trim() || DEFAULT_BUCKET;
    else if (token === '--prefix') options.prefix = String(argv[++i] ?? DEFAULT_PREFIX).trim() || DEFAULT_PREFIX;
    else if (token === '--output-dir') options.outputDir = String(argv[++i] ?? '').trim();
    else if (token === '--help' || token === '-h') {
      console.log('Usage: node scripts/rebuild_liquor_card_images.mjs --all --apply');
      process.exit(0);
    } else throw new Error(`알 수 없는 인자: ${token}`);
  }
  if (!options.all && options.limit <= 0 && options.ids.length === 0) throw new Error('--all, --limit, --ids 중 하나는 필요합니다.');
  return options;
}

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

async function loadConfig() {
  const env = parseEnv(await readFile(FRONTEND_ENV_PATH, 'utf8'));
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('frontend/.env.local 에 필요한 Supabase 값이 없습니다.');
  return { supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY };
}

function makeHeaders(serviceRoleKey, extra = {}, ua = SERVER_UA) {
  return { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'User-Agent': ua, ...extra };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function fetchLiquors(config, options) {
  const params = new URLSearchParams();
  params.set('select', 'id,product_name,brand,product_url,product_code,image_url');
  params.set('order', 'id.asc');
  if (options.ids.length > 0) params.set('id', `in.(${options.ids.join(',')})`);
  if (options.limit > 0) params.set('limit', String(options.limit));
  return fetchJson(`${config.supabaseUrl}/rest/v1/liquor?${params.toString()}`, { headers: makeHeaders(config.serviceRoleKey) });
}

function mappedSlug(name) {
  const normalized = name.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  return SLUG_MAP.find(([keyword]) => normalized.includes(keyword))?.[1]
    ?? normalized.toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildFileName(liquor, slugCounts, sequenceMap) {
  const override = REFERENCE_OVERRIDES[liquor.id];
  if (override?.filename) return override.filename;
  const slug = mappedSlug(liquor.product_name);
  const total = slugCounts.get(slug) ?? 1;
  if (total === 1) return `${slug}.jpg`;
  const nextSequence = (sequenceMap.get(slug) ?? 0) + 1;
  sequenceMap.set(slug, nextSequence);
  return `${slug}-${nextSequence}.jpg`;
}

function buildSsgImageUrl(productCode) {
  const code = String(productCode ?? '').trim();
  if (!/^\d+$/.test(code) || code.length < 6) return null;
  const tail = code.slice(-6);
  return `https://sitem.ssgcdn.com/${tail.slice(4, 6)}/${tail.slice(2, 4)}/${tail.slice(0, 2)}/item/${code}_i1_232.jpg`;
}

async function resolveSource(liquor) {
  const override = REFERENCE_OVERRIDES[liquor.id];
  if (override) {
    return { sourceImageUrl: override.referenceImage, referencePage: override.referencePage, sourceType: 'official', override };
  }
  if (liquor.product_url?.includes('lotteon.com')) {
    const response = await fetch(liquor.product_url, { headers: { 'User-Agent': BROWSER_UA } });
    const html = await response.text();
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
    if (match?.[1]) return { sourceImageUrl: match[1], referencePage: liquor.product_url, sourceType: 'lotteon' };
  }
  const ssgImageUrl = buildSsgImageUrl(liquor.product_code);
  if (ssgImageUrl) return { sourceImageUrl: ssgImageUrl, referencePage: liquor.product_url, sourceType: 'ssg' };
  throw new Error(`원본 상품 이미지 URL을 찾지 못했습니다. liquor id=${liquor.id}`);
}

async function fetchBuffer(url, ua = BROWSER_UA) {
  const response = await fetch(url, { headers: { 'User-Agent': ua, Accept: '*/*' } });
  if (!response.ok) throw new Error(`fetch failed: HTTP ${response.status} ${response.statusText} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function removeUniformBackground(buffer, threshold = 34) {
  const { data, info } = await sharp(buffer, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const patch = Math.max(6, Math.min(24, Math.floor(Math.min(info.width, info.height) * 0.08)));
  const corners = [
    [0, 0],
    [Math.max(0, info.width - patch), 0],
    [0, Math.max(0, info.height - patch)],
    [Math.max(0, info.width - patch), Math.max(0, info.height - patch)],
  ];
  const samples = corners.map(([sx, sy]) => {
    let r = 0; let g = 0; let b = 0; let count = 0;
    for (let y = sy; y < sy + patch && y < info.height; y += 1) {
      for (let x = sx; x < sx + patch && x < info.width; x += 1) {
        const base = (y * info.width + x) * info.channels;
        r += data[base];
        g += data[base + 1];
        b += data[base + 2];
        count += 1;
      }
    }
    return [r / count, g / count, b / count];
  });

  const softened = Buffer.from(data);
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const base = (y * info.width + x) * info.channels;
      const pixel = [data[base], data[base + 1], data[base + 2]];
      const distance = Math.min(...samples.map((sample) => Math.sqrt(
        (pixel[0] - sample[0]) ** 2 +
        (pixel[1] - sample[1]) ** 2 +
        (pixel[2] - sample[2]) ** 2
      )));
      if (distance < threshold) {
        softened[base + 3] = 0;
      } else if (distance < threshold + 18) {
        softened[base + 3] = Math.round(((distance - threshold) / 18) * 255);
      }
    }
  }

  return sharp(softened, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
}


function buildUnifiedBackgroundSvg() {
  return Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="58%" cy="18%" r="50%">
          <stop offset="0%" stop-color="#f6f6f2" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="#f6f6f2" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e9e5de" stop-opacity="0"/>
          <stop offset="45%" stop-color="#e9e5de" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#ded9cf" stop-opacity="0.22"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="#ffffff"/>
      <rect width="1024" height="1024" fill="url(#glow)"/>
      <rect y="770" width="1024" height="254" fill="url(#floorFade)"/>
      <rect width="1024" height="1024" fill="#ffffff" fill-opacity="0.02"/>
    </svg>
  `);
}

async function normalizeForeground(buffer, width = 720, height = 840) {
  return sharp(buffer, { failOn: 'none' })
    .trim()
    .resize({ width, height, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
}

async function alphaBounds(buffer) {
  const { data, info } = await sharp(buffer, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const threshold = 8;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + info.channels - 1];
      if (alpha > threshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return { left: 0, top: 0, width: info.width, height: info.height };
  const padX = Math.round((maxX - minX + 1) * 0.06);
  const padY = Math.round((maxY - minY + 1) * 0.04);
  return {
    left: Math.max(0, minX - padX),
    top: Math.max(0, minY - padY),
    width: Math.min(info.width - Math.max(0, minX - padX), maxX - minX + 1 + padX * 2),
    height: Math.min(info.height - Math.max(0, minY - padY), maxY - minY + 1 + padY * 2),
  };
}

function lotteonCrop(metadata) {
  const width = metadata.width ?? 500;
  const height = metadata.height ?? 500;
  return {
    left: 0,
    top: 0,
    width: Math.max(1, Math.min(width, Math.round(width * 0.72))),
    height,
  };
}

async function createCardImage(sourceBuffer, sourceType, override) {
  let foregroundBuffer;
  let backgroundBuffer;

  if (sourceType === 'official' && override?.backgroundSvg) {
    const preparedBuffer = override.crop ? await sharp(sourceBuffer, { failOn: 'none' }).extract(override.crop).toBuffer() : sourceBuffer;
    const bounds = await alphaBounds(preparedBuffer);
    const scale = override.scale ?? 0.78;
    const isolated = await removeUniformBackground(preparedBuffer, 22);
    const effectiveBuffer = override.filename?.endsWith('-fixed.jpg') ? isolated : preparedBuffer;
    const effectiveBounds = override.filename?.endsWith('-fixed.jpg') ? await alphaBounds(isolated) : bounds;
    foregroundBuffer = await sharp(effectiveBuffer, { failOn: 'none' })
      .extract(effectiveBounds)
      .resize({ width: Math.round(1024 * scale), height: Math.round(1024 * scale), fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    backgroundBuffer = await sharp(buildUnifiedBackgroundSvg()).png().toBuffer();
  } else if (sourceType === 'ssg') {
    const isolated = await removeUniformBackground(sourceBuffer, 30);
    foregroundBuffer = await normalizeForeground(isolated, 700, 840);
    backgroundBuffer = await sharp(buildUnifiedBackgroundSvg()).png().toBuffer();
  } else {
    const metadata = await sharp(sourceBuffer, { failOn: 'none' }).metadata();
    const crop = lotteonCrop(metadata);
    const cropped = await sharp(sourceBuffer, { failOn: 'none' }).extract(crop).toBuffer();
    const isolated = await removeUniformBackground(cropped, 32);
    foregroundBuffer = await normalizeForeground(isolated, 700, 840);
    backgroundBuffer = await sharp(buildUnifiedBackgroundSvg()).png().toBuffer();
  }

  const foregroundMeta = await sharp(foregroundBuffer).metadata();
  const width = foregroundMeta.width ?? 700;
  const height = foregroundMeta.height ?? 820;
  const left = Math.round((1024 - width) / 2);
  const top = Math.round(888 - height);
  const contactShadow = Buffer.from(`<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><defs><filter id="f"><feGaussianBlur stdDeviation="20"/></filter></defs><ellipse cx="512" cy="872" rx="${Math.round(width * 0.15)}" ry="18" fill="#544b40" fill-opacity="0.05" filter="url(#f)"/></svg>`);

  return sharp(backgroundBuffer)
    .resize(1024, 1024, { fit: 'cover' })
    .composite([
      { input: Buffer.from('<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fffdf9" fill-opacity="0.08"/></svg>'), blend: 'screen' },
      { input: contactShadow, top: 0, left: 0 },
      { input: foregroundBuffer, top, left },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();
}

async function uploadToStorage(config, bucket, objectPath, bytes) {
  const encoded = objectPath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encoded}`, {
    method: 'POST',
    headers: makeHeaders(config.serviceRoleKey, { 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'Cache-Control': 'public, max-age=31536000, immutable' }),
    body: bytes,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`storage upload failed: HTTP ${response.status} ${response.statusText}: ${text}`);
  return `${config.supabaseUrl}/storage/v1/object/public/${bucket}/${encoded}`;
}

async function updateLiquorImageUrl(config, id, publicUrl) {
  return fetchJson(`${config.supabaseUrl}/rest/v1/liquor?id=eq.${id}`, {
    method: 'PATCH',
    headers: makeHeaders(config.serviceRoleKey, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify({ image_url: publicUrl }),
  });
}

async function verifyPublicUrl(publicUrl) {
  const response = await fetch(publicUrl, { headers: { 'User-Agent': SERVER_UA, Accept: 'image/*' } });
  if (!response.ok) throw new Error(`public URL verification failed: HTTP ${response.status}`);
  return { status: response.status, contentType: response.headers.get('content-type') ?? '', byteLength: (await response.arrayBuffer()).byteLength };
}

async function ensureDir(path) {
  if (!existsSync(path)) await mkdir(path, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, '');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = await loadConfig();
  const liquors = await fetchLiquors(config, options);
  const runDir = options.outputDir || join('/tmp', 'liquor-card-rebuild', timestamp());
  const generatedDir = join(runDir, 'generated');
  await ensureDir(generatedDir);

  const slugCounts = new Map();
  for (const liquor of liquors) {
    const slug = mappedSlug(liquor.product_name);
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }
  const sequenceMap = new Map();
  const runLog = { startedAt: new Date().toISOString(), apply: options.apply, bucket: options.bucket, prefix: options.prefix, items: [] };
  console.log(JSON.stringify({ phase: 'start', apply: options.apply, count: liquors.length, runDir }, null, 2));

  for (const liquor of liquors) {
    console.log(JSON.stringify({ phase: 'generate', id: liquor.id, product_name: liquor.product_name }, null, 2));
    const source = await resolveSource(liquor);
    const sourceBuffer = await fetchBuffer(source.sourceImageUrl);
    const cardBuffer = await createCardImage(sourceBuffer, source.sourceType, source.override);
    const fileName = buildFileName(liquor, slugCounts, sequenceMap);
    const localPath = join(generatedDir, fileName);
    await writeFile(localPath, cardBuffer);
    const storagePath = `${options.prefix}/${fileName}`;
    let publicUrl = `${config.supabaseUrl}/storage/v1/object/public/${options.bucket}/${storagePath.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
    let verify = null;
    let updatedRow = null;
    if (options.apply) {
      publicUrl = await uploadToStorage(config, options.bucket, storagePath, cardBuffer);
      verify = await verifyPublicUrl(publicUrl);
      updatedRow = (await updateLiquorImageUrl(config, liquor.id, publicUrl))?.[0] ?? null;
    }
    runLog.items.push({
      id: liquor.id,
      product_name: liquor.product_name,
      source_image_url: source.sourceImageUrl,
      reference_page: source.referencePage,
      source_type: source.sourceType,
      file_name: fileName,
      storage_path: storagePath,
      old_image_url: liquor.image_url,
      new_image_url: publicUrl,
      local_path: localPath,
      verify,
      updated_row: updatedRow,
    });
  }

  const logPath = join(runDir, 'run-log.json');
  await writeFile(logPath, JSON.stringify({ ...runLog, completedAt: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ phase: 'complete', apply: options.apply, count: liquors.length, logPath }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
