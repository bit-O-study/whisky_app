import type { Liquor } from "../types/liquor";
import type { FlavorVector, PreferenceResult } from "../types/preference";

interface LiquorApiResponse {
  id: number;
  productCode: string;
  name: string;
  brand: string;
  category: string;
  volume: number;
  alcoholPercent: number;
  country: string;
  currentPrice: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  source: string;
}

interface RecommendationItemApiResponse {
  liquor: LiquorApiResponse;
  similarity: number;
  reason: string;
}

interface RecommendationApiResponse {
  typeName: string;
  flavorVector: FlavorVector;
  recommendations: RecommendationItemApiResponse[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function toFrontendLiquor(item: LiquorApiResponse): Liquor {
  const currentPrice = typeof item.currentPrice === "number" ? item.currentPrice : 0;
  const originalPrice = typeof item.originalPrice === "number" ? item.originalPrice : currentPrice;

  return {
    id: typeof item.id === "number" ? item.id : 0,
    product_code: item.productCode ?? "",
    name: item.name ?? "Unknown",
    brand: item.brand ?? "Unknown",
    category: item.category ?? "Whisky",
    volume: typeof item.volume === "number" ? item.volume : 700,
    alcohol_percent: typeof item.alcoholPercent === "number" ? item.alcoholPercent : 0,
    country: item.country ?? "Unknown",
    current_price: currentPrice,
    original_price: originalPrice,
    image_url: item.imageUrl ?? "",
    product_url: item.productUrl ?? "",
    source: item.source ?? "WHISKY_DB",
  };
}

export async function fetchRecommendations(
  vector: FlavorVector,
  signal?: AbortSignal,
): Promise<PreferenceResult> {
  const response = await fetch(`${API_BASE_URL}/api/liquors/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vector),
    signal,
  });

  if (!response.ok) {
    throw new Error(`추천 결과 조회 실패: ${response.status}`);
  }

  const data = (await response.json()) as RecommendationApiResponse;

  return {
    type_name: data.typeName,
    flavor_vector: data.flavorVector,
    recommendations: data.recommendations.map((item) => ({
      liquor: toFrontendLiquor(item.liquor),
      similarity: item.similarity,
      reason: item.reason,
    })),
  };
}
