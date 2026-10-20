"use client";

import { useEffect, useId, useState } from "react";
import { REPORT_REASONS, type ReportReason } from "../model/liquor-report";

interface Props {
    liquorId: number;
    liquorName: string;
    vendors: { source: string; label: string }[];
}

type Status = "idle" | "sending" | "sent" | "error";

const SENT_KEY = (liquorId: number) => `liquor-report-sent:${liquorId}`;

/** 상세 판매처 목록 아래 "알려 주기" — 다른 상품이 열리거나 가격이 다를 때 사용자가 바로 알린다. */
export default function ReportIssueButton({ liquorId, liquorName, vendors }: Props) {
    const titleId = useId();
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState<string | null>(vendors[0]?.source ?? null);
    const [reason, setReason] = useState<ReportReason>("wrong_product");
    const [status, setStatus] = useState<Status>("idle");

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const submit = async () => {
        setStatus("sending");
        try {
            const response = await fetch(`/api/liquors/${liquorId}/report`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ source, reason }),
            });
            if (!response.ok) throw new Error(String(response.status));
            try {
                window.localStorage.setItem(SENT_KEY(liquorId), String(Date.now()));
            } catch {
                // 저장소를 못 써도 신고는 이미 보냈다
            }
            setStatus("sent");
        } catch {
            setStatus("error");
        }
    };

    const openSheet = () => {
        let sentRecently = false;
        try {
            const at = Number(window.localStorage.getItem(SENT_KEY(liquorId)));
            sentRecently = Number.isFinite(at) && Date.now() - at < 86_400_000;
        } catch {
            sentRecently = false;
        }
        setStatus(sentRecently ? "sent" : "idle");
        setOpen(true);
    };

    return (
        <>
            <button
                type="button"
                onClick={openSheet}
                className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[color:var(--catalog-outline-strong)] px-4 py-3 text-left text-sm text-[color:var(--catalog-muted)] transition hover:border-[color:var(--catalog-primary)]"
                data-testid="report-open"
            >
                <span>가격이 다르거나 다른 상품이 열리나요?</span>
                <span className="shrink-0 font-bold text-[color:var(--catalog-primary)]">알려 주기</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="presentation">
                    <button type="button" aria-label="닫기" className="absolute inset-0 bg-[rgba(16,27,54,0.4)]" onClick={() => setOpen(false)} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className="relative w-full max-w-md rounded-t-3xl bg-[color:var(--catalog-surface)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[var(--catalog-shadow-lg)] sm:rounded-3xl sm:pb-5"
                        data-testid="report-sheet"
                    >
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color:var(--catalog-outline-strong)] sm:hidden" />
                        {status === "sent" ? (
                            <div className="space-y-3 py-4 text-center" data-testid="report-sent">
                                <p id={titleId} className="text-base font-bold text-[color:var(--catalog-ink)]">알려 주셔서 고마워요</p>
                                <p className="text-sm text-[color:var(--catalog-muted)]">확인한 뒤 가격과 링크를 고칠게요.</p>
                                <button type="button" className="catalog-btn catalog-btn-pop w-full" onClick={() => setOpen(false)} autoFocus>
                                    닫기
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p id={titleId} className="text-base font-bold text-[color:var(--catalog-ink)]">어떤 문제가 있나요?</p>
                                    <p className="mt-0.5 truncate text-xs text-[color:var(--catalog-muted)]">{liquorName}</p>
                                </div>

                                {vendors.length > 0 && (
                                    <fieldset>
                                        <legend className="mb-2 text-xs font-semibold text-[color:var(--catalog-muted)]">판매처</legend>
                                        <div className="flex flex-wrap gap-1.5">
                                            {vendors.map((v) => (
                                                <label
                                                    key={v.source}
                                                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                                        source === v.source
                                                            ? "border-[color:var(--catalog-primary)] bg-[color:var(--catalog-primary)] text-white"
                                                            : "border-[color:var(--catalog-outline-strong)] text-[color:var(--catalog-ink)]"
                                                    }`}
                                                >
                                                    <input type="radio" name="report-source" className="sr-only" checked={source === v.source} onChange={() => setSource(v.source)} />
                                                    {v.label}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                )}

                                <fieldset>
                                    <legend className="mb-2 text-xs font-semibold text-[color:var(--catalog-muted)]">문제</legend>
                                    <div className="grid gap-1.5">
                                        {(Object.keys(REPORT_REASONS) as ReportReason[]).map((key) => (
                                            <label
                                                key={key}
                                                className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
                                                    reason === key
                                                        ? "border-[color:var(--catalog-primary)] bg-[color:var(--catalog-primary-soft)] text-[color:var(--catalog-primary-strong)]"
                                                        : "border-[color:var(--catalog-outline-strong)] text-[color:var(--catalog-ink)]"
                                                }`}
                                            >
                                                <input type="radio" name="report-reason" className="sr-only" checked={reason === key} onChange={() => setReason(key)} />
                                                {REPORT_REASONS[key]}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>

                                {status === "error" && (
                                    <p className="text-sm font-semibold text-[#b42318]" role="alert">보내지 못했어요. 잠시 후 다시 눌러 주세요.</p>
                                )}
                                <button
                                    type="button"
                                    className="catalog-btn catalog-btn-pop w-full disabled:opacity-60"
                                    onClick={submit}
                                    disabled={status === "sending"}
                                    data-testid="report-submit"
                                >
                                    {status === "sending" ? "보내는 중" : "보내기"}
                                </button>
                                <p className="text-center text-xs text-[color:var(--catalog-soft)]">로그인 없이 보내요. 이름이나 연락처는 남지 않아요.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
