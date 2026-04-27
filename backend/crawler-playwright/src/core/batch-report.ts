import { writeJsonArtifact, writeTextArtifact } from './io.js';

type PreviewResultLike = {
  crawlResult: {
    keyword: string;
    bestScore: number | null;
    bestMatch: unknown | null;
  };
  ingestPreview: {
    source: string;
    liquorAction: string;
    priceAction: string;
    urlAction: string;
    matchedLiquorInfo?: {
      subCategory: string;
    } | null;
    matchedLiquorId: number | null;
    reason: string | null;
  };
  safetyGate: {
    confidence: string;
    reviewNeeded: boolean;
    autoWriteAllowed: boolean;
    blockReason: string | null;
    reasons: string[];
  };
  writeResult?: {
    wrote: boolean;
    blocked: boolean;
    blockReason: string | null;
    liquorId: number | null;
    details: string[];
  };
};

export async function writeBatchSummary(params: {
  source: string;
  mode: 'preview' | 'ingest';
  startedAt: string;
  results: PreviewResultLike[];
}): Promise<{ jsonPath: string; markdownPath: string }> {
  const { source, mode, startedAt, results } = params;

  const total = results.length;
  const matched = results.filter((result) => result.crawlResult.bestMatch).length;
  const autoWriteAllowed = results.filter((result) => result.safetyGate.autoWriteAllowed).length;
  const reviewNeeded = results.filter((result) => result.safetyGate.reviewNeeded).length;
  const blocked = results.filter((result) => result.writeResult?.blocked).length;
  const wrote = results.filter((result) => result.writeResult?.wrote).length;
  const subCategoryCounts = countBySubCategory(results);

  const blockedKeywords = results
    .filter((result) => result.safetyGate.reviewNeeded || result.writeResult?.blocked)
    .map((result) => ({
      keyword: result.crawlResult.keyword,
      blockReason: result.writeResult?.blockReason ?? result.safetyGate.blockReason,
      reasons: result.safetyGate.reasons,
    }));

  const summary = {
    source,
    mode,
    startedAt,
    total,
    matched,
    autoWriteAllowed,
    reviewNeeded,
    blocked,
    wrote,
    subCategoryCounts,
    blockedKeywords,
  };

  const jsonPath = await writeJsonArtifact(`summaries/${source.toLowerCase()}-${mode}-${startedAt}.json`, summary);
  const markdown = [
    `# ${source} ${mode} summary`,
    '',
    `- startedAt: ${startedAt}`,
    `- total: ${total}`,
    `- matched: ${matched}`,
    `- autoWriteAllowed: ${autoWriteAllowed}`,
    `- reviewNeeded: ${reviewNeeded}`,
    `- wrote: ${wrote}`,
    `- blocked: ${blocked}`,
    `- subCategoryCounts: ${formatSubCategoryCounts(subCategoryCounts)}`,
    '',
    '## blocked/review keywords',
    ...(
      blockedKeywords.length > 0
        ? blockedKeywords.map((item) => `- ${item.keyword} | ${item.blockReason ?? 'unknown'} | ${item.reasons.join(', ')}`)
        : ['- none']
    ),
    '',
  ].join('\n');
  const markdownPath = await writeTextArtifact(`summaries/${source.toLowerCase()}-${mode}-${startedAt}.md`, markdown);

  return { jsonPath, markdownPath };
}

function countBySubCategory(results: PreviewResultLike[]) {
  const counts: Record<string, number> = {};
  for (const result of results) {
    if (!result.crawlResult.bestMatch) {
      continue;
    }

    const subCategory = result.ingestPreview.matchedLiquorInfo?.subCategory || 'Unknown';
    counts[subCategory] = (counts[subCategory] ?? 0) + 1;
  }
  return counts;
}

function formatSubCategoryCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return 'none';
  }
  return entries.map(([key, value]) => `${key}=${value}`).join(', ');
}
