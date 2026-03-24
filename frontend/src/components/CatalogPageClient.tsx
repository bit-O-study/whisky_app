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

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Jururuk</p>
            <h1 className="text-xl font-bold text-gray-900">Whisky Catalog</h1>
          </div>
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="위스키 이름, 브랜드로 검색..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-2xl border border-amber-100 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-stone-50 px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="mb-3 text-sm font-medium text-amber-700">Next.js + Supabase Catalog</p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-gray-900">
            판매처별 가격을 한 화면에서 비교하는 주류 카탈로그
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Spring 조회 API 대신 Next.js 내부 API와 Supabase 조회 계층을 기준으로 목록과 검색 흐름을 재구성했습니다.
          </p>
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
