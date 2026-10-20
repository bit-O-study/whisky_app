import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "../../../../../src/lib/supabase";
import { parseLiquorReport } from "../../../../../src/features/catalog/model/liquor-report";

interface ReportSupabase {
  from(table: "liquor_report"): {
    insert(row: { liquor_id: number; source: string | null; reason: string }): Promise<{ error: { message?: string } | null }>;
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const report = parseLiquorReport(Number(id), body);
  if (!report) {
    return NextResponse.json({ message: "신고 내용이 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = getSupabaseClient() as unknown as ReportSupabase;
  const { error } = await supabase
    .from("liquor_report")
    .insert({ liquor_id: report.liquorId, source: report.source, reason: report.reason });
  if (error) {
    return NextResponse.json({ message: "신고를 저장하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
