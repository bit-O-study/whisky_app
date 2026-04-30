"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCatalogPage } from "@/features/catalog/api/catalog-client";
import type { CatalogCardItem } from "@/features/catalog/model/catalog";

interface SubmitResult {
  ok: boolean;
  message: string;
  liquorId?: number;
}

export default function ManualEntryPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CatalogCardItem[]>([]);
  const [picked, setPicked] = useState<CatalogCardItem | null>(null);

  const [sources, setSources] = useState<string[]>([]);
  const [source, setSource] = useState("EMART_TRADERS");
  const [sourceCustom, setSourceCustom] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/liquors/manual-price")
      .then((res) => (res.ok ? res.json() : { sources: [] }))
      .then((data: { sources?: string[] }) => {
        if (cancelled) return;
        if (Array.isArray(data.sources) && data.sources.length > 0) {
          setSources(data.sources);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const page = await fetchCatalogPage({ searchQuery: trimmed, page: 0, size: 12, signal: controller.signal });
        setResults(page.items);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const effectiveSource = useMemo(() => {
    if (source === "_custom") return sourceCustom.trim().toUpperCase();
    return source;
  }, [source, sourceCustom]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!picked) {
      setResult({ ok: false, message: "주류를 먼저 선택하세요." });
      return;
    }
    if (!effectiveSource) {
      setResult({ ok: false, message: "source를 입력하세요." });
      return;
    }
    const currentPriceNum = Number(currentPrice.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(currentPriceNum) || currentPriceNum <= 0) {
      setResult({ ok: false, message: "현재가는 양의 숫자여야 합니다." });
      return;
    }
    const originalPriceNum = originalPrice
      ? Number(originalPrice.replace(/[^0-9]/g, ""))
      : currentPriceNum;
    if (!Number.isFinite(originalPriceNum) || originalPriceNum < currentPriceNum) {
      setResult({ ok: false, message: "정가는 현재가 이상이어야 합니다." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/liquors/manual-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liquorId: picked.id,
          source: effectiveSource,
          currentPrice: currentPriceNum,
          originalPrice: originalPriceNum,
          productUrl: productUrl.trim() || null,
        }),
      });
      const data = (await res.json()) as { message?: string; detail?: string };
      if (!res.ok) {
        const head = data.message ?? `저장 실패 (${res.status})`;
        const detail = data.detail ? ` — ${data.detail}` : "";
        setResult({ ok: false, message: `${head}${detail}` });
      } else {
        setResult({
          ok: true,
          message: `저장 완료: ${picked.name} · ${effectiveSource} · ${currentPriceNum.toLocaleString()}원`,
          liquorId: picked.id,
        });
        setCurrentPrice("");
        setOriginalPrice("");
        setProductUrl("");
      }
    } catch (error) {
      setResult({ ok: false, message: (error as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">수동 가격 입력</h1>

      <section className="mb-6">
        <label className="mb-1 block text-sm font-medium">주류 검색</label>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름·브랜드 (2자 이상)"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        {searching ? <p className="mt-2 text-sm text-gray-500">검색 중…</p> : null}
        {results.length > 0 ? (
          <ul className="mt-2 max-h-64 overflow-y-auto rounded border border-gray-200">
            {results.map((item) => {
              const isPicked = picked?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(item)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      isPicked ? "bg-blue-50 font-medium" : ""
                    }`}
                  >
                    <span className="truncate">
                      <span className="text-gray-500">[{item.brand || "-"}]</span> {item.name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {item.volume ? `${item.volume}ml` : ""} · #{item.id}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {picked ? (
          <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm">
            선택됨: <strong>{picked.name}</strong> ({picked.brand}) · liquorId={picked.id}
          </p>
        ) : null}
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Source</label>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {sources.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
            <option value="_custom">직접 입력…</option>
          </select>
          {source === "_custom" ? (
            <input
              type="text"
              value={sourceCustom}
              onChange={(event) => setSourceCustom(event.target.value)}
              placeholder="예: EMART_TRADERS_GOYANG"
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 uppercase"
            />
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">현재가 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={currentPrice}
              onChange={(event) => setCurrentPrice(event.target.value)}
              placeholder="필수"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">정가 (선택)</label>
            <input
              type="text"
              inputMode="numeric"
              value={originalPrice}
              onChange={(event) => setOriginalPrice(event.target.value)}
              placeholder="비우면 현재가와 동일"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">상품 URL (선택)</label>
          <input
            type="url"
            value={productUrl}
            onChange={(event) => setProductUrl(event.target.value)}
            placeholder="https://…"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !picked}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "저장 중…" : "저장"}
        </button>
      </form>

      {result ? (
        <div
          role="status"
          className={`mt-4 rounded px-3 py-2 text-sm ${
            result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          <p>{result.message}</p>
          {result.ok && result.liquorId ? (
            <a
              href={`/liquor/${result.liquorId}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs underline"
            >
              상품 페이지에서 vendor 확인 →
            </a>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
