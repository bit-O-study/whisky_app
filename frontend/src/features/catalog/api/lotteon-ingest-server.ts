import "server-only";
import { getSupabaseClient } from "../../../lib/supabase";

export class InvalidLotteonObservation extends Error {}
interface Observation {
  liquorId: number; currentPrice: number; originalPrice: number;
  productUrl: string; imageUrl: string; observedAt: string;
}
export interface LotteonIngestPorts {
  findProductUrl(id: number): Promise<string | null>;
  save(observation: Observation): Promise<void>;
}

function productCode(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !["www.lotteon.com", "lotteon.com"].includes(url.hostname)) return null;
    return url.pathname.match(/^\/p\/product\/([a-z0-9]+)\/?$/i)?.[1].toUpperCase() ?? null;
  } catch { return null; }
}

export function parseLotteonObservations(input: unknown): Observation[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 10) throw new InvalidLotteonObservation("1~10 observations required");
  const ids = new Set<number>();
  return input.map((value: unknown) => {
    if (!value || typeof value !== "object") throw new InvalidLotteonObservation("Invalid observation");
    const row = value as Record<string, unknown>;
    const validPrice = (p: unknown): p is number => typeof p === "number" && Number.isSafeInteger(p) && p > 0 && p <= 2147483647;
    if (typeof row.liquorId !== "number" || !Number.isSafeInteger(row.liquorId) || row.liquorId <= 0 || ids.has(row.liquorId) ||
        !validPrice(row.currentPrice) || !validPrice(row.originalPrice) || row.originalPrice < row.currentPrice ||
        typeof row.productUrl !== "string" || row.productUrl.length > 2000 || !productCode(row.productUrl) ||
        typeof row.imageUrl !== "string" || row.imageUrl.length > 2000 || typeof row.observedAt !== "string") {
      throw new InvalidLotteonObservation("Invalid product or price");
    }
    const observed = Date.parse(row.observedAt);
    if (!Number.isFinite(observed) || observed > Date.now() + 300000 || observed < Date.now() - 86400000) {
      throw new InvalidLotteonObservation("Invalid observation time");
    }
    ids.add(row.liquorId);
    return { liquorId: row.liquorId, currentPrice: row.currentPrice, originalPrice: row.originalPrice,
      productUrl: row.productUrl, imageUrl: row.imageUrl, observedAt: new Date(observed).toISOString() };
  });
}

export async function ingestLotteonObservations(input: unknown, ports: LotteonIngestPorts) {
  const observations = parseLotteonObservations(input);
  for (const row of observations) {
    const knownUrl = await ports.findProductUrl(row.liquorId);
    if (!knownUrl || productCode(knownUrl) !== productCode(row.productUrl)) {
      throw new InvalidLotteonObservation("Product does not match the existing Lotteon listing");
    }
  }
  for (const row of observations) await ports.save(row);
  return { updated: observations.length };
}

export function createLotteonIngestPorts(): LotteonIngestPorts {
  const client = getSupabaseClient();
  return {
    async findProductUrl(id) {
      const { data, error } = await client.from("liquor_url").select("product_url")
        .eq("liquor_id", id).eq("source", "LOTTEON").limit(1);
      if (error) throw error;
      return (data as { product_url: string | null }[] | null)?.[0]?.product_url ?? null;
    },
    async save(row) {
      const rpcClient = client as unknown as {
        rpc(name: "ingest_existing_liquor", args: { p: Observation & { source: "LOTTEON" } }): PromiseLike<{ error: unknown }>;
      };
      const { error } = await rpcClient.rpc("ingest_existing_liquor", { p: { ...row, source: "LOTTEON" } });
      if (error) throw error;
    },
  };
}
