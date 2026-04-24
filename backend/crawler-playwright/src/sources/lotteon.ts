import type { Page } from 'playwright';

const SEARCH_URL_TEMPLATE = 'https://www.lotteon.com/search/search/search.ecn?render=search&platform=pc&q=%s';
const SOURCE = 'LOTTEON';
const MIN_MATCH_SCORE = 30;
const MAX_ITEMS_PER_KEYWORD = 20;
const SCRIPT_ITEM_PATTERN = /data-item="\{([^}]+)\}"/;
const DOM_SELECTORS = [
  '.c-product-card',
  '.c-product-list__item',
  'li[data-index]',
  '.srchProductItem',
  "[class*='productItem']",
  '.product-list li',
  "[class*='prd-item']",
];

export interface LotteonCandidate {
  productCode: string;
  name: string;
  brand: string;
  category: string;
  clazz: string;
  volumeMl: number;
  alcoholPercent: number;
  currentPrice: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  source: typeof SOURCE;
  score: number;
}

export interface LotteonKeywordResult {
  keyword: string;
  searchUrl: string;
  collectedAt: string;
  strategy: 'script' | 'dom' | 'none';
  candidateCount: number;
  bestScore: number | null;
  bestMatch: LotteonCandidate | null;
  debugHtmlSaved: boolean;
}

export async function crawlLotteonKeyword(page: Page, keyword: string): Promise<{ result: LotteonKeywordResult; html: string }> {
  const searchUrl = buildSearchUrl(keyword);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 7_000 }).catch(() => undefined);
  await page.waitForTimeout(1_500);

  const html = await page.content();
  const scriptCandidate = parseFirstFromScript(html);
  const scoredScriptCandidate = scriptCandidate
    ? { ...scriptCandidate, score: calculateMatchScore(keyword, scriptCandidate.name) }
    : null;

  if (scoredScriptCandidate && scoredScriptCandidate.score >= MIN_MATCH_SCORE) {
    return {
      html,
      result: {
        keyword,
        searchUrl,
        collectedAt: new Date().toISOString(),
        strategy: 'script',
        candidateCount: 1,
        bestScore: scoredScriptCandidate.score,
        bestMatch: scoredScriptCandidate,
        debugHtmlSaved: false,
      },
    };
  }

  const domCandidates = await parseCandidatesFromDom(page);
  const scoredDomCandidates = domCandidates
    .slice(0, MAX_ITEMS_PER_KEYWORD)
    .map((candidate) => ({ ...candidate, score: calculateMatchScore(keyword, candidate.name) }))
    .sort((left, right) => right.score - left.score);

  const bestMatch = scoredDomCandidates.find((candidate) => candidate.score >= MIN_MATCH_SCORE) ?? null;

  return {
    html,
    result: {
      keyword,
      searchUrl,
      collectedAt: new Date().toISOString(),
      strategy: bestMatch ? 'dom' : 'none',
      candidateCount: scoredDomCandidates.length,
      bestScore: bestMatch?.score ?? null,
      bestMatch,
      debugHtmlSaved: bestMatch === null,
    },
  };
}

function buildSearchUrl(keyword: string): string {
  return SEARCH_URL_TEMPLATE.replace('%s', encodeURIComponent(keyword));
}

function parseFirstFromScript(pageSource: string): LotteonCandidate | null {
  const match = pageSource.match(SCRIPT_ITEM_PATTERN);
  if (!match) {
    return null;
  }

  try {
    let jsonString = `{${match[1]}}`;
    jsonString = jsonString
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    const item = JSON.parse(jsonString) as {
      item_name?: string;
      item_id?: string;
      price?: number;
      discount?: number;
    };

    const itemName = item.item_name?.trim() ?? '';
    if (!itemName) {
      return null;
    }

    const price = item.price ?? 0;
    const discount = item.discount ?? 0;
    const originalPrice = discount > 0 ? price + discount : price;
    return buildCandidate({
      name: itemName,
      currentPrice: price,
      originalPrice,
      productCode: item.item_id ? `LOTTEON_${item.item_id}` : createFallbackProductCode(itemName),
      productUrl: '',
      imageUrl: '',
    });
  } catch {
    return null;
  }
}

