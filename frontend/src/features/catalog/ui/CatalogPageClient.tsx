"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchCatalogPage } from "../api/catalog-client";
import { PromoBanner } from "./PromoBanner";
import type { FlavorAxis, SourceKey, TodaysRecommendation } from "../api/catalog-server";
import {
  getCatalogLoadErrorMessage,
  mergeCatalogPageItems,
  shouldSkipInitialCatalogRequest,
  type CatalogPage,
  type CatalogCardItem,
} from "../model/catalog";
import FlavorRecommendations from "./FlavorRecommendations";
import LiquorGrid from "./LiquorGrid";
import SourceRecommendations from "./SourceRecommendations";
import TodaysRecommendations from "./TodaysRecommendations";

import CatalogFilters from "./CatalogFilters";
import { EMPTY_FILTERS, filterCatalog } from "../model/catalog-filters";

type SortKey = "oldest" | "newest" | "popular" | "lowest" | "highest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "oldest", label: "기본" },
  { key: "newest", label: "최신순" },
  { key: "popular", label: "인기순" },
  { key: "lowest", label: "가격낮은순" },
  { key: "highest", label: "가격높은순" },
];

interface CatalogPageClientProps {
  initialError?: string | null;
  initialPage?: CatalogPage;
  recommendations?: TodaysRecommendation[];
  sourceRecommendations?: Record<SourceKey, CatalogCardItem[]>;
  flavorRecommendations?: Record<FlavorAxis, CatalogCardItem[]>;
}

const EMPTY_SOURCE_RECS: Record<SourceKey, CatalogCardItem[]> = {
  LOTTEON: [],
  EMART: [],
  EMART_TRADERS: [],
  COSTCO: [],
};

