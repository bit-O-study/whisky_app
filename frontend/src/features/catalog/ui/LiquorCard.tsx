import Image from "next/image";
import Link from "next/link";
import type { CatalogCardItem } from "../model/catalog";

function normalizePrice(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatPrice(price: number) {
  const normalized = normalizePrice(price);
  return normalized.toLocaleString("ko-KR") + "원";
}

function isKnownMetaValue(value: string) {
  return Boolean(value && value !== "Unknown");
}

function getCardSignal(liquor: CatalogCardItem) {
  if (liquor.vendors.length >= 10) return { label: "Tracked", className: "catalog-chip-warm" };
  if (liquor.lowest_price >= 150000) return { label: "Rare", className: "catalog-chip-ink" };
  if (liquor.alcohol_percent >= 46) return { label: "Cask Strength", className: "catalog-chip-soft" };
  return null;
}

interface LiquorCardProps {
  liquor: CatalogCardItem;
  prioritizeImage?: boolean;
}

export default function LiquorCard({ liquor, prioritizeImage = false }: LiquorCardProps) {
  const sortedVendors = liquor.vendors.slice().sort((a, b) => a.current_price - b.current_price);
  const bestVendor = sortedVendors[0];
  const signal = getCardSignal(liquor);
  const metaLine = [liquor.brand, liquor.sub_category || liquor.category, liquor.country]
    .filter(isKnownMetaValue)
    .join(" · ");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] catalog-lift">
      {/* 이미지 영역 */}
      <Link
        href={`/liquor/${liquor.id}`}
        className="catalog-bottle-well relative isolate z-10 block aspect-[4/5] overflow-hidden border-b border-[color:var(--catalog-hairline)]"
      >
        <Image
          src={
            liquor.image_url ||
            "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"
          }
          alt={liquor.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          className="object-contain p-8 transition-transform duration-500 group-hover:scale-[1.04]"
          priority={prioritizeImage}
        />

        {signal && (
          <div className="absolute left-4 top-4 z-10">
            <span className={signal.className}>{signal.label}</span>
          </div>
        )}

        <div className="absolute right-4 top-4 z-10 catalog-mono text-[11px] font-semibold tracking-wider text-[color:var(--catalog-muted)]">
          {liquor.alcohol_percent > 0 ? `${liquor.alcohol_percent}%` : "—"}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/liquor/${liquor.id}`}
          className="block transition-opacity duration-200 group-hover:opacity-90"
        >
          <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--catalog-muted)]">
            {metaLine}
          </p>

          <h3 className="mt-2 text-[1.05rem] font-semibold leading-[1.25] tracking-[-0.011em] text-[color:var(--catalog-ink)]">
            {liquor.name}
          </h3>
        </Link>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">
                Lowest
              </p>
              <p className="mt-1 text-[1.4rem] font-bold leading-none tracking-tight text-[color:var(--catalog-ink)]">
                {liquor.lowest_price > 0 ? formatPrice(liquor.lowest_price) : "—"}
              </p>
            </div>
            <div className="flex items-baseline gap-1.5 rounded-full bg-[color:var(--catalog-bg-secondary)] px-3 py-1.5">
              <span className="catalog-mono text-sm font-bold leading-none text-[color:var(--catalog-ink)]">
                {sortedVendors.length}
              </span>
              <span className="catalog-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--catalog-muted)]">
                vendors
              </span>
            </div>
          </div>

          {/* 모바일 판매처 */}
          <details className="catalog-details mt-3 md:hidden">
            <summary className="cursor-pointer catalog-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--catalog-muted)] transition hover:text-[color:var(--catalog-primary)]">
              판매처 보기 ↓
            </summary>
            <ul className="mt-3 space-y-1.5">
              {sortedVendors.map((vendor) => (
                <li key={vendor.source}>
                  <a
                    href={vendor.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl bg-[color:var(--catalog-bg-secondary)] px-3 py-2 transition hover:bg-[color:var(--catalog-bg-strong)]"
                  >
                    <span className="catalog-mono text-xs font-semibold tracking-wide text-[color:var(--catalog-ink)]">
                      {vendor.source}
                    </span>
                    <span className="flex items-center gap-2 text-right">
                      {vendor.original_price > vendor.current_price && (
                        <span className="catalog-mono text-xs text-[color:var(--catalog-soft)] line-through">
                          {formatPrice(vendor.original_price)}
                        </span>
                      )}
                          {vendor.discount_percent > 0 && (
                              <span className="text-[10px] font-bold text-[color:var(--catalog-primary)]">
                                {vendor.discount_percent}%
                              </span>
                          )}
                          <span
                              className={`catalog-mono text-sm font-bold ${
                                  bestVendor?.source === vendor.source
                                      ? "text-[color:var(--catalog-primary)]"
                                      : "text-[color:var(--catalog-ink)]"
                              }`}
                          >
                        {vendor.current_price > 0 ? formatPrice(vendor.current_price) : "가격 확인 중"}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {/* 데스크톱 hover 오버레이 — 미니멀한 white sheet */}
      <div className="pointer-events-none absolute inset-0 z-20 hidden flex-col justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_45%,rgba(255,255,255,0.96)_92%)]" />
        <div className="pointer-events-auto relative rounded-2xl border border-[color:var(--catalog-outline-strong)] bg-white/95 p-4 shadow-[var(--catalog-shadow-md)] backdrop-blur">
          <h4 className="mb-3 catalog-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--catalog-primary)]">
            판매처
          </h4>
          <ul className="space-y-1.5">
            {sortedVendors.map((vendor) => (
              <li key={vendor.source}>
                <a
                  href={vendor.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-1.5 transition hover:border-[color:var(--catalog-outline-strong)] hover:bg-[color:var(--catalog-bg-secondary)]"
                >
                  <span className="catalog-mono text-xs font-semibold tracking-wide text-[color:var(--catalog-ink)]">
                    {vendor.source}
                  </span>
                  <span className="flex items-center gap-2 text-right">
                    {vendor.original_price > vendor.current_price && (
                      <span className="catalog-mono text-xs text-[color:var(--catalog-soft)] line-through">
                        {formatPrice(vendor.original_price)}
                      </span>
                    )}
                        {vendor.discount_percent > 0 && (
                            <span className="text-[10px] font-bold text-white/80">
                              {vendor.discount_percent}%
                            </span>
                        )}
                      <span
                          className={`catalog-mono text-sm font-bold ${
                              bestVendor?.source === vendor.source
                                  ? "text-[color:var(--catalog-primary)]"
                                  : "text-[color:var(--catalog-ink)]"
                          }`}
                      >
                      {vendor.current_price > 0 ? formatPrice(vendor.current_price) : "가격 확인 중"}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
