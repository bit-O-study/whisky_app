import { memo, type RefObject } from "react";
import type { CatalogCardItem } from "../model/catalog";
import LiquorCard from "./LiquorCard";

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

const LOADING_PLACEHOLDERS = Array.from({ length: 8 }, (_, index) => index);

interface LiquorCardListProps {
  liquors: CatalogCardItem[];
}

const LiquorCardList = memo(function LiquorCardList({ liquors }: LiquorCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    return (
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {LOADING_PLACEHOLDERS.map((placeholder) => (
          <article
            key={placeholder}
            className="overflow-hidden rounded-2xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)]"
          >
            <div className="aspect-[4/5] animate-pulse bg-[color:var(--catalog-bg-strong)]" />
            <div className="space-y-3 p-5">
              <div className="h-2.5 w-32 animate-pulse rounded-full bg-[color:var(--catalog-bg-strong)]" />
              <div className="h-6 w-5/6 animate-pulse rounded-full bg-[color:var(--catalog-bg-secondary)]" />
              <div className="mt-4 flex items-end justify-between border-t border-[color:var(--catalog-hairline)] pt-4">
                <div className="space-y-2">
                  <div className="h-2.5 w-12 animate-pulse rounded-full bg-[color:var(--catalog-primary-soft)]" />
                  <div className="h-5 w-24 animate-pulse rounded-full bg-[color:var(--catalog-bg-strong)]" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="ml-auto h-2.5 w-14 animate-pulse rounded-full bg-[color:var(--catalog-bg-strong)]" />
                  <div className="ml-auto h-4 w-6 animate-pulse rounded-full bg-[color:var(--catalog-bg-secondary)]" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    );
  }

  if (error && liquors.length === 0) {
    return (
      <div className="catalog-panel rounded-[2rem] px-6 py-16 text-center sm:px-10">
        <span className="catalog-kicker">Catalog Error</span>
        <h2 className="catalog-editorial mt-4 text-4xl font-medium italic leading-tight tracking-[-0.02em] text-[color:var(--catalog-ink)]">
          데이터를 불러오지 못했습니다
        </h2>
        <p className="mt-4 text-base leading-7 text-[color:var(--catalog-muted)]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-full bg-[color:var(--catalog-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--catalog-primary-strong)]"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (liquors.length === 0) {
    return (
      <div className="catalog-panel flex flex-col items-center justify-center rounded-[2rem] px-6 py-16 text-center sm:px-10">
        <svg className="mb-5 h-12 w-12 text-[color:var(--catalog-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="catalog-kicker">No Matching Labels</span>
        {searchQuery ? (
          <>
            <p className="catalog-editorial mt-4 text-3xl font-medium italic leading-tight tracking-[-0.02em] text-[color:var(--catalog-ink)] md:text-4xl">
              &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다
            </p>
            <p className="mt-4 text-sm leading-6 text-[color:var(--catalog-muted)]">다른 검색어로 시도해보세요</p>
          </>
        ) : (
          <>
            <p className="catalog-editorial mt-4 text-3xl font-medium italic leading-tight tracking-[-0.02em] text-[color:var(--catalog-ink)] md:text-4xl">
              아직 표시할 주류 데이터가 없습니다
            </p>
            <p className="mt-4 text-sm leading-6 text-[color:var(--catalog-muted)]">
              잠시 후 다시 시도하거나 다른 환경에서 재확인해주세요
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {error && liquors.length > 0 && (
        <div className="catalog-panel mb-5 flex flex-col gap-3 rounded-2xl px-4 py-4 text-sm text-[color:var(--catalog-ink)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="catalog-kicker">Partial Load Warning</span>
            <p className="mt-2">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-full bg-[color:var(--catalog-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--catalog-primary-strong)]"
          >
            다시 시도
          </button>
        </div>
      )}
      <LiquorCardList liquors={liquors} />
      {hasNext && <div ref={loadMoreRef} className="h-10" aria-hidden="true" />}
      {loadingMore && (
        <div className="py-10 text-center">
          <div className="mx-auto h-px w-36 bg-[linear-gradient(90deg,transparent,var(--catalog-outline-strong),transparent)]" />
          <p className="catalog-kicker mt-4">Loading More Records</p>
          <p className="mt-2 text-sm text-[color:var(--catalog-muted)]">더 불러오는 중...</p>
        </div>
      )}
    </>
  );
}
