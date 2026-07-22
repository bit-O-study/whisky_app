ㅇ/** 자매 서비스 홍보 배너 — 위스키다모아 홈. 양주를 뺀 나머지(IQ·헬쑤)를 노출. */
const OTHERS = [
  {
    emoji: "🧠",
    name: "IQ 테스트",
    desc: "멘사식 36문항 지능검사",
    url: "https://iq-test-fuyo-pi.vercel.app",
  },
  {
    emoji: "💪",
    name: "헬쑤",
    desc: "운동 루틴·식단 관리",
    url: "https://health-app-five-iota.vercel.app",
  },
];

export function PromoBanner() {
  return (
    <section className="mx-auto mt-16 w-full max-w-[96rem] px-5 sm:px-8">
      <p className="catalog-mono mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
        함께 해보세요
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {OTHERS.map((a) => (
          <a
            key={a.url}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] px-5 py-4 transition hover:opacity-90"
          >
            <span className="text-3xl" aria-hidden="true">
              {a.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[color:var(--catalog-primary)]">
                {a.name}
              </p>
              <p className="truncate text-xs text-[color:var(--catalog-muted)]">
                {a.desc}
              </p>
            </div>
            <span className="text-[color:var(--catalog-muted)]" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}