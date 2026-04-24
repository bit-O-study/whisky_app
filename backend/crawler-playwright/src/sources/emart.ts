import type { Page } from 'playwright';

const SEARCH_URL_TEMPLATE = 'https://emart.ssg.com/search.ssg?query=%s';
const MIN_MATCH_SCORE = 30;
const MAX_ITEMS_PER_KEYWORD = 20;
const NEXT_DATA_PATTERN = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

const KNOWN_BRANDS = [
  '조니워커', '발렌타인', '글렌피딕', '맥캘란', '짐빔', '산토리', '잭다니엘',
  '와일드터키', '버팔로트레이스', '메이커스마크', '로얄살루트', '시바스리갈',
  '글렌리벳', '발베니', '아드벡', '라프로익', '탈리스커', '싱글톤', '에반윌리엄스',
  '제임슨', '카나디안클럽', '벨즈', '블랙앤화이트', '커티삭', '몽키숄더', '니카',
  '하이랜드파크', '보모어', '라가불린', '오반', '글렌모렌지', '달모어', '히비키', '야마자키',
  '카발란', '글렌그란트', '더글렌그란트', '1865', '몬테스', 'G7', '디아블로', '칸티', '빌라엠',
  '모엣샹동', '돔페리뇽', '뵈브클리코', '투핸즈', '이스까이', '텍스트북', '덕혼', '클라우디베이',
  '펜폴즈', '샤토', '샤또', '울프블라스', '옐로우테일', '코노수르', '앙시앙땅', '트라피체',
  '에라스리즈', '산타리타', '로버트몬다비', '프레스코발디', '피치니', '우마니론끼', '몰리두커',
  '머드하우스', '배비치', '롱반', '서브미션', '브레드앤버터', '간바레오또상', '마루', '준마이',
  '센카', '라쿠엔', '쿠보타', '닷사이', '월계관', '앱솔루트', '스미노프', '그레이구스', '봄베이',
  '핸드릭스', '바카디', '말리부', '깔루아', '베일리스', '엑스레이티드', '예거마이스터', '아그와',
  '호세쿠엘보', '팔리니', '코인트로', '볼스'
];

interface NextDataQuery {
  queryKey?: unknown[];
  state?: {
    data?: {
      areaList?: Array<{
        dataList?: NextDataItem[];
      }>;
    };
  };
}

interface NextDataItem {
  itemId?: string;
  itemName?: string;
  finalPrice?: string;
  strikeOutPrice?: string;
  itemImgUrl?: string;
  itemUrl?: string;
}

export interface EmartCandidate {
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
  score: number;
}

export interface EmartKeywordResult {
  keyword: string;
  searchUrl: string;
  collectedAt: string;
  candidateCount: number;
  bestScore: number | null;
  bestMatch: EmartCandidate | null;
  debugHtmlSaved: boolean;
}

export async function crawlEmartKeyword(page: Page, keyword: string): Promise<{ result: EmartKeywordResult; html: string }> {
  const searchUrl = buildSearchUrl(keyword);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);

  const nextDataText = await page.locator('script#__NEXT_DATA__').first().textContent().catch(() => null);
  const html = await page.content();
  const nextDataCandidates = extractNextDataCandidates(nextDataText ?? html);
  const scored = nextDataCandidates
    .slice(0, MAX_ITEMS_PER_KEYWORD)
    .map((candidate) => ({ ...candidate, score: calculateMatchScore(keyword, candidate) }))
    .sort((left, right) => right.score - left.score);

  const bestMatch = scored.find((candidate) => candidate.score >= MIN_MATCH_SCORE) ?? null;

  return {
    html,
    result: {
      keyword,
      searchUrl,
      collectedAt: new Date().toISOString(),
      candidateCount: scored.length,
      bestScore: bestMatch?.score ?? null,
      bestMatch,
      debugHtmlSaved: bestMatch === null,
    },
  };
}

function buildSearchUrl(keyword: string): string {
  return SEARCH_URL_TEMPLATE.replace('%s', encodeURIComponent(keyword).replace(/\+/g, '%20'));
}

