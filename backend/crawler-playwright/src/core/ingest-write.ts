import type { IngestPreview, PreviewCandidateInput } from './ingest-preview.js';
import type { SafetyGateResult } from './safety-gates.js';
import { fetchSupabaseRows, insertSupabaseRow, updateSupabaseRows } from './supabase-rest.js';

interface LiquorRow {
  id: number;
  normalized_name: string | null;
  brand: string | null;
  category: string | null;
  volume_ml: number | null;
  alcohol_percent: number | null;
  class: string | null;
  product_code: string | null;
  product_name: string | null;
  product_url: string | null;
  image_url: string | null;
  liquor_info_id: number | null;
}

interface LiquorPriceRow {
  id: number;
  liquor_id: number;
  source: string | null;
  current_price: number | null;
  original_price: number | null;
  crawled_at: string | null;
}

interface LiquorUrlRow {
  id: number;
  liquor_id: number;
  source: string | null;
  product_url: string | null;
  image_url: string | null;
}

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
  candidate: PreviewCandidateInput;
  preview: IngestPreview;
  safetyGate: SafetyGateResult;
}): Promise<IngestWriteResult> {
  const { candidate, preview, safetyGate } = params;

  if (!safetyGate.autoWriteAllowed) {
    return {
      source: candidate.source,
      wrote: false,
      blocked: true,
      blockReason: safetyGate.blockReason,
      liquorId: preview.matchedLiquorId,
      liquorAction: preview.liquorAction,
      priceAction: preview.priceAction,
      urlAction: preview.urlAction,
      details: [...safetyGate.reasons],
    };
  }

  let liquorId = preview.matchedLiquorId;
  const details: string[] = [];

  if (preview.liquorAction === 'insert') {
    const insertedLiquor = await insertSupabaseRow<LiquorRow>('liquor', {
      normalized_name: preview.normalizedCandidate?.normalizedName,
      brand: preview.normalizedCandidate?.brand,
      category: preview.normalizedCandidate?.category,
      volume_ml: preview.normalizedCandidate?.volumeMl,
      alcohol_percent: preview.normalizedCandidate?.alcoholPercent,
      class: preview.normalizedCandidate?.clazz,
      product_code: preview.normalizedCandidate?.productCode,
      product_name: candidate.name,
      product_url: candidate.productUrl,
      image_url: candidate.imageUrl,
      liquor_info_id: preview.matchedLiquorInfoId,
    });
    liquorId = insertedLiquor.id;
    details.push(`inserted liquor:${liquorId}`);
  } else if (preview.liquorAction === 'reuse' && liquorId) {
    details.push(`reused liquor:${liquorId}`);
  }

  if (!liquorId) {
    throw new Error('write path could not resolve liquorId');
  }

  if (preview.priceAction !== 'skip') {
    const existingPrices = await fetchSupabaseRows<LiquorPriceRow>('liquor_price', {
      select: 'id,liquor_id,source,current_price,original_price,crawled_at',
      filters: { liquor_id: liquorId, source: candidate.source.toUpperCase() },
      limit: 1,
    });

    if (existingPrices.length > 0) {
      await updateSupabaseRows<LiquorPriceRow>(
        'liquor_price',
        {
          current_price: candidate.currentPrice,
          original_price: candidate.originalPrice,
        },
        { id: existingPrices[0].id },
      );
      details.push(`updated price:${existingPrices[0].id}`);
    } else {
      const insertedPrice = await insertSupabaseRow<LiquorPriceRow>('liquor_price', {
        liquor_id: liquorId,
        source: candidate.source.toUpperCase(),
        current_price: candidate.currentPrice,
        original_price: candidate.originalPrice,
        crawled_at: new Date().toISOString(),
      });
      details.push(`inserted price:${insertedPrice.id}`);
    }
  }

  if (preview.urlAction !== 'skip' && candidate.productUrl) {
    const existingUrls = await fetchSupabaseRows<LiquorUrlRow>('liquor_url', {
      select: 'id,liquor_id,source,product_url,image_url',
      filters: { liquor_id: liquorId, source: candidate.source.toUpperCase() },
      limit: 1,
    });

    if (existingUrls.length > 0) {
      await updateSupabaseRows<LiquorUrlRow>(
        'liquor_url',
        {
          product_url: candidate.productUrl,
          image_url: candidate.imageUrl,
        },
        { id: existingUrls[0].id },
      );
      details.push(`updated url:${existingUrls[0].id}`);
    } else {
      const insertedUrl = await insertSupabaseRow<LiquorUrlRow>('liquor_url', {
        liquor_id: liquorId,
        source: candidate.source.toUpperCase(),
        product_url: candidate.productUrl,
        image_url: candidate.imageUrl,
      });
      details.push(`inserted url:${insertedUrl.id}`);
    }
  }

  return {
    source: candidate.source,
    wrote: true,
    blocked: false,
    blockReason: null,
    liquorId,
    liquorAction: preview.liquorAction,
    priceAction: preview.priceAction,
    urlAction: preview.urlAction,
    details,
  };
}
