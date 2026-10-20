/**
 * 가격 신선도 — 가격 비교에서 "언제 확인한 가격인가"를 목록·상세가 같은 규칙으로 보여 준다.
 * 7일 이내 = 최신, 30일 이내 = 보통, 30일 초과 = 오래된 가격.
 */
export const FRESH_PRICE_DAYS = 7;
export const STALE_PRICE_DAYS = 30;

export type FreshnessTone = "new" | "mid" | "stale" | "unknown";

const DAY_MS = 86_400_000;

function parse(value?: string | null) {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

/** "방금" · "3시간 전" · "5일 전" · "5개월 전" · "1년 전". 시각이 없으면 null. */
export function relativeFromNow(value?: string | null, now = Date.now()) {
  const ts = parse(value);
  if (ts === null) return null;
  const minutes = Math.floor((now - ts) / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

export function priceFreshness(value?: string | null, now = Date.now()): { tone: FreshnessTone; label: string } {
  const ts = parse(value);
  if (ts === null) return { tone: "unknown", label: "확인 시각 없음" };
  const days = (now - ts) / DAY_MS;
  const label = relativeFromNow(value, now) ?? "";
  if (days <= FRESH_PRICE_DAYS) return { tone: "new", label };
  if (days <= STALE_PRICE_DAYS) return { tone: "mid", label };
  return { tone: "stale", label };
}

/** 연도까지 보이는 확인 날짜(한국 시간) — "2026.05.11". 연도가 없으면 5개월 전 가격이 최근처럼 읽힌다. */
export function checkedDate(value?: string | null) {
  const ts = parse(value);
  if (ts === null) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts));
  return parts.replace(/-/g, ".");
}
