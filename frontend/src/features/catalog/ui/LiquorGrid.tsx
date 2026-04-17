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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LOADING_PLACEHOLDERS.map((placeholder) => (
          <article
            key={placeholder}
            className="overflow-hidden rounded-xl bg-[rgba(255,255,255,0.84)] p-3 shadow-[0_14px_32px_rgba(28,28,23,0.05)] ring-1 ring-[color:rgba(216,195,180,0.24)]"
          >
            <div className="aspect-square animate-pulse rounded bg-[linear-gradient(180deg,rgba(236,232,223,0.95),rgba(247,243,234,0.95))]" />
            <div className="space-y-3 px-2 pb-2 pt-4">
              <div className="h-3 w-28 animate-pulse rounded-full bg-[rgba(216,195,180,0.55)]" />
              <div className="h-8 w-5/6 animate-pulse rounded-full bg-[rgba(216,195,180,0.45)]" />
              <div className="rounded-lg bg-[rgba(247,243,234,0.88)] p-4">
                <div className="h-3 w-16 animate-pulse rounded-full bg-[rgba(169,98,66,0.24)]" />
                <div className="mt-3 h-8 w-32 animate-pulse rounded-full bg-[rgba(216,195,180,0.45)]" />
              </div>
            </div>
          </article>
        ))}
      </section>
    );
  }

  if (error && liquors.length === 0) {
    return (
      <div className="catalog-panel rounded-[2rem] px-6 py-16 text-center ring-1 ring-[color:rgba(216,195,180,0.34)] sm:px-10">
        <span className="catalog-kicker">Catalog Error</span>
        <h2 className="catalog-editorial mt-4 text-4xl font-semibold italic leading-tight tracking-[-0.03em] text-[color:var(--catalog-ink)]">
          The archive failed to settle.
        </h2>
        <p className="mt-4 text-base leading-7 text-[color:var(--catalog-muted)]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-full bg-[linear-gradient(135deg,var(--catalog-primary),var(--catalog-primary-strong))] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(139,74,44,0.22)] transition hover:brightness-105"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (liquors.length === 0) {
    return (
      <div className="catalog-panel flex flex-col items-center justify-center rounded-[2rem] px-6 py-16 text-center ring-1 ring-[color:rgba(216,195,180,0.34)] sm:px-10">
        <svg className="mb-5 h-16 w-16 text-[color:var(--catalog-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <p className="catalog-editorial mt-4 text-4xl font-semibold italic leading-tight tracking-[-0.03em] text-[color:var(--catalog-ink)]">
              &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다
            </p>
            <p className="mt-4 text-sm leading-6 text-[color:var(--catalog-muted)]">다른 검색어로 시도해보세요</p>
          </>
        ) : (
          <>
            <p className="catalog-editorial mt-4 text-4xl font-semibold italic leading-tight tracking-[-0.03em] text-[color:var(--catalog-ink)]">
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
        <div className="catalog-panel mb-5 flex flex-col gap-3 rounded-[1.5rem] px-4 py-4 text-sm text-[color:var(--catalog-ink)] ring-1 ring-[color:rgba(216,195,180,0.34)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="catalog-kicker">Partial Load Warning</span>
            <p className="mt-2">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-full bg-[linear-gradient(135deg,var(--catalog-primary),var(--catalog-primary-strong))] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(139,74,44,0.2)] transition hover:brightness-105"
          >
            다시 시도
          </button>
        </div>
      )}
      <LiquorCardList liquors={liquors} />
      {hasNext && <div ref={loadMoreRef} className="h-10" aria-hidden="true" />}
      {loadingMore && (
        <div className="py-10 text-center">
          <div className="mx-auto h-px w-36 bg-[linear-gradient(90deg,transparent,rgba(216,195,180,0.8),transparent)]" />
          <p className="catalog-kicker mt-4">Loading More Records</p>
          <p className="mt-2 text-sm text-[color:var(--catalog-muted)]">더 불러오는 중...</p>
        </div>
      )}
    </>
  );
}
