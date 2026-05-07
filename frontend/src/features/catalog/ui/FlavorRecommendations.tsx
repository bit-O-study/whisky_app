import Image from "next/image";
import Link from "next/link";
import { FLAVOR_AXES, FLAVOR_AXIS_LABELS, type CatalogCardItem, type FlavorAxis } from "../model/catalog";

interface Props {
  recommendations: Record<FlavorAxis, CatalogCardItem[]>;
}

function formatPrice(price: number) {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return "—";
  return `${price.toLocaleString("ko-KR")}원`;
}

export default function FlavorRecommendations({ recommendations }: Props) {
  const tiles = FLAVOR_AXES.map((axis) => ({ axis, item: recommendations[axis]?.[0] ?? null }));
  if (!tiles.some((t) => t.item)) return null;

  return (
    <div className="mt-5">
      <p className="catalog-mono mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
        BY FLAVOR
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(({ axis, item }) => {
          const meta = FLAVOR_AXIS_LABELS[axis];
          if (!item) {
            return (
              <div
                key={axis}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-secondary)] p-3"
              >
                <div className="h-16 w-16 shrink-0 rounded-lg bg-[color:rgba(216,195,180,0.32)]" />
                <div className="min-w-0 flex-1">
                  <p className="catalog-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-muted)]">
                    {meta.label}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-[color:var(--catalog-soft)]">데이터 없음</p>
                </div>
              </div>
            );
          }
          const score = item[axis] ?? 0;
          return (
            <Link
              key={axis}
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
                <span className="absolute right-0 top-0 rounded-bl-lg bg-[color:var(--catalog-ink)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {score.toFixed(1)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="catalog-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-primary)]">
                  {meta.label}
                </p>
                <p className="mt-1 line-clamp-2 text-[0.78rem] font-semibold leading-snug text-[color:var(--catalog-ink)]">
                  {item.name}
                </p>
                <p className="mt-1 text-[0.85rem] font-bold tracking-tight text-[color:var(--catalog-ink)]">
                  {formatPrice(item.lowest_price)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