const EMPTY_FLAVOR_RECS: Record<FlavorAxis, CatalogCardItem[]> = {
  sweet: [],
  smoky: [],
  fruity: [],
  body: [],
};

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
  recommendations = [],
  sourceRecommendations = EMPTY_SOURCE_RECS,
  flavorRecommendations = EMPTY_FLAVOR_RECS,
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
  const [sortKey, setSortKey] = useState<SortKey>("oldest");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const shouldSkipInitialRequestRef = useRef(initialPage.items.length > 0 && !initialError);

  useEffect(() => {
    if (searchQuery === debouncedSearchQuery) return;
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setLiquorPage(0);
      setHasNextLiquorPage(true);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, debouncedSearchQuery]);

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
          size: initialPage.size || 500,
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
  }, [debouncedSearchQuery, initialError, initialItemCount, initialPage.page, initialPage.size, liquorPage, reloadToken]);

  // 정렬은 순수 클라이언트에서 sortedLiquors useMemo 만으로 처리.
  // SSR이 양주 전체(size=500)를 한 번에 가져오므로 페이지를 자동으로 더 진행할 필요가 없다.
  // (예전에는 client refetch가 size=24로 잘려 hasNext=true가 되며 cascade가 발생했다.)

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
      { rootMargin: "100px 0px" },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [error, hasNextLiquorPage, loading, loadingMore, liquorPage, liquors.length, filters]);

  const activeSearchQuery = debouncedSearchQuery.trim();
  const filteredLiquors = useMemo(() => filterCatalog(liquors, filters), [liquors, filters]);
  const visibleBottleCount = filteredLiquors.length;

  // 정렬은 클라이언트에서 처리 (서버는 항상 updated_at desc로 내려옴 = newest 기본).
  // 가격 0(미수집)은 정렬 끝으로 밀어서 진짜 가격 있는 상품이 먼저 보이게.
  // popular = view_count(0.7) + vendor 수(0.3) 정규화 합산. 둘 다 max 기준으로 정규화해
  // 한쪽 값이 폭주해도 비율이 무너지지 않게 한다. 같은 점수면 최저가 낮은 순으로 결정.
  const sortedLiquors = useMemo(() => {
    if (sortKey === "oldest") return filteredLiquors;
    const arr = filteredLiquors.slice();
    if (sortKey === "newest") {
      arr.reverse();
      return arr;
    }
    if (sortKey === "popular") {
      const maxView = Math.max(1, ...arr.map((item) => item.view_count ?? 0));
      const maxVendor = Math.max(1, ...arr.map((item) => item.vendors?.length ?? 0));
      const score = (item: CatalogCardItem) => {
        const view = (item.view_count ?? 0) / maxView;
        const vendor = (item.vendors?.length ?? 0) / maxVendor;
        return view * 0.7 + vendor * 0.3;
      };
      arr.sort((a, b) => {
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        const ap = a.lowest_price > 0 ? a.lowest_price : Number.POSITIVE_INFINITY;
        const bp = b.lowest_price > 0 ? b.lowest_price : Number.POSITIVE_INFINITY;
        return ap - bp;
      });
    } else if (sortKey === "lowest") {
      arr.sort((a, b) => {
        const ap = a.lowest_price > 0 ? a.lowest_price : Number.POSITIVE_INFINITY;
        const bp = b.lowest_price > 0 ? b.lowest_price : Number.POSITIVE_INFINITY;
        return ap - bp;
      });
    } else {
      arr.sort((a, b) => {
        const ap = a.lowest_price > 0 ? a.lowest_price : Number.NEGATIVE_INFINITY;
        const bp = b.lowest_price > 0 ? b.lowest_price : Number.NEGATIVE_INFINITY;
        return bp - ap;
      });
    }
    return arr;
  }, [filteredLiquors, sortKey]);

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
    <main className="catalog-shell compare-shell">
      <header className="compare-header"><div className="compare-container header-inner">
        <Link href="/" className="compare-brand" aria-label="위스키다모아"><Image src="/branding/app-icon-v2.png" alt="" width={40} height={40} className="rounded-xl" priority />위스키다모아</Link>
        <div className="compare-search"><label className="sr-only" htmlFor="catalog-search">위스키 · 브랜드 검색</label><span aria-hidden="true">⌕</span><input id="catalog-search" type="search" placeholder="위스키 · 브랜드 검색" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />{searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="검색어 지우기">×</button>}</div>
      </div></header>
      <div className="compare-container"><PromoBanner />
        <section className="compare-intro"><div><p className="compare-eyebrow">WHISKY PRICE INDEX</p><h1>위스키 가격, 빠르게 비교하세요</h1><p>여러 판매처의 가격을 한눈에. 좋은 위스키를 더 현명하게.</p></div><span>좋은 선택이<br />좋은 시간으로 이어지니까.</span></section>
        <div className="compare-layout"><CatalogFilters items={liquors} value={filters} onChange={setFilters} />
          <section className="compare-results" aria-label="상품 목록">
            <div className="compare-toolbar"><div aria-live="polite"><strong>{error && !liquors.length ? "상품을 불러오지 못했어요" : loading ? "상품 불러오는 중" : "전체 상품 " + formatCount(visibleBottleCount) + "개"}</strong>{activeSearchQuery && <p>&quot;{activeSearchQuery}&quot; 검색</p>}</div>
              <label>정렬 <select aria-label="정렬" value={sortKey} onChange={event => setSortKey(event.target.value as SortKey)}>{SORT_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
            </div>
            <p className="compare-disclaimer">가격은 판매처에서 최종 확인하세요. 용량과 구매 조건에 따라 달라질 수 있습니다.</p>
            {!loading && !error && liquors.length > 0 && sortedLiquors.length === 0 ? <div className="compare-empty"><h2>선택한 조건에 맞는 상품이 없습니다</h2><button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>필터 초기화</button>{hasNextLiquorPage && <button type="button" disabled={loadingMore} onClick={() => setLiquorPage(page => page + 1)}>{loadingMore ? "불러오는 중" : "다음 상품 불러오기"}</button>}</div> : <LiquorGrid searchQuery={activeSearchQuery} liquors={sortedLiquors} loading={loading} loadingMore={loadingMore} hasNext={hasNextLiquorPage} error={error} onRetry={handleRetry} loadMoreRef={loadMoreRef} />}
            {!loading && !error && visibleBottleCount > 0 && !hasNextLiquorPage && <p className="compare-end">모든 상품을 확인했습니다 · {formatCount(visibleBottleCount)}개</p>}
          </section>
        </div>
        {(recommendations.length > 0 || Object.values(sourceRecommendations).some(items => items.length) || Object.values(flavorRecommendations).some(items => items.length)) && <details className="compare-recommendations"><summary>다른 위스키도 둘러보기</summary><SourceRecommendations recommendations={sourceRecommendations} /><FlavorRecommendations recommendations={flavorRecommendations} /><TodaysRecommendations recommendations={recommendations} /></details>}
        <footer className="compare-footer"><strong>위스키다모아</strong><p>판매처별 가격을 한곳에서 비교하세요.</p><span>© 2026 위스키다모아 · 정보 제공 목적의 가격 데이터</span></footer>
      </div>
    </main>
  );
}
