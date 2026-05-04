"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCatalogPage } from "@/features/catalog/api/catalog-client";
import type { CatalogCardItem } from "@/features/catalog/model/catalog";

type Mode = "existing" | "new";

interface SubmitResult {
  ok: boolean;
  message: string;
  liquorId?: number;
}

const CATEGORY_OPTIONS = [
  "Whisky",
  "Brandy",
  "Vodka",
  "Gin",
  "Rum",
  "Tequila",
  "Liqueur",
  "Sake",
  "Red Wine",
  "White Wine",
  "Rose Wine",
  "Sparkling Wine",
  "Champagne",
  "Wine",
  "Other",
];

export default function ManualEntryPage() {
  const [mode, setMode] = useState<Mode>("existing");

  // existing-liquor flow
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CatalogCardItem[]>([]);
  const [picked, setPicked] = useState<CatalogCardItem | null>(null);

  // new-liquor flow
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("Whisky");
  const [newVolumeMl, setNewVolumeMl] = useState("");
  const [newAlcoholPercent, setNewAlcoholPercent] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // shared price fields
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
    if (mode !== "existing") {
      setResults([]);
      return;
    }
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
  }, [query, mode]);

  const effectiveSource = useMemo(() => {
    if (source === "_custom") return sourceCustom.trim().toUpperCase();
    return source;
  }, [source, sourceCustom]);

  function parsePositiveInt(value: string): number {
    return Number(value.replace(/[^0-9]/g, ""));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!effectiveSource) {
      setResult({ ok: false, message: "source를 입력하세요." });
      return;
    }
    const currentPriceNum = parsePositiveInt(currentPrice);
    if (!Number.isFinite(currentPriceNum) || currentPriceNum <= 0) {
      setResult({ ok: false, message: "현재가는 양의 숫자여야 합니다." });
      return;
    }
    const originalPriceNum = originalPrice ? parsePositiveInt(originalPrice) : currentPriceNum;
    if (!Number.isFinite(originalPriceNum) || originalPriceNum < currentPriceNum) {
      setResult({ ok: false, message: "정가는 현재가 이상이어야 합니다." });
      return;
    }

    const payload: Record<string, unknown> = {
      source: effectiveSource,
      currentPrice: currentPriceNum,
      originalPrice: originalPriceNum,
      productUrl: productUrl.trim() || null,
    };

    if (mode === "existing") {
      if (!picked) {
        setResult({ ok: false, message: "주류를 먼저 선택하세요." });
        return;
      }
      payload.liquorId = picked.id;
    } else {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        setResult({ ok: false, message: "주류명을 입력하세요." });
        return;
      }
      const volumeMlNum = newVolumeMl ? parsePositiveInt(newVolumeMl) : null;
      const alcoholNum = newAlcoholPercent ? Number(newAlcoholPercent) : null;
      payload.newLiquor = {
        name: trimmedName,
        brand: newBrand.trim() || undefined,
        category: newCategory || undefined,
        volumeMl: volumeMlNum && volumeMlNum > 0 ? volumeMlNum : undefined,
        alcoholPercent: alcoholNum != null && Number.isFinite(alcoholNum) ? alcoholNum : undefined,
        country: newCountry.trim() || undefined,
        imageUrl: newImageUrl.trim() || undefined,
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/liquors/manual-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string; detail?: string; liquorId?: number; liquorAction?: string };
      if (!res.ok) {
        const head = data.message ?? `저장 실패 (${res.status})`;
        const detail = data.detail ? ` — ${data.detail}` : "";
        setResult({ ok: false, message: `${head}${detail}` });
      } else {
        const label =
          mode === "new"
            ? `${newName.trim()} (신규 등록 #${data.liquorId})`
            : picked
              ? picked.name
              : `liquor ${data.liquorId}`;
        setResult({
          ok: true,
          message: `저장 완료: ${label} · ${effectiveSource} · ${currentPriceNum.toLocaleString()}원`,
          liquorId: data.liquorId,
        });
        setCurrentPrice("");
        setOriginalPrice("");
        setProductUrl("");
        if (mode === "new") {
          setNewName("");
          setNewBrand("");
          setNewVolumeMl("");
          setNewAlcoholPercent("");
          setNewCountry("");
          setNewImageUrl("");
        }
      }
    } catch (error) {
      setResult({ ok: false, message: (error as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled =
    submitting ||
    (mode === "existing" && !picked) ||
    (mode === "new" && !newName.trim());

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">수동 가격 입력</h1>

      <div
        role="tablist"
        aria-label="등록 방식"
        className="mb-6 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1"
      >
        {(
          [
            { key: "existing", label: "기존 주류에 가격 추가" },
            { key: "new", label: "신규 주류 등록" },
          ] as const
        ).map((tab) => {
          const active = mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(tab.key);
                setResult(null);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {mode === "existing" ? (
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
          {query.trim().length >= 2 && !searching && results.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              결과 없음.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setMode("new");
                  setNewName(query.trim());
                  setResult(null);
                }}
              >
                &quot;{query.trim()}&quot; 신규 등록으로 가기
              </button>
            </p>
          ) : null}
        </section>
      ) : (
        <section className="mb-6 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">주류명 (필수)</label>
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="예: 산토리 가쿠빈 700ml"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">브랜드</label>
              <input
                type="text"
                value={newBrand}
                onChange={(event) => setNewBrand(event.target.value)}
                placeholder="예: 산토리"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">카테고리</label>
              <select
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {CATEGORY_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">용량 (ml)</label>
              <input
                type="text"
                inputMode="numeric"
                value={newVolumeMl}
                onChange={(event) => setNewVolumeMl(event.target.value)}
                placeholder="700"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">도수 (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={newAlcoholPercent}
                onChange={(event) => setNewAlcoholPercent(event.target.value)}
                placeholder="40"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">국가</label>
              <input
                type="text"
                value={newCountry}
                onChange={(event) => setNewCountry(event.target.value)}
                placeholder="일본"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">이미지 URL (선택)</label>
            <input
              type="url"
              value={newImageUrl}
              onChange={(event) => setNewImageUrl(event.target.value)}
              placeholder="https://…"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </section>
      )}

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
          disabled={submitDisabled}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "저장 중…" : mode === "new" ? "신규 등록 + 가격 저장" : "가격 저장"}
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
