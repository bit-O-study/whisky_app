"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/** 광고 배너 슬라이드(양주를 뺀 나머지 서비스). 자동 롤링. */
type Slide = {
  image: string;
  headline: string;
  sub: string;
  cta: string;
  url: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    image: "/promo/iq-test-photo.webp",
    headline: "내 아이큐 몇일까?",
    sub: "멘사식 36문항 정밀 지능검사",
    cta: "무료 테스트",
    url: "https://iq-test-fuyo-pi.vercel.app",
    accent: "text-indigo-200",
  },
  {
    image: "/promo/health-app.png",
    headline: "오늘 뭐 운동하지?",
    sub: "맞춤 루틴·식단·펫까지 무료 관리",
    cta: "헬쑤 시작",
    url: "https://health-app-five-iota.vercel.app",
    accent: "text-emerald-200",
  },
];

export function PromoBanner() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (SLIDES.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[i];
  return (
    <section className="relative" aria-label="함께하는 서비스">
      <a
        href={s.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${s.headline} — ${s.cta}`}
        className="group relative block min-h-[154px] overflow-hidden rounded-md bg-zinc-950 text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition active:scale-[0.995] sm:min-h-[174px]"
      >
        <Image src={s.image} alt="" fill priority sizes="(max-width: 1536px) 100vw, 1472px" className={`transition duration-700 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${i === 1 ? "object-contain object-right pr-5 sm:pr-12" : "object-cover"}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/5" />
        <div className="relative flex min-h-[154px] max-w-[72%] flex-col justify-center px-5 py-5 sm:min-h-[174px] sm:max-w-[66%] sm:px-7">
            <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${s.accent}`}>
              AD · 함께하는 서비스
            </p>
            <p className="mt-2 text-xl font-black leading-tight sm:text-2xl">
              {s.headline}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/75 sm:text-sm">{s.sub}</p>
            <span className="mt-3 inline-flex w-fit border-b border-white/70 pb-0.5 text-xs font-bold text-white sm:text-sm">
              {s.cta} <span aria-hidden="true" className="ml-1">→</span>
            </span>
        </div>
      </a>
      <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2" aria-label="광고 배너 선택">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.url}
            type="button"
            onClick={() => setI(idx)}
            aria-label={`${idx + 1}번 배너: ${slide.headline}`}
            aria-current={idx === i ? "true" : undefined}
            className={`h-2 w-2 rounded-full border border-white transition ${idx === i ? "bg-white" : "bg-transparent hover:bg-white/60"}`}
          />
        ))}
      </div>
    </section>
  );
}
