import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import LiquorDetailView from "@/features/catalog/ui/LiquorDetailView";
import ViewTracker from "@/features/catalog/ui/ViewTracker";
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

// generateMetadata와 페이지가 같은 요청 안에서 상세 조회를 한 번만 하도록 공유
const getLiquorDetail = cache(fetchLiquorDetailFromServer);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const path = `/liquor/${id}`;

    try {
        const liquor = await getLiquorDetail(id);
        const title = `${liquor.name} 최저가 | 위스키다모아`;
        const priceText = liquor.lowest_price > 0 ? `최저 ${liquor.lowest_price.toLocaleString("ko-KR")}원, ` : "";
        const description = `${liquor.name} 가격 비교 — ${priceText}판매처 ${liquor.vendors.length}곳의 가격과 시세를 한눈에 확인하세요.`;
        const images = liquor.image_url ? [{ url: liquor.image_url, alt: liquor.name }] : undefined;

        return {
            title,
            description,
            alternates: { canonical: path },
            openGraph: { title, description, url: path, siteName: "위스키다모아", locale: "ko_KR", type: "website", images },
            twitter: { card: "summary_large_image", title, description, images: images?.map((image) => image.url) },
        };
    } catch {
        return { alternates: { canonical: path } };
    }
}

export default async function LiquorDetailPage({ params }: PageProps) {
    const { id } = await params;

    let liquorData: Awaited<ReturnType<typeof fetchLiquorDetailFromServer>> | null = null;
    let priceHistory;
    let fetchError: HttpError | null = null;

    try {
        [liquorData, priceHistory] = await Promise.all([
            getLiquorDetail(id),
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

    return (
        <>
            <ViewTracker liquorId={liquorData.id} />
            <LiquorDetailView liquor={liquorData} priceHistory={priceHistory ?? []} />
        </>
    );
}
