"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchLiquors } from "../api/liquorApi";
import type { Liquor } from "../types/liquor";
import { groupLiquors } from "../utils/groupLiquors";
import LiquorGrid from "./LiquorGrid";

export default function CatalogPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [liquors, setLiquors] = useState<Liquor[]>([]);
  const [liquorPage, setLiquorPage] = useState(0);
  const [hasNextLiquorPage, setHasNextLiquorPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setLiquorPage(0);
      setHasNextLiquorPage(true);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        if (liquorPage === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const data = await fetchLiquors({
          searchQuery: debouncedSearchQuery,
          page: liquorPage,
          size: 24,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setLiquors((previous) => (liquorPage === 0 ? data.items : [...previous, ...data.items]));
          setHasNextLiquorPage(data.hasNext);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("데이터를 불러오지 못했습니다. Supabase 및 Next API 상태를 확인해주세요.");
          if (liquorPage === 0) {
            setLiquors([]);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          if (liquorPage === 0) {
            setLoading(false);
          }
          setLoadingMore(false);
        }
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchQuery, liquorPage]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !loading &&
          !loadingMore &&
          hasNextLiquorPage &&
          !error
        ) {
          setLiquorPage((current) => current + 1);
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [error, hasNextLiquorPage, loading, loadingMore]);

  const groupedLiquors = useMemo(() => groupLiquors(liquors), [liquors]);
  const vendorCount = useMemo(
    () => new Set(liquors.map((liquor) => liquor.source)).size,
    [liquors],
  );
  const isSearching = debouncedSearchQuery.trim().length > 0;

  function handleLogoClick() {
    setSearchQuery("");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  return (
    <main className="catalog-shell min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-white/55 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f2937,#7c2d12)] text-xl text-white shadow-[0_14px_28px_rgba(17,24,39,0.22)]">
              🥃
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-amber-700">
                Jururuk
              </p>
              <h1 className="text-xl font-bold text-stone-950">Whisky Catalog</h1>
            </div>
          </button>

          <div className="relative w-full sm:max-w-md">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="위스키 이름, 브랜드로 검색..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-[1.25rem] border border-amber-100/90 bg-white/92 py-3 pl-11 pr-11 text-sm text-stone-900 shadow-[0_14px_32px_rgba(15,23,42,0.08)] outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-700"
                aria-label="검색어 지우기"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div className="catalog-hero relative overflow-hidden rounded-[2rem] border border-amber-100/80 px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9">
          <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18),transparent_68%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-800">
                Curated Price Radar
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-stone-950 sm:text-4xl">
                판매처별 가격과 핵심 정보를 한 번에 비교하는 위스키 카탈로그
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                익숙했던 카탈로그 흐름을 기준으로 검색, 목록 탐색, 최저가 비교 경험을 다시 정리했습니다.
                브랜드와 제품명을 검색하면 현재 목록 안에서 바로 걸러 볼 수 있습니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="catalog-metric">
                <span className="catalog-metric-label">현재 표시</span>
                <strong className="catalog-metric-value">{groupedLiquors.length}</strong>
                <p className="catalog-metric-copy">중복 판매처를 묶은 카탈로그 기준</p>
              </div>
              <div className="catalog-metric">
                <span className="catalog-metric-label">판매처</span>
                <strong className="catalog-metric-value">{vendorCount || "-"}</strong>
                <p className="catalog-metric-copy">동일 상품의 가격 비교 가능</p>
              </div>
              <div className="catalog-metric">
                <span className="catalog-metric-label">탐색 방식</span>
                <strong className="catalog-metric-value text-2xl">Search</strong>
                <p className="catalog-metric-copy">스크롤로 다음 페이지 자동 로드</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/70 px-5 py-5 shadow-[0_20px_50px_rgba(148,163,184,0.12)] backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              {isSearching ? "Search Result" : "Catalog Overview"}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-stone-950">
              {isSearching ? "검색 결과를 바로 비교해보세요" : "지금 판매 중인 위스키를 둘러보세요"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {isSearching
                ? `"${debouncedSearchQuery}" 기준으로 필터링된 결과를 가격순으로 비교합니다.`
                : "카드에서 최저가를 먼저 확인하고, 마우스를 올리면 판매처별 가격을 볼 수 있습니다."}
            </p>
          </div>
          <div className="flex gap-2 text-xs text-stone-500 sm:justify-end">
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5">검색</span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5">최저가 비교</span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5">무한 스크롤</span>
          </div>
        </div>

        <LiquorGrid
          searchQuery={debouncedSearchQuery}
          liquors={groupedLiquors}
          loading={loading}
          loadingMore={loadingMore}
          hasNext={hasNextLiquorPage}
          error={error}
          loadMoreRef={loadMoreRef}
        />
      </section>
    </main>
  );
}
