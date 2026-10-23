import { createBrowserBundle } from '../core/browser.js';
import { nowStamp, writeJsonArtifact } from '../core/io.js';
import { lotteonCode, sendObservations } from '../core/daily-lotteon.js';
import { crawlLotteonKeyword } from '../sources/lotteon.js';

interface Item { id: number; name: string; volume: number; vendors: { source: string; product_url: string }[] }
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex < 0 ? 0 : Number(args[limitIndex + 1]);
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error('Invalid limit');
  const items: Item[] = [];
  for (let page = 0; ; page++) {
    if (page >= 100) throw new Error('Catalog pagination exceeded limit');
    const response = await fetch(`https://whisky-app-vert.vercel.app/api/liquors?page=${page}&size=100`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Catalog failed: ${response.status}`);
    const result = await response.json() as { items: Item[]; hasNext: boolean };
    items.push(...result.items);
    if (!result.hasNext) break;
  }
  const targets = items.filter(item => item.vendors.some(v => v.source === 'LOTTEON' && lotteonCode(v.product_url)));
  const selected = limit ? targets.slice(0, limit) : targets;
  if (!selected.length) throw new Error('No existing Lotteon products');
  const { browser, context, page } = await createBrowserBundle(false);
  const results: unknown[] = [];
  let updated = 0;
  let failures = 0;
  try {
    for (const item of selected) {
      try {
        const keyword = /\d\s*(?:ml|l|리터)\b/i.test(item.name) ? item.name : `${item.name} ${item.volume}ml`;
        const { result } = await crawlLotteonKeyword(page, keyword);
        const best = result.bestMatch;
        const known = item.vendors.find(v => v.source === 'LOTTEON')!;
        if (!best || lotteonCode(best.productUrl) !== lotteonCode(known.product_url)) {
          results.push({ liquorId: item.id, status: 'skipped', reason: 'No matching existing product code', result });
          console.log(`SKIPPED id=${item.id} ${keyword}`);
          continue;
        }
        const observation = { liquorId: item.id, currentPrice: best.currentPrice,
          originalPrice: Math.max(best.originalPrice, best.currentPrice), productUrl: best.productUrl,
          imageUrl: best.imageUrl, observedAt: result.collectedAt };
        if (!dryRun) updated += await sendObservations([observation]);
        results.push({ observation, status: dryRun ? 'dry-run' : 'saved' });
        console.log(`${dryRun ? 'DRY_RUN' : 'SAVED'} id=${item.id} price=${best.currentPrice}`);
      } catch (error) {
        failures++;
        results.push({ liquorId: item.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
        console.error(`FAILED id=${item.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await writeJsonArtifact(`daily/lotteon-${nowStamp()}.json`, { dryRun, updated, failures, targets: selected.length, results });
    await context.close();
    await browser.close();
  }
  if (failures || (!dryRun && !updated)) throw new Error(`Daily crawl failed: updated=${updated}, failures=${failures}`);
  console.log(`LOTTEON_DAILY_SUCCESS updated=${updated} dryRun=${dryRun} targets=${selected.length}`);
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
