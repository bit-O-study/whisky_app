import { createBrowserBundle } from '../core/browser.js';
import { ensureArtifactDir, nowStamp, writeJsonArtifact, writeTextArtifact } from '../core/io.js';
import { previewIngest, type IngestPreview } from '../core/ingest-preview.js';
import { applyIngestWrite } from '../core/ingest-write.js';
import { fetchLiquorInfoKeywords } from '../core/liquor-info-keywords.js';
import { parseCliArgs } from '../core/keywords.js';
import { evaluateSafetyGate } from '../core/safety-gates.js';
import { crawlLotteonKeyword } from '../sources/lotteon.js';
import { writeBatchSummary } from '../core/batch-report.js';

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const keywords = await fetchLiquorInfoKeywords(options.limit);

  if (keywords.length === 0) {
    throw new Error('liquor_info 기반 batch keyword가 없습니다.');
  }

  const { browser, context, page } = await createBrowserBundle(options.headed);
  const startedAt = nowStamp();

  try {
    if (options.trace) {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    }

    const results = [];
    for (const keyword of keywords) {
      console.log(`[ingest:lotteon:batch] crawling keyword: ${keyword}`);
      const { result, html } = await crawlLotteonKeyword(page, keyword);

      if (result.debugHtmlSaved) {
        const debugPath = await writeTextArtifact(`debug/ingest-lotteon-batch-${startedAt}-${slugify(keyword)}.html`, html);
        console.log(`[ingest:lotteon:batch] debug html saved: ${debugPath}`);
      }

      const preview: IngestPreview = result.bestMatch
        ? await previewIngest({ ...result.bestMatch, source: 'LOTTEON' })
        : {
            source: 'LOTTEON',
            scrapedName: result.keyword,
            normalizedCandidate: null,
            matchedLiquorInfo: null,
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
        source: 'LOTTEON',
        bestScore: result.bestScore,
        ingestPreview: preview,
      });

      const writeResult = result.bestMatch
        ? await applyIngestWrite({
            candidate: { ...result.bestMatch, source: 'LOTTEON' },
            preview,
            safetyGate,
          })
        : {
            source: 'LOTTEON',
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

    const artifactPath = await writeJsonArtifact(`writes/lotteon-batch-ingest-${startedAt}.json`, {
      runner: 'backend/crawler-playwright',
      source: 'LOTTEON',
      startedAt,
      keywordCount: results.length,
      mode: 'batch',
      results,
    });

    const summaryPaths = await writeBatchSummary({
      source: 'LOTTEON',
      mode: 'ingest',
      startedAt,
      results,
    });

    if (options.trace) {
      await ensureArtifactDir('traces');
      const tracePath = `artifacts/traces/lotteon-batch-ingest-${startedAt}.zip`;
      await context.tracing.stop({ path: tracePath });
      console.log(`[ingest:lotteon:batch] trace saved: ${tracePath}`);
    }

    console.log(`[ingest:lotteon:batch] result artifact: ${artifactPath}`);
    console.log(`[ingest:lotteon:batch] summary json: ${summaryPaths.jsonPath}`);
    console.log(`[ingest:lotteon:batch] summary md: ${summaryPaths.markdownPath}`);
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
