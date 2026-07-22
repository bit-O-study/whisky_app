"use client";

import { useEffect, useState } from "react";

/** 광고 배너 슬라이드(양주를 뺀 나머지 서비스). 자동 롤링 · 직사각형 배너. */
type Slide = {
  emoji: string;
  headline: string;
  sub: string;
  cta: string;
  url: string;
  grad: string;
};

const SLIDES: Slide[] = [
  {
    emoji: "🧠",
    headline: "내 아이큐 몇일까?",
    sub: "멘사식 36문항 정밀 지능검사",
    cta: "무료 테스트",
    url: "https://iq-test-fuyo-pi.vercel.app",
    grad: "from-indigo-500 to-violet-600",
  },
  {
    emoji: "💪",
    headline: "오늘 뭐 운동하지?",
    sub: "맞춤 루틴·식단·펫까지 무료 관리",
    cta: "헬쑤 시작",
    url: "https://health-app-five-iota.vercel.app",
    grad: "from-emerald-500 to-teal-600",
  },
];

export function PromoBanner() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (SLIDES.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[i];
  return (
    <section className="mx-auto mt-16 w-full max-w-[96rem] px-5 sm:px-8">
      <a
        href={s.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block overflow-hidden rounded-2xl bg-gradient-to-br ${s.grad} p-5 text-white shadow-lg transition active:scale-[0.99] sm:p-6`}
      >
        <div className="flex min-h-[112px] items-center gap-4 sm:min-h-[128px]">
          <span
            className="shrink-0 text-6xl drop-shadow-sm sm:text-7xl"
            aria-hidden="true"
          >
            {s.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              AD · 함께하는 서비스
            </p>
            <p className="mt-1 text-xl font-black leading-tight sm:text-2xl">
              {s.headline}
            </p>
            <p className="mt-1 text-sm text-white/85">{s.sub}</p>
            <span className="mt-3 inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-bold text-zinc-900">
              {s.cta} →
            </span>
          </div>
        </div>
        <div className="absolute bottom-3 right-4 flex gap-1">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </a>
    </section>
  );
}