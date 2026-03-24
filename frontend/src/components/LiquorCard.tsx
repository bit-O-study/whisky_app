import Image from "next/image";
import type { GroupedLiquor } from "../types/liquor";

function normalizePrice(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatPrice(price: number) {
  const normalized = normalizePrice(price);
  return normalized.toLocaleString("ko-KR") + "원";
}

export default function LiquorCard({ liquor }: { liquor: GroupedLiquor }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-transform hover:scale-[1.02] hover:shadow-xl">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={liquor.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
          alt={liquor.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">
          {liquor.brand} · {liquor.category}
        </p>
        <h3 className="font-bold text-gray-900 leading-tight mb-1">
          {liquor.name}
        </h3>
        <p className="text-xs text-gray-400 mb-2">
          {liquor.country} · {liquor.alcohol_percent}% · {liquor.volume}ml
        </p>
        <p className="text-lg font-extrabold text-amber-600">
          {formatPrice(liquor.lowest_price)}
          <span className="text-xs font-normal text-gray-400 ml-1">최저가</span>
        </p>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-black/70 p-4 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <h4 className="mb-3 text-sm font-bold text-white">판매처별 가격</h4>
        <ul className="space-y-2">
          {liquor.vendors
            .sort((a, b) => a.current_price - b.current_price)
            .map((v) => (
              <li key={v.source}>
                <a
                  href={v.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 transition-colors hover:bg-white/20"
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
                        v.current_price === liquor.lowest_price
                          ? "text-amber-400"
                          : "text-white"
                      }`}
                    >
                      {formatPrice(v.current_price)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
