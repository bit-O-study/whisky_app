import { describe, expect, it } from "vitest";
import { parseLiquorReport } from "../liquor-report";

describe("liquor report input", () => {
  it("accepts a known reason with an optional vendor code", () => {
    expect(parseLiquorReport(865, { reason: "wrong_product", source: "EMART" })).toEqual({ liquorId: 865, source: "EMART", reason: "wrong_product" });
    expect(parseLiquorReport(865, { reason: "wrong_price" })).toEqual({ liquorId: 865, source: null, reason: "wrong_price" });
  });

  it("rejects unknown reasons, odd vendor codes and bad ids", () => {
    expect(parseLiquorReport(865, { reason: "spam" })).toBeNull();
    expect(parseLiquorReport(865, { reason: "toString" })).toBeNull();
    expect(parseLiquorReport(865, { reason: "sold_out", source: "<script>" })).toBeNull();
    expect(parseLiquorReport(0, { reason: "sold_out" })).toBeNull();
    expect(parseLiquorReport(865, null)).toBeNull();
  });
});
