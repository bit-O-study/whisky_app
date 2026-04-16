import { fetchCatalogPageFromServer } from "../src/features/catalog/api/catalog-server";
import CatalogPageClient from "../src/features/catalog/ui/CatalogPageClient";

const INITIAL_PAGE_SIZE = 24;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialError: string | null = null;
  let initialPage;

  try {
    initialPage = await fetchCatalogPageFromServer({ page: 0, size: INITIAL_PAGE_SIZE });
  } catch (error) {
    console.error("Failed to preload catalog on the server", error);
    initialError = "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  return <CatalogPageClient initialPage={initialPage} initialError={initialError} />;
}