async function parseCandidatesFromDom(page: Page): Promise<LotteonCandidate[]> {
  for (const selector of DOM_SELECTORS) {
    const count = await page.locator(selector).count();
    if (count === 0) {
      continue;
    }

    const rawCards = await page.locator(selector).evaluateAll((elements, maxItems) => {
      const limit = Math.min(elements.length, maxItems as number);
      return elements.slice(0, limit).map((element) => {
        const pickText = (...selectors: string[]) => {
          for (const selector of selectors) {
            const target = element.querySelector(selector);
            const text = target?.textContent?.trim();
            if (text) {
              return text;
            }
          }
          return '';
        };

        const name = pickText('.c-product-title__title', "[class*='name']", "[class*='title']", '.prd-name');
        const finalPriceText = pickText('.c-product-price__final', "[class*='price__final']", "[class*='price']", '.prd-price');
        const image = element.querySelector('img');
        const link = element.querySelector('a');

        return {
          name,
          priceText: finalPriceText,
          imageUrl: image?.getAttribute('src') || image?.getAttribute('data-src') || '',
          productUrl: link?.getAttribute('href') || '',
        };
      });
    }, MAX_ITEMS_PER_KEYWORD);

    return rawCards
      .map((card) => {
        if (!card.name) {
          return null;
        }

        const href = normalizeUrl(card.productUrl);
        const productCode = extractProductCode(href, card.name);
        const currentPrice = parsePriceDigits(card.priceText);

        return buildCandidate({
          name: card.name,
          currentPrice,
          originalPrice: currentPrice,
          imageUrl: card.imageUrl,
          productUrl: href,
          productCode,
        });
      })
      .filter((candidate): candidate is LotteonCandidate => candidate !== null);
  }

  return [];
}

function buildCandidate(input: {
  name: string;
  currentPrice: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  productCode: string;
}): LotteonCandidate {
  const details = extractDetailsFromName(input.name);
  return {
    productCode: input.productCode,
    name: input.name,
    brand: details.brand,
    category: details.category,
    clazz: details.clazz,
    volumeMl: details.volumeMl,
    alcoholPercent: details.alcoholPercent,
    currentPrice: input.currentPrice,
    originalPrice: Math.max(input.originalPrice, input.currentPrice),
    imageUrl: input.imageUrl,
    productUrl: input.productUrl,
    source: SOURCE,
    score: 0,
  };
}

function extractDetailsFromName(name: string): {
  brand: string;
  category: string;
  clazz: string;
  volumeMl: number;
  alcoholPercent: number;
} {
  const brandCandidates = [
    '조니워커', '발렌타인', '글렌피딕', '글렌리벳', '맥캘란', '잭다니엘', '짐빔', '와일드터키',
    '메이커스마크', '시바스리갈', '로얄살루트', '윈저', '산토리', '그란츠', '발베니', '글렌드로낙',
    '아드벡', '라가불린', '버팔로트레이스', '제임슨', '벨즈', 'Johnnie Walker', 'Ballantine',
    'Glenfiddich', 'Glenlivet', 'Macallan', 'Jack Daniel', 'Jim Beam', 'Wild Turkey', "Maker's Mark",
    'Chivas Regal', '조니 워커', '잭 다니엘', '글렌 피딕', '짐 빔', '와일드 터키', '시바스 리갈',
    '로얄 살루트', '버팔로 트레이스'
  ];

  const brand = brandCandidates.find((candidate) => name.toLowerCase().includes(candidate.toLowerCase()))
    ?? name.replace(/\[.*?\]/g, '').trim().split(/\s+/)[0]
    ?? '기타';

  const volumeMatch = name.match(/(\d+)\s*(ml|ML|L|l|리터)/i);
  let volumeMl = 700;
  if (volumeMatch) {
    volumeMl = Number.parseInt(volumeMatch[1], 10);
    const unit = volumeMatch[2].toLowerCase();
    if (unit === 'l' || unit === '리터') {
      volumeMl *= 1000;
    }
  }

  const alcoholMatch = name.match(/(\d+(?:\.\d+)?)\s*(%|도|프루프)/);
  let alcoholPercent = 40;
  if (alcoholMatch) {
    alcoholPercent = Number.parseFloat(alcoholMatch[1]);
    if (alcoholMatch[2] === '프루프') {
      alcoholPercent = alcoholPercent / 2;
    }
  }

  const lowerName = name.toLowerCase();
  let category = 'Whisky';
  if (lowerName.includes('브랜디') || lowerName.includes('brandy') || lowerName.includes('코냑')) {
    category = 'Brandy';
  } else if (lowerName.includes('보드카') || lowerName.includes('vodka')) {
    category = 'Vodka';
  } else if (lowerName.includes('럼') || lowerName.includes('rum')) {
    category = 'Rum';
  } else if (lowerName.includes('진') || lowerName.includes('gin')) {
    category = 'Gin';
  } else if (lowerName.includes('테킬라') || lowerName.includes('tequila')) {
    category = 'Tequila';
  }

  let clazz = name;
  clazz = clazz.replace(brand, '').trim();
  clazz = clazz.replace(/\([^)]*\)/g, ' ').trim();
  clazz = clazz.replace(/\d+\s*(ml|ML|mL|L|l|리터)/g, '').trim();
  clazz = clazz.replace(/\s+/g, ' ').trim() || 'None';

  return { brand, category, clazz, volumeMl, alcoholPercent };
}

