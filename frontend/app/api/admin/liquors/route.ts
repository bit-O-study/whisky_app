import { NextRequest, NextResponse } from "next/server";
import { fetchAdminLiquorInfoPageFromServer } from "../../../../src/features/admin/liquor-info/api/admin-liquor-info-server";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("q") ?? "";
  const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
  const size = Number(request.nextUrl.searchParams.get("size") ?? "20");

  try {
    const result = await fetchAdminLiquorInfoPageFromServer({ keyword, page, size });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load admin liquor info", error);
    return NextResponse.json({ message: "상품 정보 조회 실패" }, { status: 500 });
  }
}
