"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLiquors } from "../api/liquorApi";
import LiquorGrid from "./LiquorGrid";
import type { GroupedLiquor, Liquor } from "../types/liquor";
import { groupLiquors } from "../utils/groupLiquors";

export default function CatalogPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [liquors, setLiquors] = useState<Liquor[]>([]);
  const [liquorPage, setLiquorPage] = useState(0);
  const [hasNextLiquorPage, setHasNextLiquorPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
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
          setError(null);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          console.error("Failed to load catalog page", {
            liquorPage,
            searchQuery: debouncedSearchQuery,
            loadError,
          });
          setError(
            liquorPage === 0
              ? "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
              : "추가 목록을 불러오지 못했습니다. 다시 시도해주세요.",
          );
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
  }, [debouncedSearchQuery, liquorPage, reloadToken]);

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

  const groupedLiquors: GroupedLiquor[] = groupLiquors(liquors);
  function handleLogoClick() {
    setSearchQuery("");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  function handleRetry() {
    setError(null);
    if (liquorPage === 0) {
      setReloadToken((current) => current + 1);
      return;
    }

    setLoadingMore(true);
    setReloadToken((current) => current + 1);
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
            <span className="text-xl font-bold text-stone-950">Jururuk</span>
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
        <LiquorGrid
          searchQuery={debouncedSearchQuery}
          liquors={groupedLiquors}
          loading={loading}
          loadingMore={loadingMore}
          hasNext={hasNextLiquorPage}
          error={error}
          onRetry={handleRetry}
          loadMoreRef={loadMoreRef}
        />
      </section>
    </main>
  );
}
