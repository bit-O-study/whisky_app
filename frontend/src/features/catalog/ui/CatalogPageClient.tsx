"use client";

import { useEffect, useRef, useState } from "react";
import { fetchCatalogPage } from "../api/catalog-client";
import {
  getCatalogLoadErrorMessage,
  mergeCatalogPageItems,
  shouldSkipInitialCatalogRequest,
  type CatalogPage,
  type CatalogCardItem,
} from "../model/catalog";
import LiquorGrid from "./LiquorGrid";

interface CatalogPageClientProps {
  initialError?: string | null;
  initialPage?: CatalogPage;
}

const EMPTY_CATALOG_PAGE: CatalogPage = {
  items: [],
  page: 0,
  size: 24,
  hasNext: false,
};

function formatCount(value: number) {
  return value.toLocaleString("ko-KR");
}

export default function CatalogPageClient({
  initialError = null,
  initialPage = EMPTY_CATALOG_PAGE,
}: CatalogPageClientProps) {
  const initialItemCount = initialPage.items.length;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [liquors, setLiquors] = useState<CatalogCardItem[]>(initialPage.items);
  const [liquorPage, setLiquorPage] = useState(initialPage.page);
  const [hasNextLiquorPage, setHasNextLiquorPage] = useState(initialPage.hasNext);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [reloadToken, setReloadToken] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const shouldSkipInitialRequestRef = useRef(initialPage.items.length > 0 && !initialError);

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

    if (
      shouldSkipInitialRequestRef.current &&
      shouldSkipInitialCatalogRequest({
        hasInitialItems: initialItemCount > 0,
        hasInitialError: Boolean(initialError),
        query: debouncedSearchQuery,
        page: liquorPage,
        initialPage: initialPage.page,
        reloadToken,
      })
    ) {
      shouldSkipInitialRequestRef.current = false;
      return () => {
        controller.abort();
      };
    }

    async function load() {
      try {
        if (liquorPage === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const data = await fetchCatalogPage({
          searchQuery: debouncedSearchQuery,
          page: liquorPage,
          size: 24,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setLiquors((previous) => mergeCatalogPageItems(previous, data, liquorPage));
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
          setError(getCatalogLoadErrorMessage(liquorPage));
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
  }, [debouncedSearchQuery, initialError, initialItemCount, initialPage.page, liquorPage, reloadToken]);

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

  const activeSearchQuery = debouncedSearchQuery.trim();
  const visibleBottleCount = liquors.length;

  function handleLogoClick() {
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
    <main className="catalog-shell min-h-screen pb-24 md:pb-20">
      <header className="catalog-glass sticky top-0 z-20 border-b border-[color:var(--catalog-hairline)]">
        <div className="mx-auto flex max-w-[96rem] flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <button
            type="button"
            onClick={handleLogoClick}
            className="catalog-editorial text-left text-[2rem] font-medium italic leading-none tracking-[-0.03em] text-[color:var(--catalog-ink)] transition-opacity hover:opacity-80"
            aria-label="위스키다모아"
            title="페이지 상단으로 이동"
          >
            위스키다모아
          </button>

          <div className="w-full lg:max-w-xs">
            <div className="relative group">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--catalog-soft)] transition-colors group-focus-within:text-[color:var(--catalog-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="위스키 이름, 브랜드로 검색..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-full border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] py-2.5 pl-10 pr-10 text-sm text-[color:var(--catalog-ink)] outline-none transition placeholder:text-[color:var(--catalog-soft)] focus:border-[color:var(--catalog-primary)] focus:ring-2 focus:ring-[color:var(--catalog-primary-soft)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--catalog-soft)] transition hover:text-[color:var(--catalog-ink)]"
                  aria-label="검색어 지우기"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[96rem] px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <p className="catalog-editorial text-[0.95rem] italic text-[color:var(--catalog-muted)]">
              Displaying{" "}
              <span className="font-semibold not-italic text-[color:var(--catalog-ink)]">
                {formatCount(visibleBottleCount)}
              </span>{" "}
              curated collectibles
            </p>
            {activeSearchQuery && (
              <p className="text-[0.85rem] text-[color:var(--catalog-muted)]">
                &quot;{activeSearchQuery}&quot; 검색 결과{" "}
                <span className="font-semibold text-[color:var(--catalog-ink)]">
                  {formatCount(visibleBottleCount)}
                </span>
                건
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--catalog-muted)]">
            <span>Sort</span>
            <button type="button" className="flex items-center gap-1 text-[color:var(--catalog-primary)]" disabled>
              Newest
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <LiquorGrid
            searchQuery={activeSearchQuery}
            liquors={liquors}
            loading={loading}
            loadingMore={loadingMore}
            hasNext={hasNextLiquorPage}
            error={error}
            onRetry={handleRetry}
            loadMoreRef={loadMoreRef}
          />
        </div>

        {!loading && !error && visibleBottleCount > 0 && !hasNextLiquorPage && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="h-px w-32 bg-[linear-gradient(90deg,transparent,var(--catalog-outline-strong),transparent)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--catalog-soft)]">
              End of records ({formatCount(visibleBottleCount)})
            </p>
          </div>
        )}

        <footer className="mt-16 rounded-2xl bg-[color:var(--catalog-bg-secondary)] px-6 py-10 ring-1 ring-[color:var(--catalog-outline)] sm:px-10">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm space-y-5">
              <p className="catalog-editorial text-3xl font-medium italic tracking-[-0.02em] text-[color:var(--catalog-ink)]">위스키다모아</p>
              <p className="text-sm leading-6 text-[color:var(--catalog-muted)]">
                국내 주요 쇼핑몰의 위스키 가격을 한눈에 비교하는 큐레이션 마켓. 매일 갱신되는 시세로 합리적인 선택을 돕습니다.
              </p>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-8 rounded-full bg-[color:var(--catalog-primary)]" />
                <span className="h-1.5 w-4 rounded-full bg-[color:var(--catalog-accent)]" />
              </div>
            </div>
            <div className="space-y-4">
              <p className="catalog-kicker">Legal</p>
              <ul className="space-y-2 text-sm text-[color:var(--catalog-muted)]">
                <li>Terms</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-[color:var(--catalog-hairline)] pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--catalog-soft)]">
              © 2026 위스키다모아 · 정보 제공 목적의 가격 데이터입니다.
            </p>
          </div>
        </footer>
      </section>

      <nav className="catalog-glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-[color:var(--catalog-hairline)] px-4 py-3 md:hidden">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--catalog-primary)]">Market</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">Search</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">Vault</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[color:var(--catalog-muted)]">Profile</span>
      </nav>
    </main>
  );
}
