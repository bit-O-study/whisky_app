import Image from "next/image";
import Link from "next/link";
import type { CatalogCardItem } from "../model/catalog";
import type { SourceKey } from "../api/catalog-server";

interface Props {
  recommendations: Record<SourceKey, CatalogCardItem[]>;
}

const SOURCE_ORDER: SourceKey[] = ["LOTTEON", "EMART", "EMART_TRADERS", "COSTCO"];

const SOURCE_LABELS: Record<SourceKey, string> = {
  LOTTEON: "롯데온",
  EMART: "이마트",
  EMART_TRADERS: "이마트 트레이더스",
  COSTCO: "코스트코",
};

function formatPrice(price: number) {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return "—";
  return `${price.toLocaleString("ko-KR")}원`;
}

function findVendorPrice(item: CatalogCardItem, source: SourceKey) {
  const vendor = item.vendors?.find((v) => v.source === source);
  if (vendor && vendor.current_price > 0) return vendor.current_price;
  return item.lowest_price;
}

export default function SourceRecommendations({ recommendations }: Props) {
  const tiles = SOURCE_ORDER.map((source) => ({ source, item: recommendations[source]?.[0] ?? null }));
  const hasAny = tiles.some((t) => t.item);
  if (!hasAny) return null;

  return (
    <div className="mt-8">
      <p className="catalog-mono mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
        BY MARKETPLACE
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(({ source, item }) =>
          item ? (
            <Link
              key={source}
              href={`/liquor/${item.id}`}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] p-3 transition hover:border-[color:var(--catalog-outline-strong)] hover:shadow-[var(--catalog-shadow-md)]"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[color:var(--catalog-bg-secondary)]">
                <Image
                  src={item.image_url || "/default.webp"}
                  alt={item.name}
                  fill
                  sizes="4rem"
                  className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.05]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="catalog-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-primary)]">
                  {SOURCE_LABELS[source]}
                </p>
                <p className="mt-1 line-clamp-2 text-[0.78rem] font-semibold leading-snug text-[color:var(--catalog-ink)]">
                  {item.name}
                </p>
                <p className="mt-1 text-[0.85rem] font-bold tracking-tight text-[color:var(--catalog-ink)]">
                  {formatPrice(findVendorPrice(item, source))}
                </p>
              </div>
            </Link>
          ) : (
            <div
              key={source}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-secondary)] p-3"
            >
              <div className="h-16 w-16 shrink-0 rounded-lg bg-[color:rgba(216,195,180,0.32)]" />
              <div className="min-w-0 flex-1">
                <p className="catalog-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-muted)]">
                  {SOURCE_LABELS[source]}
                </p>
                <p className="mt-1 text-[0.75rem] text-[color:var(--catalog-soft)]">데이터 없음</p>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
