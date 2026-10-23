import { NextResponse } from "next/server";
import { verifyLotteonWorkflow } from "../../../../src/shared/lib/github-actions-auth";
import { createLotteonIngestPorts, ingestLotteonObservations, InvalidLotteonObservation } from "../../../../src/features/catalog/api/lotteon-ingest-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try { await verifyLotteonWorkflow(request.headers.get("authorization")); }
  catch { return NextResponse.json({ message: "Unauthorized workflow" }, { status: 401 }); }
  try {
    const raw = await request.text();
    if (raw.length > 65536) return NextResponse.json({ message: "Request too large" }, { status: 413 });
    let body;
    try { body = JSON.parse(raw); }
    catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
    const result = await ingestLotteonObservations(body?.observations, createLotteonIngestPorts());
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof InvalidLotteonObservation) return NextResponse.json({ message: error.message }, { status: 400 });
    console.error("Lotteon daily ingestion failed", error);
    return NextResponse.json({ message: "Lotteon price save failed" }, { status: 500 });
  }
}
