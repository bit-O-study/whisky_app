import { memo } from "react";
import Image from "next/image";
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
      className: "bg-[rgba(139,74,44,0.92)] text-white",
    };
  }

  if (liquor.lowest_price >= 150000) {
    return {
      label: "Rare",
      className: "bg-[rgba(194,93,43,0.92)] text-white",
    };
  }

  if (liquor.alcohol_percent >= 46) {
    return {
      label: "Bold",
      className: "bg-[rgba(115,92,0,0.92)] text-white",
    };
  }

  return {
    label: "Listed",
    className: "bg-[rgba(82,68,57,0.82)] text-white",
  };
}

interface LiquorCardProps {
  liquor: CatalogCardItem;
  prioritizeImage?: boolean;
}

function LiquorCard({ liquor, prioritizeImage = false }: LiquorCardProps) {
  const vendors = liquor.vendors;
  const bestVendor = vendors[0];
  const signal = getCardSignal(liquor);
  const metaLine = [liquor.brand, formatMetaValue(liquor.country, "Archive")]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-[rgba(255,255,255,0.84)] shadow-[0_14px_32px_rgba(28,28,23,0.05)] ring-1 ring-[color:rgba(216,195,180,0.24)]">
      <div className="relative aspect-square overflow-hidden border-b border-[color:rgba(216,195,180,0.16)] bg-white">
        <Image
          src={liquor.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
          alt={liquor.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="h-full w-full object-contain p-4 transition-transform duration-300 ease-out md:group-hover:scale-[1.02]"
          unoptimized
          priority={prioritizeImage}
        />
        <div className="absolute left-2 top-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.18em] ${signal.className}`}
          >
            {signal.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-muted)]">
            {metaLine}
          </p>
          <span className="text-[9px] font-bold text-[color:var(--catalog-muted)]">
            {liquor.alcohol_percent > 0 ? `${liquor.alcohol_percent}%` : "--"}
          </span>
        </div>

        <h3 className="catalog-editorial text-[1.15rem] font-medium italic leading-tight tracking-[-0.015em] text-[color:var(--catalog-ink)]">
          {liquor.name}
        </h3>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-3 border-t border-[color:rgba(216,195,180,0.16)] pt-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[color:var(--catalog-primary)]">
                From
              </p>
              <p className="catalog-editorial mt-1 text-[1.3rem] font-medium italic leading-none text-[color:var(--catalog-primary)]">
                {liquor.lowest_price > 0 ? formatPrice(liquor.lowest_price) : "가격 확인 중"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">
                Vendors
              </p>
              <p className="mt-1 text-sm font-extrabold leading-none text-[color:var(--catalog-ink)]">
                {vendors.length}
              </p>
            </div>
          </div>

          <details className="catalog-details mt-2 md:hidden">
            <summary className="cursor-pointer text-[9px] font-bold uppercase tracking-[0.18em] text-[color:rgba(82,68,57,0.68)]">
              판매처
            </summary>
            <ul className="mt-3 space-y-2">
              {vendors.map((vendor) => (
                <li key={vendor.source}>
                  <a
                    href={vendor.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg bg-[rgba(247,243,234,0.88)] px-3 py-2 text-sm transition hover:bg-[rgba(241,238,229,0.98)]"
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-2 p-4 opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 md:flex md:pointer-events-auto">
        <div className="w-full rounded-[1.15rem] border border-white/14 bg-[linear-gradient(180deg,rgba(31,24,19,0.86),rgba(22,17,13,0.94))] p-4 shadow-[0_18px_38px_rgba(20,15,12,0.2)]">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/92">
            판매처
          </h4>
          <ul className="space-y-2">
            {vendors.map((vendor) => (
              <li key={vendor.source}>
                <a
                  href={vendor.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/8 px-3 py-2 text-sm transition-colors duration-150 hover:bg-white/14"
                >
                  <span className="font-semibold text-white">{vendor.source}</span>
                  <span className="flex items-center gap-2 text-right">
                    {vendor.original_price > vendor.current_price && (
                      <span className="text-xs text-white/45 line-through">{formatPrice(vendor.original_price)}</span>
                    )}
                    <span
                      className={`font-semibold ${
                        bestVendor?.source === vendor.source ? "text-[#fed65b]" : "text-white"
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

const MemoizedLiquorCard = memo(LiquorCard);

MemoizedLiquorCard.displayName = "LiquorCard";

export default MemoizedLiquorCard;
