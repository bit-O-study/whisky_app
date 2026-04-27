import { createBrowserBundle } from '../core/browser.js';
import { ensureArtifactDir, nowStamp, writeJsonArtifact, writeTextArtifact } from '../core/io.js';
import { parseCliArgs, resolveKeywords } from '../core/keywords.js';
import { crawlLotteonKeyword } from '../sources/lotteon.js';

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
      console.log(`[lotteon] crawling keyword: ${keyword}`);
      const { result, html } = await crawlLotteonKeyword(page, keyword);
      if (result.debugHtmlSaved) {
        const debugPath = await writeTextArtifact(`debug/lotteon-${startedAt}-${slugify(keyword)}.html`, html);
        console.log(`[lotteon] debug html saved: ${debugPath}`);
      }
      results.push(result);
    }

    const artifactPath = await writeJsonArtifact(`results/lotteon-${startedAt}.json`, {
      runner: 'backend/crawler-playwright',
      source: 'LOTTEON',
      startedAt,
      keywordCount: results.length,
      results,
    });

    if (options.trace) {
      await ensureArtifactDir('traces');
      const tracePath = `artifacts/traces/lotteon-${startedAt}.zip`;
      await context.tracing.stop({ path: tracePath });
      console.log(`[lotteon] trace saved: ${tracePath}`);
    }

    console.log(`[lotteon] result artifact: ${artifactPath}`);
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
