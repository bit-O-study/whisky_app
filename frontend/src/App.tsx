import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchLiquors } from "./api/liquorApi";
import { fetchRecommendations } from "./api/preferenceApi";
import PreferenceTest from "./components/PreferenceTest";
import FeaturedPick from "./components/FeaturedPick";
import LiquorGrid from "./components/LiquorGrid";
import TestLoadingPage from "./components/TestLoadingPage";
import TestResultPage from "./components/TestResultPage";
import type { GroupedLiquor, Liquor } from "./types/liquor";
import type { FlavorVector, PreferenceResult } from "./types/preference";
import { groupLiquors } from "./utils/groupLiquors";

type AppPage = "catalog" | "quiz" | "quiz-loading" | "quiz-result";

function buildFallbackResult(vector: FlavorVector, liquors: GroupedLiquor[]): PreferenceResult {
  const topDimensions = Object.entries(vector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key);

  const fallback = liquors
    .slice()
    .sort((a, b) => a.lowest_price - b.lowest_price)
    .slice(0, 5)
    .map((liquor, index) => {
      const bestVendor = liquor.vendors.reduce((a, b) => (a.current_price < b.current_price ? a : b));
      const normalized = Math.max(0.55, 0.85 - index * 0.06);
      return {
        liquor: {
          id: index,
          product_code: `${liquor.name}-${bestVendor.source}`,
          name: liquor.name,
          brand: liquor.brand,
          category: liquor.category,
          volume: liquor.volume,
          alcohol_percent: liquor.alcohol_percent,
          country: liquor.country,
          current_price: bestVendor.current_price,
          original_price: bestVendor.original_price,
          image_url: liquor.image_url,
          product_url: bestVendor.product_url,
          source: bestVendor.source,
        },
        similarity: normalized,
        reason: `선호하신 ${topDimensions[0]}·${topDimensions[1]} 무드와 가격 접근성을 함께 고려한 추천입니다.`,
      };
    });

  return {
    type_name: "Flavor Explorer",
    flavor_vector: vector,
    recommendations: fallback,
  };
}

export default function App() {
  const [page, setPage] = useState<AppPage>("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [liquors, setLiquors] = useState<Liquor[]>([]);
  const [liquorPage, setLiquorPage] = useState(0);
  const [hasNextLiquorPage, setHasNextLiquorPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<PreferenceResult | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setLiquorPage(0);
      setHasNextLiquorPage(true);
    }, 250);

    return () => {
      clearTimeout(timeoutId);
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
          setError("데이터를 불러오지 못했습니다. API 서버 상태를 확인해주세요.");
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

    load();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchQuery, liquorPage]);

  const loadMoreLiquors = useCallback(() => {
    if (page !== "catalog" || loading || loadingMore || !hasNextLiquorPage || error) {
      return;
    }

    setLiquorPage((current) => current + 1);
  }, [error, hasNextLiquorPage, loading, loadingMore, page]);

  useEffect(() => {
    if (page !== "catalog") {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreLiquors();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [loadMoreLiquors, page]);

  const groupedLiquors: GroupedLiquor[] = useMemo(() => groupLiquors(liquors), [liquors]);

  async function handleQuizSubmit(vector: FlavorVector) {
    setPage("quiz-loading");
    const controller = new AbortController();
    try {
      const result = await fetchRecommendations(vector, controller.signal);
      if (!result.recommendations.length) {
        setRecommendationResult(buildFallbackResult(vector, groupedLiquors));
      } else {
        setRecommendationResult(result);
      }
    } catch {
      setRecommendationResult(buildFallbackResult(vector, groupedLiquors));
    } finally {
      setPage("quiz-result");
    }
  }

  function goHome() {
    setPage("catalog");
    setSearchQuery("");
    setRecommendationResult(null);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goHome}
                className="flex items-center gap-3 cursor-pointer"
              >
              <span className="text-2xl">🥃</span>
              <h1 className="text-xl font-bold text-gray-900">Jururuk</h1>
            </button>
            <div className="flex items-center justify-end gap-3 w-full">
              {page === "catalog" && (
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="위스키 이름, 브랜드로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPage("quiz")}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow hover:from-amber-600 hover:to-orange-600 transition-colors"
              >
                나의 위스키 취향 찾기
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {page === "catalog" && (
          <>
            {!searchQuery && !loading && !error && <FeaturedPick liquors={groupedLiquors} />}
            {!searchQuery && !loading && !error && (
              <section className="mb-10 rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-white p-7 sm:p-8 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-700">Whisky Match</p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 leading-tight">90초만에, 지금 내 취향에 맞는 위스키 찾기</h2>
                <p className="mt-3 text-base sm:text-lg text-gray-600">10문항에 답하면 당신의 취향을 분석해 추천 5가지와 왜 잘 맞는지까지 한 번에 보여드려요.</p>
                <button
                  type="button"
                  onClick={() => setPage("quiz")}
                  className="mt-5 px-6 py-3.5 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 transition-colors"
                >
                  테스트 시작하기
                </button>
              </section>
            )}
            <LiquorGrid
              searchQuery={searchQuery}
              liquors={groupedLiquors}
              loading={loading}
              loadingMore={loadingMore}
              hasNext={hasNextLiquorPage}
              error={error}
              loadMoreRef={loadMoreRef}
            />
          </>
        )}

        {page === "quiz" && (
          <PreferenceTest
            onSubmit={handleQuizSubmit}
            onCancel={goHome}
          />
        )}

        {page === "quiz-loading" && <TestLoadingPage />}

        {page === "quiz-result" && recommendationResult && (
          <TestResultPage
            result={recommendationResult}
            onRetry={() => setPage("quiz")}
            onBackHome={goHome}
          />
        )}
      </main>
    </div>
  );
}
