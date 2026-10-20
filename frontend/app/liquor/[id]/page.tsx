import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import LiquorDetailView from "@/features/catalog/ui/LiquorDetailView";
import ViewTracker from "@/features/catalog/ui/ViewTracker";
import {
    fetchLiquorDetailFromServer,
    fetchLiquorPriceHistoryFromServer,
} from "@/features/catalog/api/catalog-server";
import { parseLiquorId } from "@/features/catalog/model/liquor-detail";

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
    if (parseLiquorId(id) === null) return { title: "찾는 위스키가 없어요 | 위스키다모아" };

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
    // 숫자가 아닌 주소는 조회하지 않고 바로 404 (예전엔 "에러 코드: 알 수 없음" 화면이었다)
    if (parseLiquorId(id) === null) notFound();

    let liquorData: Awaited<ReturnType<typeof fetchLiquorDetailFromServer>> | null = null;
    let priceHistory;
    let fetchError: HttpError | null = null;

    try {
        [liquorData, priceHistory] = await Promise.all([
            getLiquorDetail(id),
            fetchLiquorPriceHistoryFromServer(id, 90),
        ]);
    } catch (error: unknown) {
        fetchError = error as HttpError;
        if (fetchError.status !== 404) console.error("Liquor fetch error:", error);
    }

    if (fetchError) {
        if (fetchError.status === 404) {
            notFound();
        }

        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-lg font-bold text-[color:var(--catalog-ink)]">상품 정보를 불러오지 못했어요</p>
                <p className="text-sm text-[color:var(--catalog-muted)]">잠시 후 다시 시도해 주세요.</p>
                <div className="flex gap-2">
                    <Link href={`/liquor/${id}`} className="catalog-btn catalog-btn-pop">다시 시도</Link>
                    <Link href="/" className="catalog-btn border border-[color:var(--catalog-outline)]">목록으로</Link>
                </div>
            </main>
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
