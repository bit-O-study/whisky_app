import { createBrowserBundle } from '../core/browser.js';
import type { IngestPreview } from '../core/ingest-preview.js';
import { ensureArtifactDir, nowStamp, writeJsonArtifact, writeTextArtifact } from '../core/io.js';
import { previewIngest } from '../core/ingest-preview.js';
import { parseCliArgs, resolveKeywords } from '../core/keywords.js';
import { evaluateSafetyGate } from '../core/safety-gates.js';
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
      console.log(`[preview:emart] crawling keyword: ${keyword}`);
      const { result, html } = await crawlEmartKeyword(page, keyword);

      if (result.debugHtmlSaved) {
        const debugPath = await writeTextArtifact(`debug/preview-emart-${startedAt}-${slugify(keyword)}.html`, html);
        console.log(`[preview:emart] debug html saved: ${debugPath}`);
      }

      const preview: IngestPreview = result.bestMatch
        ? await previewIngest({ ...result.bestMatch, source: 'EMART' })
        : {
            source: 'EMART',
            scrapedName: result.keyword,
            normalizedCandidate: null,
            matchedLiquorInfoId: null,
            matchedLiquorId: null,
            liquorAction: 'skip',
            priceAction: 'skip',
            urlAction: 'skip',
            liquorCandidates: [],
            skip: true,
            reason: 'crawl produced no acceptable candidate',
          };

      const safetyGate = evaluateSafetyGate({
        source: 'EMART',
        bestScore: result.bestScore,
        ingestPreview: preview,
      });

      results.push({ crawlResult: result, ingestPreview: preview, safetyGate });
    }

    const artifactPath = await writeJsonArtifact(`previews/emart-preview-${startedAt}.json`, {
      runner: 'backend/crawler-playwright',
      source: 'EMART',
      startedAt,
      keywordCount: results.length,
      results,
    });

    if (options.trace) {
      await ensureArtifactDir('traces');
      const tracePath = `artifacts/traces/emart-preview-${startedAt}.zip`;
      await context.tracing.stop({ path: tracePath });
      console.log(`[preview:emart] trace saved: ${tracePath}`);
    }

    console.log(`[preview:emart] result artifact: ${artifactPath}`);
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^0-9a-z가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'keyword';
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
