import type { IngestPreview, PreviewCandidateInput } from './ingest-preview.js';
import type { SafetyGateResult } from './safety-gates.js';
import { callSupabaseRpc } from './supabase-rest.js';

export interface IngestWriteResult {
  source: string;
  wrote: boolean;
  blocked: boolean;
  blockReason: string | null;
  liquorId: number | null;
  liquorAction: 'reuse' | 'insert' | 'skip';
  priceAction: 'insert' | 'update' | 'skip';
  urlAction: 'insert' | 'update' | 'skip';
  details: string[];
}

export async function applyIngestWrite(params: {
  candidate: PreviewCandidateInput; preview: IngestPreview; safetyGate: SafetyGateResult;
}): Promise<IngestWriteResult> {
  const { candidate, preview, safetyGate } = params;
  const price = preview.normalizedCandidate?.currentPrice;
  const validPrice = typeof price === 'number' && Number.isSafeInteger(price) && price > 0 && price <= 2147483647;
  const reason = !validPrice ? 'invalid_current_price'
    : preview.liquorAction !== 'reuse' || !preview.matchedLiquorId ? 'existing_liquor_required'
    : !safetyGate.autoWriteAllowed ? safetyGate.blockReason ?? 'safety_gate_blocked' : null;
  const base = {
    source: candidate.source, liquorId: preview.matchedLiquorId,
    liquorAction: preview.liquorAction, priceAction: preview.priceAction, urlAction: preview.urlAction,
  };
  if (reason) return { ...base, wrote: false, blocked: true, blockReason: reason, details: [reason, ...safetyGate.reasons] };

  // A single DB transaction commits price, URL and history; missing RPC fails closed.
  const result = await callSupabaseRpc<{ observedAt: string }>('ingest_existing_liquor', {
    p: {
      liquorId: preview.matchedLiquorId, source: candidate.source.toUpperCase(),
      currentPrice: price, originalPrice: preview.normalizedCandidate?.originalPrice ?? price,
      productUrl: preview.urlAction === 'skip' ? '' : candidate.productUrl,
      imageUrl: candidate.imageUrl, observedAt: new Date().toISOString(),
    },
  });
  return { ...base, wrote: true, blocked: false, blockReason: null,
    details: ['atomically saved price, URL and history at ' + result.observedAt] };
}
