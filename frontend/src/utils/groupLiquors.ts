import type { GroupedLiquor, Liquor } from "../types/liquor";

function normalizePrice(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function groupLiquors(liquors: Liquor[]): GroupedLiquor[] {
  const map = new Map<string, GroupedLiquor>();

  for (const l of liquors) {
    if (!map.has(l.name)) {
      map.set(l.name, {
        name: l.name,
        brand: l.brand,
        category: l.category,
        country: l.country,
        alcohol_percent: l.alcohol_percent,
        volume: l.volume,
        image_url: l.image_url,
        vendors: [],
        lowest_price: Infinity,
      });
    }

    const g = map.get(l.name)!;
    const currentPrice = normalizePrice(l.current_price);
    const originalPrice = normalizePrice(l.original_price);

    g.vendors.push({
      source: l.source,
      current_price: currentPrice,
      original_price: originalPrice,
      product_url: l.product_url,
    });
    if (currentPrice < g.lowest_price) {
      g.lowest_price = currentPrice;
    }
  }

  return Array.from(map.values());
}
