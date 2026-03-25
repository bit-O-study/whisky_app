import type { RefObject } from "react";
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
      <div className="rounded-[1.75rem] border border-white/70 bg-white/65 py-20 text-center text-stone-500 shadow-[0_18px_45px_rgba(148,163,184,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Loading Catalog</p>
        <p className="mt-3 text-lg font-medium">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error && liquors.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-red-100 bg-white/75 py-20 text-center text-red-500 shadow-[0_18px_45px_rgba(248,113,113,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">Catalog Error</p>
        <p className="mt-3 text-lg font-medium">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (liquors.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-stone-200 bg-white/65 py-20 text-stone-400 shadow-[0_18px_45px_rgba(148,163,184,0.08)]">
          <svg className="mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
          </svg>
        <p className="text-lg font-medium">&quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다</p>
        <p className="mt-1 text-sm">다른 검색어로 시도해보세요</p>
      </div>
    );
  }

  return (
    <>
      {error && liquors.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-white/80 px-4 py-3 text-sm text-red-500 shadow-[0_12px_30px_rgba(248,113,113,0.08)]">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      )}
      {searchQuery && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-100/80 bg-white/72 px-4 py-3 text-sm text-stone-500 shadow-[0_12px_30px_rgba(148,163,184,0.10)]">
          <p>
            &quot;{searchQuery}&quot; 검색 결과: <span className="font-semibold text-stone-800">현재 {liquors.length}개 표시</span>
          </p>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Filtered
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {liquors.map((l, index) => (
          <LiquorCard key={l.name} liquor={l} prioritizeImage={index === 0} />
        ))}
      </div>
      {hasNext && <div ref={loadMoreRef} className="h-10" aria-hidden="true" />}
      {loadingMore && (
        <div className="py-8 text-center text-sm text-stone-500">
          더 불러오는 중...
        </div>
      )}
    </>
  );
}
