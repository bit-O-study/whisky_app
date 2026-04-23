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
        <div className="mx-auto flex max-w-[96rem] flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={handleLogoClick}
            className="group flex items-center gap-2.5 text-left transition-opacity hover:opacity-90"
            aria-label="위스키다모아"
            title="페이지 상단으로 이동"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--catalog-primary)] shadow-[0_0_12px_rgba(200,161,88,0.6)]" />
            <span className="catalog-editorial text-[1.85rem] font-medium italic leading-none tracking-[-0.025em] text-[color:var(--catalog-ink)]">
              위스키다모아
            </span>
          </button>

          <div className="w-full lg:max-w-md">
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
                placeholder="위스키 · 브랜드 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-full border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] py-2.5 pl-11 pr-10 text-sm text-[color:var(--catalog-ink)] outline-none transition placeholder:text-[color:var(--catalog-soft)] focus:border-[color:var(--catalog-primary)] focus:ring-2 focus:ring-[color:var(--catalog-primary-soft)]"
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

      {/* HERO band */}
      <section className="mx-auto max-w-[96rem] px-5 pt-16 sm:px-8 md:pt-24">
        <p className="catalog-kicker">CURATED MARKET INDEX · 2026</p>
        <h1 className="mt-5 catalog-editorial text-[2.5rem] font-medium italic leading-[1.05] tracking-[-0.025em] text-[color:var(--catalog-ink)] sm:text-[3.4rem] md:text-[4.2rem]">
          오늘 가장 합리적인<br />
          <span className="text-[color:var(--catalog-primary)]">한 병</span>의 가격.
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-[color:var(--catalog-muted)] md:text-base md:leading-8">
          국내 주요 쇼핑몰의 위스키 가격을 매일 갱신해 한눈에 비교합니다.<br className="hidden md:block" />
          최저가 · 판매처 · 시세 변동을 디지털 셀러에 정리해 드립니다.
        </p>
      </section>

      <section className="mx-auto max-w-[96rem] px-5 pt-16 sm:px-8 md:pt-20">
        <div className="mb-8 flex flex-col gap-3 border-t border-[color:var(--catalog-hairline)] pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="catalog-mono text-[2rem] font-bold leading-none text-[color:var(--catalog-ink)]">
              {formatCount(visibleBottleCount)}
            </span>
            <div>
              <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-primary)]">
                Bottles Indexed
              </p>
              {activeSearchQuery && (
                <p className="mt-0.5 text-xs text-[color:var(--catalog-muted)]">
                  &quot;{activeSearchQuery}&quot; 검색 결과
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-muted)]">
            <span>Sort</span>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] px-3 py-1.5 text-[color:var(--catalog-primary)]"
              disabled
            >
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

        <footer className="mt-20 rounded-2xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] px-6 py-10 sm:px-10">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--catalog-primary)] shadow-[0_0_12px_rgba(200,161,88,0.6)]" />
                <p className="catalog-editorial text-2xl font-medium italic tracking-[-0.02em] text-[color:var(--catalog-ink)]">
                  위스키다모아
                </p>
              </div>
              <p className="text-sm leading-7 text-[color:var(--catalog-muted)]">
                국내 주요 쇼핑몰의 위스키 가격을 매일 갱신해 비교하는 큐레이션 인덱스. 합리적인 시세 선택을 돕습니다.
              </p>
            </div>
            <div className="space-y-4">
              <p className="catalog-kicker">Legal</p>
              <ul className="space-y-2 text-sm text-[color:var(--catalog-ink-soft)]">
                <li className="transition hover:text-[color:var(--catalog-primary)]">Terms</li>
                <li className="transition hover:text-[color:var(--catalog-primary)]">Privacy</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-[color:var(--catalog-hairline)] pt-6">
            <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--catalog-soft)]">
              © 2026 위스키다모아 · 정보 제공 목적의 가격 데이터
            </p>
          </div>
        </footer>
      </section>

      <nav className="catalog-glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-[color:var(--catalog-hairline)] px-4 py-3 md:hidden">
        <span className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-primary)]">Market</span>
        <span className="catalog-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--catalog-muted)]">Search</span>
        <span className="catalog-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--catalog-muted)]">Vault</span>
        <span className="catalog-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--catalog-muted)]">Profile</span>
      </nav>
    </main>
  );
}
