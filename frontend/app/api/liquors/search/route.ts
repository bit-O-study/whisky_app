import { NextRequest, NextResponse } from "next/server";
import { fetchCatalogPageFromServer } from "../../../../src/features/catalog/api/catalog-server";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("q") ?? "";
  const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
  const size = Number(request.nextUrl.searchParams.get("size") ?? "24");

  try {
    const result = await fetchCatalogPageFromServer({ keyword, page, size });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to search liquors", error);
    return NextResponse.json({ message: "주류 검색 실패" }, { status: 500 });
  }
}
