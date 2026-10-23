import { expect, it, vi } from "vitest";
import { ingestLotteonObservations, parseLotteonObservations } from "./lotteon-ingest-server";
const row = () => ({ liquorId: 1, currentPrice: 47800, originalPrice: 50000,
  productUrl: "https://www.lotteon.com/p/product/LM123", imageUrl: "", observedAt: new Date().toISOString() });
it("saves only a matching existing listing", async () => {
  const ports = { findProductUrl: vi.fn().mockResolvedValue("https://www.lotteon.com/p/product/LM123?foo=bar"), save: vi.fn() };
  await expect(ingestLotteonObservations([row()], ports)).resolves.toEqual({ updated: 1 });
  expect(ports.save).toHaveBeenCalledTimes(1);
});
it.each([0, -1, 1.5, 2147483648])("rejects invalid current price %s", currentPrice => {
  expect(() => parseLotteonObservations([{ ...row(), currentPrice }])).toThrow();
});
it("validates all identities before writing and propagates DB errors", async () => {
  const ports = { findProductUrl: vi.fn().mockResolvedValueOnce(row().productUrl).mockResolvedValueOnce("https://www.lotteon.com/p/product/OTHER"), save: vi.fn() };
  await expect(ingestLotteonObservations([row(), { ...row(), liquorId: 2 }], ports)).rejects.toThrow();
  expect(ports.save).not.toHaveBeenCalled();
  ports.findProductUrl.mockResolvedValue(row().productUrl);
  ports.save.mockRejectedValue(new Error("DB failure"));
  await expect(ingestLotteonObservations([row()], ports)).rejects.toThrow("DB failure");
});
it("rejects duplicate IDs, foreign URLs, stale time and oversized batches", () => {
  for (const input of [[row(), row()], [{ ...row(), productUrl: "https://evil.test/p/product/LM123" }],
    [{ ...row(), observedAt: "2020-01-01" }], Array.from({ length: 11 }, (_, i) => ({ ...row(), liquorId: i + 1 }))]) {
    expect(() => parseLotteonObservations(input)).toThrow();
  }
});
