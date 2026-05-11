import {
    fetchCatalogPageFromServer,
    fetchFlavorRecommendationsFromServer,
    fetchSourceRecommendationsFromServer,
    fetchTodaysRecommendationsFromServer,
    type FlavorAxis,
    type SourceKey,
} from "../src/features/catalog/api/catalog-server";
import type { CatalogCardItem } from "../src/features/catalog/model/catalog";
import CatalogPageClient from "../src/features/catalog/ui/CatalogPageClient";

const INITIAL_PAGE_SIZE = 500;

export const dynamic = "force-dynamic";

const EMPTY_SOURCE_RECS: Record<SourceKey, CatalogCardItem[]> = {
    LOTTEON: [],
    EMART: [],
    EMART_TRADERS: [],
    COSTCO: [],
};

const EMPTY_FLAVOR_RECS: Record<FlavorAxis, CatalogCardItem[]> = {
    sweet: [],
    smoky: [],
    fruity: [],
    body: [],
};

export default async function HomePage() {
    let initialError: string | null = null;
    let initialPage;
    let recommendations: Awaited<ReturnType<typeof fetchTodaysRecommendationsFromServer>> = [];
    let sourceRecommendations: Record<SourceKey, CatalogCardItem[]> = EMPTY_SOURCE_RECS;
    let flavorRecommendations: Record<FlavorAxis, CatalogCardItem[]> = EMPTY_FLAVOR_RECS;

    try {
        [initialPage, recommendations, sourceRecommendations, flavorRecommendations] = await Promise.all([
            fetchCatalogPageFromServer({ page: 0, size: INITIAL_PAGE_SIZE }),
            fetchTodaysRecommendationsFromServer(1),
            fetchSourceRecommendationsFromServer(1),
            fetchFlavorRecommendationsFromServer(1),
        ]);
    } catch (error) {
        console.error("Failed to preload home content", error);
        initialError = "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    }

    return (
        <CatalogPageClient
            initialPage={initialPage}
            initialError={initialError}
            recommendations={recommendations}
            sourceRecommendations={sourceRecommendations}
            flavorRecommendations={flavorRecommendations}
        />
    );
}
