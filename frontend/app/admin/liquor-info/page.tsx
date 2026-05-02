import type { Metadata } from "next";
import AdminLiquorInfoEditor from "../../../src/features/admin/liquor-info/ui/AdminLiquorInfoEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "상품 정보 수정 | 위스키다모아",
};

export default function AdminLiquorInfoPage() {
  return <AdminLiquorInfoEditor />;
}
