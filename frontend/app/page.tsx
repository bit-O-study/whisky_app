import CatalogPageClient from "../src/components/CatalogPageClient";
import { fetchLiquorPage } from "../src/lib/liquors";

const INITIAL_PAGE_SIZE = 24;

export default async function HomePage() {
  let initialError: string | null = null;
  let initialPage;

  try {
    initialPage = await fetchLiquorPage({ page: 0, size: INITIAL_PAGE_SIZE });
  } catch (error) {
    console.error("Failed to preload catalog on the server", error);
    initialError = "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  return <CatalogPageClient initialPage={initialPage} initialError={initialError} />;
}