function extractNextDataCandidates(nextDataSource: string): EmartCandidate[] {
  const nextDataJson = parseNextDataJson(nextDataSource);
  if (!nextDataJson) {
    return [];
  }

  const queries = (((nextDataJson as Record<string, unknown>).props as Record<string, unknown> | undefined)?.pageProps as Record<string, unknown> | undefined)?.dehydratedState as Record<string, unknown> | undefined;
  const rawQueries = Array.isArray(queries?.queries) ? (queries?.queries as NextDataQuery[]) : [];
  const rawItems: NextDataItem[] = [];

  for (const query of rawQueries) {
    if (!queryKeyMatches(query.queryKey, 'fetchSearchItemListArea')) {
      continue;
    }

    const areaList = query.state?.data?.areaList;
    if (!Array.isArray(areaList)) {
      continue;
    }

    for (const area of areaList) {
      if (!Array.isArray(area.dataList)) {
        continue;
      }
      for (const item of area.dataList) {
        if (item?.itemId) {
          rawItems.push(item);
        }
      }
    }
  }

  return rawItems.map(mapNextDataItem).filter((candidate): candidate is EmartCandidate => candidate !== null);
}

function parseNextDataJson(nextDataSource: string): unknown | null {
  if (!nextDataSource.trim()) {
    return null;
  }

  const rawJson = nextDataSource.trim().startsWith('{')
    ? nextDataSource
    : nextDataSource.match(NEXT_DATA_PATTERN)?.[1] ?? null;

  if (!rawJson) {
    return null;
  }

  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

function queryKeyMatches(queryKey: unknown[] | undefined, token: string): boolean {
  return Array.isArray(queryKey) && queryKey.some((value) => value === token);
}

function mapNextDataItem(item: NextDataItem): EmartCandidate | null {
  const name = item.itemName?.trim() ?? '';
  if (!name) {
    return null;
  }

  const productCode = item.itemId?.trim() || `EMART_${simpleHash(name)}`;
  const currentPrice = parsePriceDigits(item.finalPrice);
  const originalPrice = Math.max(parsePriceDigits(item.strikeOutPrice), currentPrice);
  const productUrl = item.itemUrl?.trim() || `https://emart.ssg.com/item/itemView.ssg?itemId=${item.itemId ?? ''}`;
  const imageUrl = item.itemImgUrl?.trim() ?? '';
  const category = detectCategory(name);
  const brand = detectBrand(name);
  const alcoholPercent = detectAlcoholPercent(name, category);
  const volumeMl = detectVolumeMl(name, category);
  const clazz = extractClazz(name, category);

  return {
    productCode,
    name,
    brand,
    category,
    clazz,
    volumeMl,
    alcoholPercent,
    currentPrice,
    originalPrice,
    imageUrl,
    productUrl,
    score: 0,
  };
}

function parsePriceDigits(raw: string | undefined): number {
  if (!raw) {
    return 0;
  }
  const digits = raw.replace(/[^0-9]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

function detectCategory(name: string): string {
  const normalized = name.replace(/\s+/g, '');
  if (normalized.includes('[레드와인]') || normalized.includes('[레드]')) return 'Red Wine';
  if (normalized.includes('[화이트와인]') || normalized.includes('[화이트]')) return 'White Wine';
  if (normalized.includes('[스파클링]') || normalized.includes('스파클링와인')) return 'Sparkling Wine';
  if (normalized.includes('[로제와인]') || normalized.includes('로제')) return 'Rose Wine';
  if (normalized.includes('[샴페인]')) return 'Champagne';
  if (normalized.includes('[위스키]')) return 'Whisky';
  if (normalized.includes('[브랜디]') || normalized.includes('[꼬냑]')) return 'Brandy';
  if (normalized.includes('[보드카]')) return 'Vodka';
  if (normalized.includes('[럼]')) return 'Rum';
  if (normalized.includes('[진]')) return 'Gin';
  if (normalized.includes('[데킬라]')) return 'Tequila';
  if (normalized.includes('[리큐르]') || normalized.includes('[리큐어]')) return 'Liqueur';
  if (normalized.includes('[사케]') || normalized.includes('[청주]')) return 'Sake';
  if (normalized.includes('[와인세트]')) return 'Wine Set';
  if (normalized.includes('와인')) return 'Wine';
  return 'Other';
}

function detectBrand(name: string): string {
  for (const brand of KNOWN_BRANDS) {
    if (name.includes(brand)) {
      return brand;
    }
  }

  const cleanName = name.replace(/\[.*?\]/g, '').trim();
  return cleanName.split(/\s+/)[0] || '기타';
}

function detectAlcoholPercent(name: string, category: string): number {
  const abvMatch = name.match(/(\d+(?:\.\d+)?)\s*(%|도)/);
  if (abvMatch) {
    return Number.parseFloat(abvMatch[1]);
  }

  switch (category) {
    case 'Whisky':
    case 'Rum':
    case 'Vodka':
    case 'Gin':
    case 'Tequila':
    case 'Brandy':
      return 40.0;
    case 'Red Wine':
    case 'White Wine':
    case 'Rose Wine':
    case 'Wine':
    case 'Wine Set':
      return 13.5;
    case 'Sparkling Wine':
    case 'Champagne':
      return 12.0;
    case 'Sake':
      return 15.0;
    case 'Liqueur':
      return 20.0;
    default:
      return 0.0;
  }
}

function detectVolumeMl(name: string, category: string): number {
  if (name.toUpperCase().includes('1L') || name.includes('1리터')) {
    return 1000;
  }

  const volumeMatch = name.match(/(\d+)\s*(ml|ML|mL)/);
  if (volumeMatch) {
    return Number.parseInt(volumeMatch[1], 10);
  }

  if (category.includes('Wine') || category === 'Champagne') return 750;
  if (category === 'Sake') return 720;
  if (category === 'Whisky' || category === 'Vodka') return 700;
  return 750;
}

function extractClazz(name: string, category: string): string {
  const upperName = name.toUpperCase();
  const noSpaceName = name.replace(/\s+/g, '');
  const yearMatch = upperName.match(/(\d+)\s*(년|Y\.O|YO|YEARS)/);
  if (yearMatch) {
    return yearMatch[1];
  }

  if (category === 'Whisky') {
    if (noSpaceName.includes('블루라벨')) return '블루라벨';
    if (noSpaceName.includes('블랙라벨')) return '블랙라벨';
    if (noSpaceName.includes('더블블랙')) return '더블블랙';
    if (noSpaceName.includes('그린라벨')) return '그린라벨';
    if (noSpaceName.includes('레드라벨')) return '레드라벨';
    if (noSpaceName.includes('골드라벨') || noSpaceName.includes('골드리저브')) return '골드라벨';
    if (noSpaceName.includes('블론드')) return '블론드';
    if (noSpaceName.includes('블랙루비')) return '블랙루비';
    if (noSpaceName.includes('레어브리드')) return '레어브리드';
    if (noSpaceName.includes('더블캐스크')) return '더블캐스크';
    if (noSpaceName.includes('쉐리') || noSpaceName.includes('셰리')) return '쉐리캐스크';
    if (noSpaceName.includes('싱글몰트')) return '싱글몰트';
    if (noSpaceName.includes('블렌디드몰트')) return '블렌디드 몰트';
    if (noSpaceName.includes('블렌디드')) return '블렌디드';
    if (noSpaceName.includes('버번')) return '버번';
    if (noSpaceName.includes('라이')) return '라이';
  }

  return 'None';
}

function calculateMatchScore(keyword: string, candidate: EmartCandidate): number {
  const normalizedKeyword = normalizeForMatch(keyword);
  const normalizedName = normalizeForMatch(candidate.name);
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

  if (containsLiquorHint(candidate.name)) {
    score += 25;
  }
  if (containsAccessoryHint(candidate.name)) {
    score -= 80;
  }

  return score;
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

function containsLiquorHint(name: string): boolean {
  const lower = name.toLowerCase();
  return ['위스키', 'whisky', 'whiskey', '버번', '스카치', 'single malt', '싱글몰트', '와인', '샴페인', '사케', '청주']
    .some((hint) => lower.includes(hint));
}

function containsAccessoryHint(name: string): boolean {
  const lower = name.toLowerCase();
  return ['잔', '글라스', '머그', '컵', '치약', '원피스', '팬츠', '스푼', '미니어처', '디캔터', '코스터']
    .some((hint) => lower.includes(hint));
}

function simpleHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}
