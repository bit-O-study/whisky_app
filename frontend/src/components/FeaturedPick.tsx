import type { GroupedLiquor } from "../types/liquor";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

function getBestDeal(liquors: GroupedLiquor[]): GroupedLiquor | null {
  // 할인율이 가장 높은 상품 선택
  let best: GroupedLiquor | null = null;
  let bestDiscount = 0;

  for (const g of liquors) {
    for (const v of g.vendors) {
      if (v.original_price > v.current_price) {
        const discount = (v.original_price - v.current_price) / v.original_price;
        if (discount > bestDiscount) {
          bestDiscount = discount;
          best = g;
        }
      }
    }
  }

  return best;
}

interface FeaturedPickProps {
  liquors: GroupedLiquor[];
}

export default function FeaturedPick({ liquors }: FeaturedPickProps) {
  const pick = getBestDeal(liquors);

  if (!pick) return null;

  const bestVendor = pick.vendors.reduce((a, b) =>
    a.current_price < b.current_price ? a : b
  );
  const discountPercent = Math.round(
    ((bestVendor.original_price - bestVendor.current_price) /
      bestVendor.original_price) *
      100
  );

  return (
    <div className="mb-10 -mx-4 sm:-mx-0">
      <div className="relative overflow-hidden sm:rounded-3xl h-56 sm:h-72">
        {/* 배경 이미지 */}
        <img
          src={pick.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm"
        />
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

        {/* 컨텐츠 */}
        <div className="relative h-full flex items-center px-6 sm:px-10 gap-6 sm:gap-10">
          {/* 상품 이미지 */}
          <div className="shrink-0 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden bg-white/10 ring-1 ring-white/20 shadow-2xl -mb-4">
            <img
              src={pick.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
              alt={pick.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-sm font-bold text-amber-300 bg-amber-500/20 backdrop-blur-sm px-3 py-1 rounded-full ring-1 ring-amber-400/30">
                🔥 오늘의 추천
              </span>
              <span className="text-sm font-extrabold text-white bg-red-500/90 px-3 py-1 rounded-full">
                {discountPercent}% OFF
              </span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-lg">
              {pick.name}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {pick.brand} · {pick.category} · {pick.country}
            </p>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl sm:text-5xl font-black text-amber-400 drop-shadow-lg">
                {formatPrice(pick.lowest_price)}
              </span>
              <span className="text-base sm:text-lg text-gray-400 line-through">
                {formatPrice(bestVendor.original_price)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {bestVendor.source} 기준 최저가
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
