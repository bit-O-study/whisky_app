import { NextResponse } from "next/server";

import { getSupabaseClient } from "../../../src/lib/supabase";
import { classifyVisitSource, referrerHost } from "../../../src/shared/lib/visit-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// getSupabaseClient() 원본 타입을 직접 쓰면 빌드 타입체크가 깨져, 기존 route 들과
// 동일하게 필요한 연산만 최소 인터페이스로 캐스팅해서 사용한다.
interface VisitTable {
  insert(row: VisitRow | { path: string | null }): PromiseLike<{ error: { message?: string } | null }>;
  select(
    columns: string,
    opts: { count: "exact"; head: true },
  ): PromiseLike<{ count: number | null; error: { message?: string } | null }>;
}
interface VisitRow {
  path: string | null;
  source: string;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}
interface VisitSupabase {
  from(table: "site_visit"): VisitTable;
}

/** 사이트 방문 1건 기록 — 클라이언트 VisitPing 이 세션당 1회 POST 한다(서버 service_role). */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
    const path = text(body.path, 300);
    // 유입 경로(2026-10-14) — referrer 는 호스트만 남기고, 앱 안 브라우저는 UA 로 알아본다.
    const host = referrerHost(text(body.referrer, 500));
    const utmSource = text(body.utm_source, 100);
    const row: VisitRow = {
      path,
      source: classifyVisitSource({
        referrerHost: host,
        utmSource,
        userAgent: request.headers.get("user-agent"),
        selfHost: new URL(request.url).hostname,
      }),
      referrer_host: host,
      utm_source: utmSource,
      utm_medium: text(body.utm_medium, 100),
      utm_campaign: text(body.utm_campaign, 150),
    };
    const supabase = getSupabaseClient() as unknown as VisitSupabase;
    let { error } = await supabase.from("site_visit").insert(row);
    // 유입 칸 SQL(add_site_visit_source.sql)을 아직 안 돌린 DB 에서도 방문 수는 계속 남긴다.
    if (error && /column|schema cache/i.test(error.message ?? "")) {
      ({ error } = await supabase.from("site_visit").insert({ path }));
    }
    if (error) {
      return NextResponse.json({ ok: false, error: error.message ?? "insert 실패" });
    }
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
    const supabase = getSupabaseClient() as unknown as VisitSupabase;
    const { count, error } = await supabase
      .from("site_visit")
      .select("id", { count: "exact", head: true });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message ?? "조회 실패" });
    }
    return NextResponse.json({ ok: true, count: count ?? 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}