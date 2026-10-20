/** 사용자 "알려 주기" — 가격·링크 오류 신고. 개인정보 없이 상품·판매처·사유만 남긴다. */
export const REPORT_REASONS = {
  wrong_product: "다른 상품이 열려요",
  wrong_price: "가격이 달라요",
  sold_out: "품절이거나 판매가 끝났어요",
  broken_link: "링크가 열리지 않아요",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

export interface LiquorReportInput {
  liquorId: number;
  source: string | null;
  reason: ReportReason;
}

/** 요청 본문 검사. 잘못되면 null. */
export function parseLiquorReport(liquorId: number, body: unknown): LiquorReportInput | null {
  if (!Number.isInteger(liquorId) || liquorId <= 0 || !body || typeof body !== "object") return null;
  const { reason, source } = body as { reason?: unknown; source?: unknown };
  if (typeof reason !== "string" || !Object.prototype.hasOwnProperty.call(REPORT_REASONS, reason)) return null;
  if (source != null && (typeof source !== "string" || !/^[A-Z_]{2,40}$/.test(source))) return null;
  return { liquorId, source: (source as string | null | undefined) ?? null, reason: reason as ReportReason };
}
