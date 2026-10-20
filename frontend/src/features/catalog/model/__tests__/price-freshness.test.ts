import { describe, expect, it } from "vitest";
import { checkedDate, priceFreshness, relativeFromNow } from "../price-freshness";

const now = Date.parse("2026-10-20T12:00:00Z");

describe("price freshness", () => {
  it("splits prices into new (7 days) / mid (30 days) / stale", () => {
    expect(priceFreshness("2026-10-15T07:47:00Z", now)).toEqual({ tone: "new", label: "5일 전" });
    expect(priceFreshness("2026-10-01T00:00:00Z", now)).toEqual({ tone: "mid", label: "19일 전" });
    expect(priceFreshness("2026-05-10T19:30:00Z", now)).toEqual({ tone: "stale", label: "5개월 전" });
    expect(priceFreshness(null, now).tone).toBe("unknown");
    expect(priceFreshness("bad", now).tone).toBe("unknown");
  });

  it("shows the year in Korean time so old prices do not read as recent", () => {
    // 5/10 19:30 UTC = 5/11 04:30 KST
    expect(checkedDate("2026-05-10T19:30:00Z")).toBe("2026.05.11");
    expect(checkedDate(undefined)).toBeNull();
  });

  it("formats relative time", () => {
    expect(relativeFromNow("2026-10-20T11:59:40Z", now)).toBe("방금");
    expect(relativeFromNow("2026-10-20T09:00:00Z", now)).toBe("3시간 전");
    expect(relativeFromNow("2025-09-01T00:00:00Z", now)).toBe("1년 전");
  });
});
