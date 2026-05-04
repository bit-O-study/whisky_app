import Image from "next/image";
import Link from "next/link";
import type { TodaysRecommendation } from "../api/catalog-server";

interface Props {
  recommendations: TodaysRecommendation[];
}

function formatPrice(value: number) {
  return value.toLocaleString("ko-KR") + "원";
}

export default function TodaysRecommendations({ recommendations }: Props) {
  const rec = recommendations[0];
  if (!rec) return null;

  const dropPct = Math.round(rec.dropRatio * 100);

  return (
    <aside className="w-full md:w-[24rem] md:shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <span className="catalog-kicker">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--catalog-primary)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--catalog-primary)]" />
          </span>
          오늘의 추천
        </span>
        <span className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">
          ↓ {dropPct}% TODAY
        </span>
      </div>

      <Link
        href={`/liquor/${rec.liquor.id}`}
        className="group relative block overflow-hidden rounded-[2rem] border border-[color:var(--catalog-outline)] bg-gradient-to-br from-[color:var(--catalog-surface)] to-[color:var(--catalog-bg-secondary)] shadow-[var(--catalog-shadow-md)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--catalog-primary)] hover:shadow-[var(--catalog-shadow-lg)]"
      >
        {/* Image area */}
        <div className="relative aspect-square w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[color:var(--catalog-surface)] opacity-90" />
          <Image
            src={rec.liquor.image_url || "/default.webp"}
            alt={rec.liquor.name}
            fill
            sizes="(max-width: 768px) 100vw, 24rem"
            className="object-contain p-8 transition-transform duration-700 group-hover:scale-110"
          />

          {/* Top-left badge */}
          <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-[color:var(--catalog-ink)] px-3 py-1.5 text-white shadow-[var(--catalog-shadow-md)]">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5z" />
            </svg>
            <span className="catalog-mono text-[10px] font-bold uppercase tracking-[0.18em]">역대 최저</span>
          </div>

          {/* Top-right discount chip */}
          <div className="absolute right-5 top-5 rounded-2xl bg-[color:var(--catalog-primary)] px-3 py-2 text-white shadow-[var(--catalog-shadow-md)]">
            <p className="text-[1.1rem] font-bold leading-none tracking-tight">↓{dropPct}%</p>
          </div>
        </div>

        {/* Info area */}
        <div className="relative -mt-2 px-6 pb-6">
          <p className="line-clamp-2 text-[1.1rem] font-bold leading-snug tracking-tight text-[color:var(--catalog-ink)]">
            {rec.liquor.name}
          </p>
          {rec.liquor.brand ? (
            <p className="mt-1 catalog-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">
              {rec.liquor.brand}
            </p>
          ) : null}

          <div className="mt-5 flex items-end gap-3">
            <p className="text-[1.9rem] font-bold leading-none tracking-tight text-[color:var(--catalog-ink)]">
              {formatPrice(rec.allTimeLow)}
            </p>
            <p className="catalog-mono text-[12px] leading-none text-[color:var(--catalog-soft)] line-through">
              {formatPrice(rec.sevenDayAvg)}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[color:var(--catalog-hairline)] pt-4">
            <span className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--catalog-primary)]">
              상세 보기
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--catalog-primary-soft)] text-[color:var(--catalog-primary)] transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[color:var(--catalog-primary)] group-hover:text-white">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </aside>
  );
}
