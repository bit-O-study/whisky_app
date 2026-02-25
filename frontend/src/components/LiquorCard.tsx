import { useState } from "react";
import type { GroupedLiquor } from "../types/liquor";

function normalizePrice(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatPrice(price: number) {
  const normalized = normalizePrice(price);
  return normalized.toLocaleString("ko-KR") + "원";
}

export default function LiquorCard({ liquor }: { liquor: GroupedLiquor }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative bg-white rounded-2xl shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={liquor.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
          alt={liquor.name}
          className="w-full h-full object-cover"
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

      {/* 호버 오버레이 */}
      {hovered && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-4 transition-opacity">
          <h4 className="text-white font-bold text-sm mb-3">판매처별 가격</h4>
          <ul className="space-y-2">
            {liquor.vendors
              .sort((a, b) => a.current_price - b.current_price)
              .map((v) => (
                <li key={v.source}>
                  <a
                    href={v.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    <span className="text-white text-sm font-medium">
                      {v.source}
                    </span>
                    <span className="flex items-center gap-2">
                      {v.original_price > v.current_price && (
                        <span className="text-gray-400 text-xs line-through">
                          {formatPrice(v.original_price)}
                        </span>
                      )}
                      <span
                        className={`font-bold text-sm ${
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
      )}
    </div>
  );
}
