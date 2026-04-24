import type { IngestPreview } from '../core/ingest-preview.js';
import { previewIngest } from '../core/ingest-preview.js';
import { applyIngestWrite } from '../core/ingest-write.js';
import { ensureArtifactDir, nowStamp, writeJsonArtifact, writeTextArtifact } from '../core/io.js';
import { parseCliArgs, resolveKeywords } from '../core/keywords.js';
import { evaluateSafetyGate } from '../core/safety-gates.js';
import { crawlEmartKeyword } from '../sources/emart.js';
import { createBrowserBundle } from '../core/browser.js';

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
      console.log(`[ingest:emart] crawling keyword: ${keyword}`);
      const { result, html } = await crawlEmartKeyword(page, keyword);

      if (result.debugHtmlSaved) {
        const debugPath = await writeTextArtifact(`debug/ingest-emart-${startedAt}-${slugify(keyword)}.html`, html);
        console.log(`[ingest:emart] debug html saved: ${debugPath}`);
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

      const writeResult = result.bestMatch
        ? await applyIngestWrite({
            candidate: { ...result.bestMatch, source: 'EMART' },
            preview,
            safetyGate,
          })
        : {
            source: 'EMART',
            wrote: false,
            blocked: true,
            blockReason: 'crawl produced no acceptable candidate',
            liquorId: null,
            liquorAction: 'skip' as const,
            priceAction: 'skip' as const,
            urlAction: 'skip' as const,
            details: ['crawl produced no acceptable candidate'],
          };

      results.push({ crawlResult: result, ingestPreview: preview, safetyGate, writeResult });
    }

    const artifactPath = await writeJsonArtifact(`writes/emart-ingest-${startedAt}.json`, {
      runner: 'backend/crawler-playwright',
      source: 'EMART',
      startedAt,
      keywordCount: results.length,
      results,
    });

    if (options.trace) {
      await ensureArtifactDir('traces');
      const tracePath = `artifacts/traces/emart-ingest-${startedAt}.zip`;
      await context.tracing.stop({ path: tracePath });
      console.log(`[ingest:emart] trace saved: ${tracePath}`);
    }

    console.log(`[ingest:emart] result artifact: ${artifactPath}`);
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
