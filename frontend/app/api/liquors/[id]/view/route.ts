import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "../../../../../src/lib/supabase";

interface ViewCountSupabase {
  rpc(
    fn: "increment_liquor_view_count",
    args: { p_liquor_id: number },
  ): Promise<{ data: number | null; error: { message?: string } | null }>;
}

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const liquorId = Number.parseInt(id, 10);
  if (!Number.isFinite(liquorId) || liquorId <= 0) {
    return NextResponse.json({ message: "id가 유효하지 않습니다." }, { status: 400 });
  }

  const supabase = getSupabaseClient() as unknown as ViewCountSupabase;
  const { data, error } = await supabase.rpc("increment_liquor_view_count", { p_liquor_id: liquorId });
  if (error) {
    return NextResponse.json({ message: "view 증가 실패", detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, liquorId, viewCount: data });
}
