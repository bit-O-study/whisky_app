import { memo, type RefObject } from "react";
import type { CatalogCardItem } from "../model/catalog";
import LiquorCard from "./LiquorCard";
import { AppLoading } from "@/shared/ui/AppLoading";

interface LiquorGridProps {
  searchQuery: string;
  liquors: CatalogCardItem[];
  loading: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  error: string | null;
  onRetry: () => void;
  loadMoreRef: RefObject<HTMLDivElement | null>;
}

interface LiquorCardListProps {
  liquors: CatalogCardItem[];
}

const LiquorCardList = memo(function LiquorCardList({ liquors }: LiquorCardListProps) {
  return (
    <div className="compare-list">
      {liquors.map((liquor, index) => (
        <LiquorCard
          key={`${liquor.id}-${liquor.product_code || liquor.name}`}
          liquor={liquor}
          prioritizeImage={index === 0}
        />
      ))}
    </div>
  );
});

export default function LiquorGrid({
  searchQuery,
  liquors,
  loading,
  loadingMore,
  hasNext,
  error,
  onRetry,
  loadMoreRef,
}: LiquorGridProps) {
  if (loading) {
    return <AppLoading variant="list" label={searchQuery ? "검색 결과를 불러오고 있어요" : "상품과 가격을 불러오고 있어요"} />;
  }

  if (error && liquors.length === 0) {
    return (
      <div className="catalog-panel rounded-3xl px-6 py-16 text-center sm:px-10">
        <span className="catalog-kicker">불러오기 실패</span>
        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.02em] text-[color:var(--catalog-ink)] md:text-4xl">
          데이터를 불러오지 못했습니다
        </h2>
        <p className="mt-4 text-base leading-7 text-[color:var(--catalog-muted)]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="catalog-btn catalog-btn-pop mt-6"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (liquors.length === 0) {
    return (
      <div className="catalog-panel flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center sm:px-10">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--catalog-bg-secondary)]">
          <svg className="h-6 w-6 text-[color:var(--catalog-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className="catalog-kicker">검색 결과</span>
        {searchQuery ? (
          <>
            <p className="mt-4 text-3xl font-bold leading-tight tracking-[-0.02em] text-[color:var(--catalog-ink)] md:text-4xl">
              &quot;{searchQuery}&quot; 결과가 없습니다
            </p>
            <p className="mt-4 text-base leading-7 text-[color:var(--catalog-muted)]">다른 검색어를 시도해보세요</p>
          </>
        ) : (
          <>
            <p className="mt-4 text-3xl font-bold leading-tight tracking-[-0.02em] text-[color:var(--catalog-ink)] md:text-4xl">
              표시할 데이터가 없습니다
            </p>
            <p className="mt-4 text-base leading-7 text-[color:var(--catalog-muted)]">
              잠시 후 다시 시도해주세요
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {error && liquors.length > 0 && (
        <div className="catalog-panel mb-5 flex flex-col gap-3 rounded-2xl px-5 py-4 text-sm text-[color:var(--catalog-ink)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="catalog-kicker">일부만 불러옴</span>
            <p className="mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-full bg-[color:var(--catalog-ink)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black"
          >
            다시 시도
          </button>
        </div>
      )}
      <LiquorCardList liquors={liquors} />
      {hasNext && <div ref={loadMoreRef} className="h-10" aria-hidden="true" />}
      {loadingMore && <AppLoading variant="more" label="상품을 더 불러오고 있어요" />}
    </>
  );
}
