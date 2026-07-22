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
    const { error } = await supabase.from("site_visit").insert({ path });
    if (error) return NextResponse.json({ ok: false, error: error.message });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}

/**
 * 진단용 — 브라우저로 이 주소를 열면 현재 방문수(및 에러)를 볼 수 있다.
 * 기록이 안 될 때 원인(테이블 없음/env 없음 등)이 error 로 그대로 보인다.
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from("site_visit")
      .select("id", { count: "exact", head: true });
    if (error) return NextResponse.json({ ok: false, error: error.message });
    return NextResponse.json({ ok: true, count: count ?? 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}