function calculateMatchScore(keyword: string, name: string): number {
  const normalizedKeyword = normalizeForMatch(keyword);
  const normalizedName = normalizeForMatch(name);
  let score = 0;

  if (normalizedName.includes(normalizedKeyword)) {
    score += 100;
  }

  for (const token of keyword.split(/\s+/)) {
    const normalizedToken = normalizeForMatch(token);
    if (normalizedToken.length < 2) {
      continue;
    }
    if (normalizedName.includes(normalizedToken)) {
      score += 18;
    } else {
      score -= 6;
    }
  }

  if (containsLiquorHint(name)) {
    score += 25;
  }
  if (containsAccessoryHint(name)) {
    score -= 80;
  }

  return score;
}

function containsLiquorHint(name: string): boolean {
  const lower = name.toLowerCase();
  return ['위스키', 'whisky', 'whiskey', '버번', '스카치', 'single malt', '싱글몰트']
    .some((hint) => lower.includes(hint));
}

function containsAccessoryHint(name: string): boolean {
  const lower = name.toLowerCase();
  return ['잔', '글라스', '머그', '컵', '치약', '원피스', '팬츠', '스푼'].some((hint) => lower.includes(hint));
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, '')
    .replace('더블우드', '더블 우드')
    .replace('더블캐스크', '더블 캐스크')
    .replace('트리플우드', '트리플 우드')
    .replace('블랙라벨', '블랙 라벨')
    .replace('골드라벨', '골드 라벨')
    .replace('화이트라벨', '화이트 라벨')
    .replace('버팔로트레이스', '버팔로 트레이스')
    .replace('와일드터키', '와일드 터키')
    .replace('조니워커', '조니 워커')
    .replace('시바스리갈', '시바스 리갈')
    .replace('로얄살루트', '로얄 살루트')
    .replace('짐빔', '짐 빔')
    .replace('맥켈란', '맥캘란')
    .replace(/[^0-9a-z가-힣]/g, '');
}

function parsePriceDigits(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

function normalizeUrl(url: string): string {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  if (url.startsWith('/')) {
    return `https://www.lotteon.com${url}`;
  }
  return url;
}

function extractProductCode(href: string, name: string): string {
  const match = href.match(/\/product\/([A-Za-z0-9]+)/);
  if (match) {
    return `LOTTEON_${match[1]}`;
  }
  return createFallbackProductCode(name);
}

function createFallbackProductCode(name: string): string {
  const normalized = normalizeForMatch(name) || 'unknown';
  return `LOTTEON_NAME_${simpleHash(normalized)}`;
}

function simpleHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}
