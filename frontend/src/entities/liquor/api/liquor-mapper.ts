import type { Liquor } from "../model/liquor";
import type { LiquorDto } from "./liquor-dto";

function numberOrFallback(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringOrFallback(value: string | undefined, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export function mapLiquorDtoToEntity(item: LiquorDto): Liquor {
  const currentPrice = numberOrFallback(
    typeof item.currentPrice === "number" ? item.currentPrice : item.current_price,
    0,
  );
  const originalPrice = numberOrFallback(
    typeof item.originalPrice === "number" ? item.originalPrice : item.original_price,
    currentPrice,
  );
  const alcoholPercent = numberOrFallback(
    typeof item.alcoholPercent === "number" ? item.alcoholPercent : item.alcohol_percent,
    0,
  );

  return {
    id: numberOrFallback(item.id, 0),
    product_code: stringOrFallback(item.productCode ?? item.product_code, ""),
    name: stringOrFallback(item.name, "Unknown"),
    brand: stringOrFallback(item.brand, "Unknown"),
    category: stringOrFallback(item.category, "Whisky"),
    volume: numberOrFallback(item.volume, 700),
    alcohol_percent: alcoholPercent,
    country: stringOrFallback(item.country, "Unknown"),
    current_price: currentPrice,
    original_price: originalPrice,
    image_url: stringOrFallback(item.imageUrl ?? item.image_url, ""),
    product_url: stringOrFallback(item.productUrl ?? item.product_url, ""),
    source: stringOrFallback(item.source, "WHISKY_DB"),
  };
}
