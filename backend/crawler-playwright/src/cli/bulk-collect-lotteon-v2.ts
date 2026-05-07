import { createBrowserBundle } from '../core/browser.js';
import { writeJsonArtifact } from '../core/io.js';

// 검색어를 양주 노이즈 적은 것 위주로 확장
const QUERIES = [
  '위스키',
  '양주',
  '보드카',
  '스카치 위스키',
  '싱글몰트',
  '버번',
  '꼬냑',
  '브랜디',
  '사케',
  '리큐르',
];

interface RawCard {
  query: string;
  productCode: string | null;
  productName: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  priceText: string | null;
  text: string | null;
}

async function collect(query: string): Promise<RawCard[]> {
  const { browser, context, page } = await createBrowserBundle(false);
  try {
    const url = `https://www.lotteon.com/search/search/search.ecn?render=search&platform=pc&q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
    await page.waitForTimeout(2_500);

    for (let i = 0; i < 5; i += 1) {
      await page.evaluate(() => window.scrollBy(0, document.documentElement.scrollHeight / 5));
      await page.waitForTimeout(700);
    }

    const cards = await page.$$eval('.c-product-card', (nodes) =>
      nodes.map((node) => {
        const root = node as HTMLElement;
        const text = (root.innerText || '').replace(/\s+/g, ' ').trim();
        const link = root.querySelector('a[href]') as HTMLAnchorElement | null;
        const img = root.querySelector('img') as HTMLImageElement | null;
        const href = link?.href ?? null;
        let productCode: string | null = null;
        if (href) {
          const m = href.match(/(LM\d+|LO\d+|[A-Z]{1,3}\d{6,})/);
          if (m) productCode = m[1];
        }
        const nameEl = root.querySelector("[class*='title'], [class*='name'], [class*='goodsName']") as HTMLElement | null;
        const productName = (nameEl?.innerText ?? '').replace(/\s+/g, ' ').trim() || null;
        const priceEl = root.querySelector("[class*='price']") as HTMLElement | null;
        const priceText = (priceEl?.innerText ?? '').replace(/\s+/g, ' ').trim() || null;
        const imageUrl = img?.src ?? null;
        return { productCode, productName, productUrl: href, imageUrl, priceText, text };
      }),
    );
    return cards.map((c) => ({ query, ...c }));
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const all: RawCard[] = [];
  for (const q of QUERIES) {
    console.log(`[bulk v2] query=${q}`);
    const r = await collect(q);
    console.log(`  → ${r.length} cards`);
    all.push(...r);
  }
  const seen = new Set<string>();
  const unique: RawCard[] = [];
  for (const c of all) {
    const k = `${c.productCode ?? ''}|${(c.productName ?? c.text ?? '').slice(0, 60)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(c);
  }
  const path = await writeJsonArtifact(`bulk/lotteon-bulk-v2-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, unique);
  console.log(`\nTOTAL collected=${all.length} unique=${unique.length}`);
  console.log(`saved: ${path}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
