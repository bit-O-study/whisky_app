import { NextRequest, NextResponse } from "next/server";
import {
  updateAdminLiquorInfoFromServer,
  type AdminLiquorInfoUpdateInput,
} from "../../../../../src/features/admin/liquor-info/api/admin-liquor-info-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const liquorId = Number(id);

  try {
    const body = (await request.json()) as AdminLiquorInfoUpdateInput;
    const result = await updateAdminLiquorInfoFromServer(liquorId, body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "상품 정보 수정 실패";
    console.error("Failed to update admin liquor info", error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
