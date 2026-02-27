import type { PreferenceResult } from "../types/preference";
import type { FlavorDimension } from "../types/preference";
import FlavorRadarChart from "./FlavorRadarChart";

interface TestResultPageProps {
  result: PreferenceResult;
  onRetry: () => void;
  onBackHome: () => void;
}

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

const FLAVOR_LABELS: Record<FlavorDimension, string> = {
  sweet: "Sweet",
  smoky: "Smoky",
  fruity: "Fruity",
  spicy: "Spicy",
  woody: "Woody",
  body: "Body",
};

function SimilarityRing({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (circumference * percent) / 100;

  return (
    <div className="relative inline-flex items-center justify-center w-14 h-14 shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#292524" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-amber-400">{percent}</span>
    </div>
  );
}

export default function TestResultPage({ result, onRetry, onBackHome }: TestResultPageProps) {
  return (
    <section className="space-y-10 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-stone-900 text-white shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative px-6 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-amber-400/90">
            Your Taste Profile
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            {result.type_name}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-stone-400 leading-relaxed">
            당신의 향미 성향을 분석해 가장 잘 어울리는 위스키를 골랐어요.
          </p>

          <div className="mt-8 grid md:grid-cols-[320px_1fr] gap-8 items-center">
            <div className="mx-auto md:mx-0">
              <FlavorRadarChart vector={result.flavor_vector} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.entries(result.flavor_vector) as [FlavorDimension, number][]).map(
                ([key, value]) => {
                  const ratio = Math.min(value / 100, 1);
                  return (
                    <div
                      key={key}
                      className="rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-4 py-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                        {FLAVOR_LABELS[key]}
                      </p>
                      <p className="mt-1 text-xl font-extrabold tabular-nums text-white">
                        {value.toFixed(1)}
                      </p>
                      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-white text-stone-900 text-sm font-bold hover:bg-stone-100 transition-colors"
            >
              다시 테스트하기
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-stone-300 text-sm font-medium hover:bg-white/[0.06] transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              맞춤 추천 Top 5
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              향미 유사도와 가격을 함께 고려해 선정했어요.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {result.recommendations.map((item, index) => (
            <article
              key={`${item.liquor.product_code}-${item.liquor.source}`}
              className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="absolute top-3 left-3 z-[2] flex items-center justify-center w-8 h-8 rounded-full bg-stone-900/80 backdrop-blur-sm text-white text-xs font-bold shadow-lg">
                {index + 1}
              </div>

              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <img
                  src={item.liquor.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
                  alt={item.liquor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <div className="flex flex-col flex-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  {item.liquor.brand} · {item.liquor.category}
                </p>
                <h4 className="mt-1.5 text-base font-extrabold text-gray-900 leading-snug line-clamp-2">
                  {item.liquor.name}
                </h4>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
                  {item.reason}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                      최저가
                    </p>
                    <p className="mt-0.5 text-lg font-black text-amber-600 tabular-nums truncate">
                      {formatPrice(item.liquor.current_price)}
                    </p>
                  </div>
                  <SimilarityRing value={item.similarity} />
                </div>

                <a
                  href={item.liquor.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center w-full rounded-xl bg-stone-900 text-white text-sm font-semibold py-3 hover:bg-stone-800 active:scale-[0.98] transition-all duration-200"
                >
                  {item.liquor.source}에서 보기
                  <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          type="button"
          onClick={onRetry}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-md hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200"
        >
          취향 테스트 다시 하기
        </button>
        <button
          type="button"
          onClick={onBackHome}
          className="w-full sm:w-auto px-8 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
        >
          전체 위스키 둘러보기
        </button>
      </div>
    </section>
  );
}
