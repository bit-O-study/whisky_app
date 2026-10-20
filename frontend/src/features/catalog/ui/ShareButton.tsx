"use client";

import { useState } from "react";

/** 상세 상단 공유 — 휴대폰 공유창이 있으면 열고, 없으면 주소를 복사한다. */
export default function ShareButton({ title }: { title: string }) {
    const [copied, setCopied] = useState(false);

    const share = async () => {
        const url = window.location.href;
        try {
            if (typeof navigator.share === "function") {
                await navigator.share({ title, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // 사용자가 공유창을 닫은 경우 등 — 아무것도 하지 않는다
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={share}
                aria-label="공유하기"
                className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--catalog-ink)] transition hover:bg-[color:var(--catalog-bg-secondary)]"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3v12" />
                    <path d="M7 8l5-5 5 5" />
                    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
                </svg>
            </button>
            {copied && (
                <span role="status" className="absolute right-0 top-12 whitespace-nowrap rounded-lg bg-[color:var(--catalog-ink)] px-3 py-1.5 text-xs font-semibold text-white">
                    주소를 복사했어요
                </span>
            )}
        </div>
    );
}
