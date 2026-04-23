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

function formatMetaValue(value: string, fallback: string) {
  return value && value !== "Unknown" ? value : fallback;
}

function getCardSignal(liquor: CatalogCardItem) {
  if (liquor.vendors.length >= 10) {
    return {
      label: "Tracked",
      className: "bg-[color:var(--catalog-primary)] text-[#fbf6ee]",
    };
  }

  if (liquor.lowest_price >= 150000) {
    return {
      label: "Rare",
      className: "bg-[color:var(--catalog-accent)] text-[color:var(--catalog-ink)]",
    };
  }

  if (liquor.alcohol_percent >= 46) {
    return {
      label: "Bold",
      className: "bg-[color:var(--catalog-ink)] text-[#fbf6ee]",
    };
  }

  return {
    label: "Listed",
    className: "bg-[color:var(--catalog-bg-strong)] text-[color:var(--catalog-muted)]",
  };
}

interface LiquorCardProps {
  liquor: CatalogCardItem;
  prioritizeImage?: boolean;
}

export default function LiquorCard({ liquor, prioritizeImage = false }: LiquorCardProps) {
  const sortedVendors = liquor.vendors.slice().sort((a, b) => a.current_price - b.current_price);
  const bestVendor = sortedVendors[0];
  const signal = getCardSignal(liquor);
  const metaLine = [liquor.brand, formatMetaValue(liquor.country, "Archive")]
    .filter(Boolean)
    .join(" · ");

  return (
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-[color:var(--catalog-surface)] shadow-[var(--catalog-shadow-sm)] ring-1 ring-[color:var(--catalog-outline)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--catalog-shadow-lg)] hover:ring-[color:var(--catalog-outline-strong)]">

        {/* 이미지 영역 */}
        <Link
            href={`/liquor/${liquor.id}`}
            className="block relative isolate z-10 aspect-square overflow-hidden border-b border-[color:var(--catalog-hairline)] bg-[color:var(--catalog-surface)] cursor-pointer"
        >
          <Image
              src={liquor.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
              alt={liquor.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
              priority={prioritizeImage}
          />
          <div className="absolute left-3 top-3">
            <span
                className={`rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.2em] ${signal.className}`}
            >
              {signal.label}
            </span>
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-5">

          {/* 타이틀 영역 */}
          <Link
              href={`/liquor/${liquor.id}`}
              className="block transition-opacity duration-300 group-hover:opacity-80 cursor-pointer"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">
                {metaLine}
              </p>
              <span className="text-[10px] font-bold tracking-[0.08em] text-[color:var(--catalog-muted)]">
                {liquor.alcohol_percent > 0 ? `${liquor.alcohol_percent}%` : "--"}
              </span>
            </div>

            <h3 className="catalog-editorial text-[1.2rem] font-medium italic leading-snug tracking-[-0.01em] text-[color:var(--catalog-ink)]">
              {liquor.name}
            </h3>
          </Link>

          {/* 가격 및 판매처 */}
          <div className="mt-auto pt-4">
            <div className="flex items-end justify-between gap-3 border-t border-[color:var(--catalog-hairline)] pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--catalog-primary)]">
                  From
                </p>
                <p className="catalog-editorial mt-1.5 text-[1.4rem] font-medium italic leading-none text-[color:var(--catalog-primary)]">
                  {liquor.lowest_price > 0 ? formatPrice(liquor.lowest_price) : "가격 확인 중"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
                  Vendors
                </p>
                <p className="mt-1.5 text-[0.95rem] font-extrabold leading-none text-[color:var(--catalog-ink)]">
                  {sortedVendors.length}
                </p>
              </div>
            </div>

            <details className="catalog-details mt-3 md:hidden">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-[color:rgba(82,68,57,0.68)]">
                판매처
              </summary>
              <ul className="mt-3 space-y-2">
                {sortedVendors.map((vendor) => (
                    <li key={vendor.source}>
                      <a
                          href={vendor.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--catalog-bg-secondary)] px-3 py-2 text-sm transition hover:bg-[color:var(--catalog-bg-strong)]"
                      >
                        <span className="font-semibold text-[color:var(--catalog-ink)]">{vendor.source}</span>
                        <span className="flex items-center gap-2 text-right">
                      {vendor.original_price > vendor.current_price && (
                          <span className="text-xs text-[color:var(--catalog-soft)] line-through">
                          {formatPrice(vendor.original_price)}
                        </span>
                      )}
                          <span
                              className={`font-semibold ${
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

        {/* 데스크톱 호버 시 나타나는 판매처 목록 */}
        <div className="pointer-events-none absolute inset-0 z-20 hidden flex-col justify-end bg-[linear-gradient(180deg,rgba(24,22,18,0)_0%,rgba(24,22,18,0.78)_85%)] p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-[rgba(20,17,13,0.78)] p-4 backdrop-blur-md">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
              판매처
            </h4>
            <ul className="space-y-1.5">
              {sortedVendors.map((vendor) => (
                  <li key={vendor.source}>
                    <a
                        href={vendor.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
                    >
                      <span className="font-semibold text-white">{vendor.source}</span>
                      <span className="flex items-center gap-2 text-right">
                    {vendor.original_price > vendor.current_price && (
                        <span className="text-xs text-white/45 line-through">{formatPrice(vendor.original_price)}</span>
                    )}
                        <span
                            className={`font-semibold ${
                                bestVendor?.source === vendor.source ? "text-[color:var(--catalog-accent)]" : "text-white"
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
