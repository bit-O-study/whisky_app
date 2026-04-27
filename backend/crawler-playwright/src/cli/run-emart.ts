import { createBrowserBundle } from '../core/browser.js';
import { ensureArtifactDir, writeJsonArtifact, writeTextArtifact, nowStamp } from '../core/io.js';
import { parseCliArgs, resolveKeywords } from '../core/keywords.js';
import { crawlEmartKeyword } from '../sources/emart.js';

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const keywords = await resolveKeywords(options);

  if (keywords.length === 0) {
    throw new Error('최소 1개 이상의 키워드가 필요합니다. --keyword 또는 --keywords-file을 사용하세요.');
  }

  const { browser, context, page } = await createBrowserBundle(options.headed);
  const startedAt = nowStamp();

  try {
    if (options.trace) {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    }

    const results = [];
    for (const keyword of keywords) {
      console.log(`[emart] crawling keyword: ${keyword}`);
      const { result, html } = await crawlEmartKeyword(page, keyword);
      if (result.debugHtmlSaved) {
        const debugPath = await writeTextArtifact(`debug/emart-${startedAt}-${slugify(keyword)}.html`, html);
        console.log(`[emart] debug html saved: ${debugPath}`);
      }
      results.push(result);
    }

    const artifactPath = await writeJsonArtifact(`results/emart-${startedAt}.json`, {
      runner: 'backend/crawler-playwright',
      source: 'EMART',
      startedAt,
      keywordCount: results.length,
      results,
    });

    if (options.trace) {
      await ensureArtifactDir('traces');
      const tracePath = `artifacts/traces/emart-${startedAt}.zip`;
      await context.tracing.stop({ path: tracePath });
      console.log(`[emart] trace saved: ${tracePath}`);
    }

    console.log(`[emart] result artifact: ${artifactPath}`);
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'keyword';
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
