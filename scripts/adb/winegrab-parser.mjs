import { createHash } from 'node:crypto';

const decode = value => value.replace(/&(?:quot|apos|lt|gt|amp|#\d+|#x[\da-f]+);/gi, entity => {
  const named = { '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&amp;': '&' };
  return named[entity] ?? String.fromCodePoint(entity.startsWith('&#x')
    ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1)));
});

export function parseNodes(xml) {
  if (!xml.includes('</hierarchy>')) throw new Error('불완전한 UI XML');
  const nodes = [];
  const stack = [];
  for (const match of xml.matchAll(/<node\b[^>]*>|<\/node>/g)) {
    if (match[0] === '</node>') { stack.pop(); continue; }
    const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)]
      .map(([, key, value]) => [key, decode(value)]));
    const node = { ...attrs, parent: stack.at(-1), index: nodes.length,
      box: (attrs.bounds?.match(/\d+/g) ?? []).map(Number) };
    nodes.push(node);
    if (!match[0].endsWith('/>')) stack.push(node);
  }
  return nodes;
}

export function visible(node, minimumHeight = 16) {
  const [x1, y1, x2, y2] = node.box;
  return x2 > x1 && y2 - y1 >= minimumHeight;
}

export function activeScreen(xml) {
  const all = parseNodes(xml);
  // Android retains background WebViews in the hierarchy. Only the last visible
  // WebView is eligible; never fall back to a background category page.
  const root = all.filter(n => n.class === 'android.webkit.WebView' && visible(n)).at(-1);
  if (!root) throw new Error('와인그랩 WebView가 없습니다. 로그인 후 와인그랩을 열어주세요.');
  const nodes = all.filter(n => {
    for (let p = n; p; p = p.parent) if (p === root) return true;
    return false;
  });
  return { root, nodes };
}

export function extractProducts(xml, observedAt = new Date().toISOString()) {
  const { root, nodes } = activeScreen(xml);
  if (!nodes.some(n => n.text === '카테고리'))
    throw new Error('카테고리 화면이 아닙니다. 로그인/팝업/화면 전환을 확인하세요.');
  const footer = nodes.find(n => n['content-desc'] === '홈' && visible(n) && n.box[1] > root.box[3] * .7);
  const bottom = footer?.box[1] ?? root.box[3];
  const products = [];
  for (const node of nodes) {
    const raw = node['content-desc'] ?? '';
    if (!visible(node, 70) || !raw.includes('판매가')) continue;
    const priceMatch = raw.match(/판매가\s*([\d,]+)\s*원/);
    if (!priceMatch) continue;
    const descendants = nodes.filter(n => n.parent === node);
    const priceNode = descendants.find(n => n.text === priceMatch[1] && visible(n)
      && n.box[3] <= bottom);
    if (!priceNode) continue; // Ignore clipped prices, hidden loaded rows and bottom-nav overlap.
    const name = raw.split(/\s+(?:할인율|정상가|판매가)\s*/)[0].trim();
    const badge = nodes.filter(n => ['이마트', '트레이더스'].includes(n.text)
      && n.class === 'android.widget.TextView' && visible(n)
      && n.box[0] >= root.box[2] * .35 && n.box[1] <= node.box[1]
      && node.box[1] - n.box[3] < 150).at(-1);
    if (!badge) continue; // Never infer retailer from a selected filter alone.
    const source = badge.text === '이마트' ? 'EMART' : 'TRADERS';
    const volume = name.match(/(\d+(?:\.\d+)?)\s*(ml|l)\b/i);
    const price = Number(priceMatch[1].replaceAll(',', ''));
    if (!price || !Number.isSafeInteger(price)) continue;
    const conditional = /최대할인가|카드할인|회원|쿠폰/.test(raw);
    products.push({
      key: createHash('sha256').update(`${source}|${name}`).digest('hex').slice(0, 24),
      source, channel: 'WINEGRAB_APP', category: '위스키', name,
      volume_ml: volume ? Number(volume[1]) * (volume[2].toLowerCase() === 'l' ? 1000 : 1) : null,
      displayed_price: price,
      regular_price: raw.match(/정상가\s*([\d,]+)\s*원/)?.[1].replaceAll(',', '') * 1 || null,
      price_kind: conditional ? 'CONDITIONAL_DISPLAY' : 'DISPLAYED_SALE',
      conditions: ['최대할인가', '카드할인', '회원', '쿠폰'].filter(s => raw.includes(s)),
      store: null, product_id: null, observed_at: observedAt, raw_text: raw,
      review_required: true,
    });
  }
  return products;
}
