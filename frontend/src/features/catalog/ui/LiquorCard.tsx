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

function formatSpecLine(liquor: CatalogCardItem) {
  const parts: string[] = [];

  if (liquor.country && liquor.country !== "Unknown") {
    parts.push(liquor.country);
  }
  if (liquor.alcohol_percent > 0) {
    parts.push(`${liquor.alcohol_percent}%`);
  }
  if (liquor.volume > 0) {
    parts.push(`${liquor.volume}ml`);
  }

  return parts.length > 0 ? parts.join(" · ") : "상세 정보 준비 중";
}

interface LiquorCardProps {
  liquor: CatalogCardItem;
  prioritizeImage?: boolean;
}

export default function LiquorCard({ liquor, prioritizeImage = false }: LiquorCardProps) {
  const sortedVendors = liquor.vendors.slice().sort((a, b) => a.current_price - b.current_price);
  const bestVendor = sortedVendors[0];
  const lowestPriceLabel = liquor.lowest_price > 0 ? formatPrice(liquor.lowest_price) : "가격 확인 중";
  const specLine = formatSpecLine(liquor);

  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/75 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(15,23,42,0.16)]">
      <div className="absolute inset-x-5 top-5 z-10 flex items-start justify-between gap-3">
        <span className="rounded-full border border-white/80 bg-white/86 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600 shadow-sm backdrop-blur-sm">
          {liquor.category}
        </span>
        <span className="rounded-full bg-stone-950/88 px-3 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
          판매처 {sortedVendors.length}곳
        </span>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        <Image
          src={liquor.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
          alt={liquor.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          unoptimized
          priority={prioritizeImage}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-950/28 via-stone-950/8 to-transparent" />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
          {liquor.brand} · {liquor.category}
          </p>
          <h3 className="text-xl font-bold leading-tight text-stone-950">
          {liquor.name}
          </h3>
          <p className="mt-2 text-sm text-stone-500">
          {specLine}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/80">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Lowest Price</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-2xl font-black text-amber-600">{lowestPriceLabel}</p>
            {bestVendor && <p className="text-xs font-medium text-stone-500">{bestVendor.source} 기준</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-stone-500">
          <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-stone-200/70">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-stone-400">Origin</span>
            <strong className="mt-1 block text-sm text-stone-800">
              {formatMetaValue(liquor.country, "정보 준비 중")}
            </strong>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-stone-200/70">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-stone-400">ABV / Vol</span>
            <strong className="mt-1 block text-sm text-stone-800">
              {liquor.alcohol_percent > 0 ? `${liquor.alcohol_percent}%` : "도수 확인 중"}
              {liquor.volume > 0 ? ` · ${liquor.volume}ml` : ""}
            </strong>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-[linear-gradient(180deg,rgba(12,10,9,0.04),rgba(12,10,9,0.82))] p-4 opacity-0 backdrop-blur-[2px] transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:pointer-events-auto">
        <div className="rounded-[1.4rem] border border-white/12 bg-black/34 p-4 backdrop-blur-md">
          <h4 className="mb-3 text-sm font-bold text-white">판매처별 가격</h4>
          <ul className="space-y-2">
            {sortedVendors.map((v) => (
              <li key={v.source}>
                <a
                  href={v.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 transition-colors hover:bg-white/20"
                >
                  <span className="text-sm font-medium text-white">
                    {v.source}
                  </span>
                  <span className="flex items-center gap-2">
                    {v.original_price > v.current_price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(v.original_price)}
                      </span>
                    )}
                    <span
                      className={`text-sm font-bold ${
                        v.current_price === liquor.lowest_price && liquor.lowest_price > 0
                          ? "text-amber-400"
                          : "text-white"
                      }`}
                    >
                      {v.current_price > 0 ? formatPrice(v.current_price) : "가격 확인 중"}
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
