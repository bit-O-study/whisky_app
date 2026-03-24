import type { RefObject } from "react";
import type { GroupedLiquor } from "../types/liquor";
import LiquorCard from "./LiquorCard";

interface LiquorGridProps {
  searchQuery: string;
  liquors: GroupedLiquor[];
  loading: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  error: string | null;
  loadMoreRef: RefObject<HTMLDivElement | null>;
}

export default function LiquorGrid({ searchQuery, liquors, loading, loadingMore, hasNext, error, loadMoreRef }: LiquorGridProps) {
  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <p className="text-lg font-medium">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500">
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (liquors.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
          </svg>
        <p className="text-lg font-medium">&quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다</p>
        <p className="text-sm mt-1">다른 검색어로 시도해보세요</p>
      </div>
    );
  }

  return (
    <>
      {searchQuery && (
        <p className="text-sm text-gray-500 mb-4">
          &quot;{searchQuery}&quot; 검색 결과: <span className="font-semibold text-gray-700">현재 {liquors.length}개 표시</span>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {liquors.map((l) => (
          <LiquorCard key={l.name} liquor={l} />
        ))}
      </div>
      {hasNext && <div ref={loadMoreRef} className="h-10" aria-hidden="true" />}
      {loadingMore && (
        <div className="py-8 text-center text-sm text-gray-500">
          더 불러오는 중...
        </div>
      )}
    </>
  );
}
