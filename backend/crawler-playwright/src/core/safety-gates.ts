export interface SafetyGateInput {
  source: string;
  bestScore: number | null;
  ingestPreview: {
    liquorAction: 'reuse' | 'insert' | 'skip';
    priceAction: 'insert' | 'update' | 'skip';
    urlAction: 'insert' | 'update' | 'skip';
    skip: boolean;
    liquorCandidates?: Array<{
      id: number;
      clazz: string;
      productName: string;
    }>;
    reason: string | null;
  };
}

export interface SafetyGateResult {
  confidence: 'high' | 'medium' | 'low';
  reviewNeeded: boolean;
  autoWriteAllowed: boolean;
  blockReason: string | null;
  reasons: string[];
}

const LOW_SCORE_THRESHOLD = 60;
const HIGH_SCORE_THRESHOLD = 120;

export function evaluateSafetyGate(input: SafetyGateInput): SafetyGateResult {
  const reasons: string[] = [];
  const score = input.bestScore ?? 0;
  const candidateCount = input.ingestPreview.liquorCandidates?.length ?? 0;

  if (input.ingestPreview.skip) {
    reasons.push(input.ingestPreview.reason ?? 'preview marked as skip');
  }

  if (score < LOW_SCORE_THRESHOLD) {
    reasons.push(`low_score:${score}`);
  }

  if (input.ingestPreview.liquorAction === 'insert' && candidateCount > 0) {
    reasons.push('conflicting_existing_candidates');
  }

  const source = input.source.toUpperCase();
  if (source === 'LOTTEON' && input.ingestPreview.liquorAction === 'insert') {
    reasons.push('lotteon_new_insert_requires_review');
  }

  if (source === 'EMART' && input.ingestPreview.liquorAction === 'insert') {
    reasons.push('emart_new_insert_requires_review');
  }

  const confidence = score >= HIGH_SCORE_THRESHOLD
    ? 'high'
    : score >= LOW_SCORE_THRESHOLD
      ? 'medium'
      : 'low';

  const reviewNeeded = reasons.length > 0;
  const autoWriteAllowed =
    !reviewNeeded &&
    input.ingestPreview.liquorAction !== 'skip' &&
    input.ingestPreview.priceAction !== 'skip';

  return {
    confidence,
    reviewNeeded,
    autoWriteAllowed,
    blockReason: reasons[0] ?? null,
    reasons,
  };
}
