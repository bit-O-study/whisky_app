import { notFound } from "next/navigation";
import LiquorDetailView from "@/features/catalog/ui/LiquorDetailView";
import {
    fetchLiquorDetailFromServer,
    fetchLiquorPriceHistoryFromServer,
} from "@/features/catalog/api/catalog-server";

interface PageProps {
    params: Promise<{ id: string }>;
}

interface HttpError extends Error {
    status?: number;
}

export default async function LiquorDetailPage({ params }: PageProps) {
    const { id } = await params;

    let liquorData: Awaited<ReturnType<typeof fetchLiquorDetailFromServer>> | null = null;
    let priceHistory;
    let fetchError: HttpError | null = null;

    try {
        [liquorData, priceHistory] = await Promise.all([
            fetchLiquorDetailFromServer(id),
            fetchLiquorPriceHistoryFromServer(id, 90),
        ]);
    } catch (error: unknown) {
        console.error("Liquor fetch error:", error);
        fetchError = error as HttpError;
    }

    if (fetchError) {
        if (fetchError.status === 404) {
            notFound();
        }

        return (
            <div className="flex h-screen items-center justify-center">
                <p>데이터를 불러오는 중 문제가 발생했습니다. (에러 코드: {fetchError.status || '알 수 없음'})</p>
            </div>
        );
    }

    if (!liquorData) {
        notFound();
    }

    // return <LiquorDetailView liquor={liquorData} />;
    return <LiquorDetailView liquor={liquorData} priceHistory={priceHistory ?? []} />;
}
