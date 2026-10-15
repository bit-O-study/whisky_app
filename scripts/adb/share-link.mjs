import { parseNodes } from './winegrab-parser.mjs';

export function readSharedLink(xml, expectedName) {
  const nodes = parseNodes(xml);
  const title = nodes.find(n => n['resource-id'] === 'android:id/content_preview_title')?.text;
  const value = nodes.find(n => n['resource-id'] === 'android:id/content_preview_text')?.text;
  if (title !== expectedName) throw Error('공유 상품명 불일치');
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['emart.kr', 'eapp.emart.com'].includes(url.hostname))
    throw Error('지원하지 않는 상품 공유 URL');
  return url.href;
}
