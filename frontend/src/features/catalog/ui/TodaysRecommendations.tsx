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
  if (!recommendations.length) return null;

  return (
    <section className="mx-auto max-w-[96rem] px-5 pt-12 sm:px-8 md:pt-20">
      <div className="mb-6 flex items-end justify-between">
        <span className="catalog-kicker">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--catalog-primary)]" />
          오늘의 추천
        </span>
        <span className="catalog-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
          BUY NOW
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-4">
        {recommendations.map((rec) => {
          const dropPct = Math.round(rec.dropRatio * 100);
          return (
            <li key={rec.liquor.id}>
              <Link
                href={`/liquor/${rec.liquor.id}`}
                className="group flex h-full gap-4 rounded-3xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] p-4 transition hover:border-[color:var(--catalog-outline-strong)] hover:shadow-[var(--catalog-shadow-md)]"
              >
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--catalog-bg-secondary)]">
                  <Image
                    src={rec.liquor.image_url || "/default.webp"}
                    alt={rec.liquor.name}
                    fill
                    sizes="96px"
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--catalog-primary)]">
                      역대 최저
                    </p>
                    <p className="mt-1 line-clamp-2 text-[0.95rem] font-semibold tracking-tight text-[color:var(--catalog-ink)]">
                      {rec.liquor.name}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-bold leading-tight text-[color:var(--catalog-ink)]">
                      {formatPrice(rec.allTimeLow)}
                    </p>
                    <p className="catalog-mono text-[10px] font-semibold tracking-[0.14em] text-[color:var(--catalog-soft)]">
                      7일 평균 {formatPrice(rec.sevenDayAvg)} ↓ {dropPct}%
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
