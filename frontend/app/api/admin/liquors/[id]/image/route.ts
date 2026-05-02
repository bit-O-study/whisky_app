import { NextRequest, NextResponse } from "next/server";
import { uploadAdminLiquorImageFromServer } from "../../../../../../src/features/admin/liquor-info/api/admin-liquor-info-server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const liquorId = Number(id);

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ message: "업로드할 이미지 파일이 필요합니다." }, { status: 400 });
    }

    const result = await uploadAdminLiquorImageFromServer(liquorId, image);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "이미지 업로드 실패";
    console.error("Failed to upload admin liquor image", error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
