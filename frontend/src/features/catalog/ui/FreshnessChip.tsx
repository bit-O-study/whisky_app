import { checkedDate, priceFreshness } from "../model/price-freshness";

/** 가격 신선도 점 — 초록(7일 이내) · 회색(30일 이내) · 주황(30일 초과). 목록과 상세가 같이 쓴다. */
export default function FreshnessChip({ crawledAt, suffix = "" }: { crawledAt?: string | null; suffix?: string }) {
  const { tone, label } = priceFreshness(crawledAt);
  if (tone === "unknown") return null;
  return (
    <span className={`fresh-chip fresh-${tone}`} title={checkedDate(crawledAt) ? `${checkedDate(crawledAt)} 확인` : undefined} data-testid="fresh-chip" data-tone={tone}>
      {label}
      {suffix}
    </span>
  );
}
