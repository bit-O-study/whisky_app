import { NextResponse } from "next/server";

import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 사이트 방문 1건 기록 — 클라이언트 VisitPing 이 세션당 1회 POST 한다(서버 service_role). */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { path?: unknown };
    const path =
      typeof body.path === "string" ? body.path.slice(0, 300) : null;
    const supabase = getSupabaseClient();
    await supabase.from("site_visit").insert({ path });
    return NextResponse.json({ ok: true });
  } catch {
    // 방문 기록 실패는 사용자 경험에 영향 없음 — 조용히 넘어간다.
    return NextResponse.json({ ok: false });
  }
}