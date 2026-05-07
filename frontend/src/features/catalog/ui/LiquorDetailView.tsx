import Image from "next/image";
import Link from "next/link";
import type { PriceHistoryPoint } from "../api/catalog-server";
import type { CatalogCardItem, CatalogCardVendor } from "../model/catalog";
import PriceTrendChart from "./PriceTrendChart";
import FlavorRadarChart, { hasAnyFlavorValue, type FlavorRadarValues } from "./FlavorRadarChart";
import {
    FLAVOR_AXIS_KEYS,
    FLAVOR_AXIS_LABELS,
    type FlavorAxisKey,
} from "../../admin/liquor-info/model/admin-liquor-info";

interface Props {
    liquor: CatalogCardItem;
    priceHistory?: PriceHistoryPoint[];
}

function isCostcoVendor(source: string) {
    return source.trim().toUpperCase() === "COSTCO";
}

function formatPrice(price: number) {
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return "—";
    return price.toLocaleString("ko-KR") + "원";
}

function formatRelativeFromNow(value?: string | null) {
    if (!value) return null;
    const ts = new Date(value).getTime();
    if (!Number.isFinite(ts)) return null;
    const diffMs = Date.now() - ts;
    if (diffMs < 0) return "방금";
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "방금";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}개월 전`;
    return `${Math.floor(months / 12)}년 전`;
}

function formatDateShort(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function LiquorDetailView({ liquor, priceHistory = [] }: Props) {
    const sortedVendors = (liquor.vendors ?? [])
        .slice()
        .sort((a: CatalogCardVendor, b: CatalogCardVendor) => a.current_price - b.current_price);
    const bestVendor = sortedVendors[0];

    let latestCrawledAt: string | null = null;
    for (const vendor of liquor.vendors ?? []) {
        if (!vendor?.crawled_at) continue;
        if (!latestCrawledAt || new Date(vendor.crawled_at).getTime() > new Date(latestCrawledAt).getTime()) {
            latestCrawledAt = vendor.crawled_at;
        }
    }
    const latestRelative = formatRelativeFromNow(latestCrawledAt);
    const latestExact = formatDateShort(latestCrawledAt);

    const flavorValues: FlavorRadarValues = {
        sweet: liquor.sweet,
        smoky: liquor.smoky,
        fruity: liquor.fruity,
        spicy: liquor.spicy,
        woody: liquor.woody,
        body: liquor.body,
    };
    const showFlavor = hasAnyFlavorValue(flavorValues);

    return (
        <div className="min-h-screen bg-[color:var(--catalog-bg-solid)] text-[color:var(--catalog-ink)]">
            {/* nav */}
            <nav className="catalog-glass sticky top-0 z-50">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[color:var(--catalog-ink)] transition hover:bg-[color:var(--catalog-bg-secondary)]"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 19l-7-7 7-7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-semibold">Back</span>
                    </Link>
                    <span className="catalog-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
                        {liquor.brand}
                    </span>
                    <div className="w-12" />
                </div>
            </nav>

            <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-8">
                {/* HERO */}
                <section className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pt-16">
                    <div className="catalog-bottle-well relative aspect-[4/5] overflow-hidden rounded-3xl border border-[color:var(--catalog-outline)]">
                        <Image
                            src={liquor.image_url || "/default.webp"}
                            alt={liquor.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 55vw"
                            className="object-contain p-12 transition-transform duration-500 hover:scale-[1.04]"
                            priority
                        />
                    </div>

                    <div className="flex flex-col">
                        <span className="catalog-kicker">
                            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--catalog-primary)]" />
                            {liquor.category} · {liquor.country}
                        </span>

                        <h1 className="mt-5 text-[2.4rem] font-bold leading-[1.05] tracking-[-0.025em] text-[color:var(--catalog-ink)] md:text-[3.2rem]">
                            {liquor.name}
                        </h1>

                        <div className="mt-6 flex flex-wrap items-center gap-2">
                            <span className="catalog-chip catalog-chip-ink">
                                {liquor.alcohol_percent}% ABV
                            </span>
                            <span className="catalog-chip">
                                {liquor.volume}ml
                            </span>
                            {liquor.vendors?.length > 0 && (
                                <span className="catalog-chip catalog-chip-soft">
                                    {liquor.vendors.length} vendors
                                </span>
                            )}
                        </div>

                        {/* 가격 카드 */}
                        <div className="mt-8 rounded-3xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] p-7 shadow-[var(--catalog-shadow-md)]">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-primary)]">
                                        Lowest Price
                                    </p>
                                    <p className="mt-2 text-[2.6rem] font-bold leading-none tracking-tight text-[color:var(--catalog-ink)]">
                                        {formatPrice(liquor.lowest_price)}
                                    </p>
                                    {bestVendor && (
                                        <p className="mt-2 catalog-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--catalog-muted)]">
                                            via {bestVendor.source}
                                        </p>
                                    )}
                                    {latestRelative && (
                                        <p
                                            className="mt-3 text-[11px] text-[color:var(--catalog-soft)]"
                                            title={latestExact ?? undefined}
                                        >
                                            가격 갱신: {latestRelative}
                                            {latestExact ? ` · ${latestExact}` : ""}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {bestVendor && isCostcoVendor(bestVendor.source) ? (
                                <div className="mt-7 rounded-2xl border border-dashed border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-secondary)] px-5 py-4 text-center">
                                    <p className="text-sm font-bold text-[color:var(--catalog-ink)]">
                                        코스트코는 매장 구매 전용 가격입니다
                                    </p>
                                    <p className="mt-1 text-xs text-[color:var(--catalog-muted)]">
                                        외부 상품 페이지로 연결되지 않으니 매장에서 확인해 주세요.
                                    </p>
                                </div>
                            ) : (
                                bestVendor?.product_url && (
                                    <a
                                        href={bestVendor.product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="catalog-btn catalog-btn-pop mt-7 w-full"
                                    >
                                        최저가로 구매하기
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </a>
                                )
                            )}
                        </div>
                    </div>
                </section>

                {/* 맛 프로필 */}
                {showFlavor && (
                    <section className="mt-20">
                        <div className="mb-6 flex items-end justify-between">
                            <h2 className="text-2xl font-bold tracking-[-0.015em] text-[color:var(--catalog-ink)]">
                                맛 프로필
                            </h2>
                            <span className="catalog-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
                                0 ~ 5
                            </span>
                        </div>
                        <div className="grid gap-8 rounded-3xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] p-8 shadow-[var(--catalog-shadow-md)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                            <div className="mx-auto aspect-square w-full max-w-[20rem]">
                                <FlavorRadarChart values={flavorValues} size={320} />
                            </div>
                            <ul className="space-y-3">
                                {FLAVOR_AXIS_KEYS.map((key) => {
                                    const value = flavorValues[key as FlavorAxisKey];
                                    const numeric =
                                        typeof value === "number" && Number.isFinite(value) ? value : null;
                                    const ratio = numeric === null ? 0 : Math.max(0, Math.min(1, numeric / 5));
                                    return (
                                        <li key={key} className="flex items-center gap-4">
                                            <span className="w-14 shrink-0 text-sm font-bold text-[color:var(--catalog-ink)]">
                                                {FLAVOR_AXIS_LABELS[key as FlavorAxisKey]}
                                            </span>
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--catalog-bg-secondary)]">
                                                <div
                                                    className="h-full rounded-full bg-[color:var(--catalog-primary)] transition-[width]"
                                                    style={{ width: `${ratio * 100}%` }}
                                                />
                                            </div>
                                            <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-[color:var(--catalog-ink)]">
                                                {numeric === null ? "—" : numeric.toFixed(1)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </section>
                )}

                {/* 가격 추이 그래프 */}
                <section className="mt-20">
                    <div className="mb-6 flex items-end justify-between">
                        <h2 className="text-2xl font-bold tracking-[-0.015em] text-[color:var(--catalog-ink)]">
                            가격 추이
                        </h2>
                        <span className="catalog-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
                            최근 90일
                        </span>
                    </div>
                    <PriceTrendChart points={priceHistory} />
                </section>

                {/* 판매처 리스트 */}
                <section className="mt-20">
                    <div className="mb-6 flex items-end justify-between">
                        <h2 className="text-2xl font-bold tracking-[-0.015em] text-[color:var(--catalog-ink)]">
                            모든 판매처
                        </h2>
                        <span className="catalog-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
                            {sortedVendors.length} listed
                        </span>
                    </div>

                    <ul className="space-y-2">
                        {sortedVendors.map((v, idx) => {
                            const isCostco = isCostcoVendor(v.source);
                            const innerContent = (
                                <>
                                    <div className="flex items-center gap-4">
                                        <span className="catalog-mono text-[12px] font-bold tracking-[0.14em] text-[color:var(--catalog-soft)]">
                                            {String(idx + 1).padStart(2, "0")}
                                        </span>
                                        <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-[color:var(--catalog-bg-secondary)]">
                                            <span className="catalog-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--catalog-ink)]">
                                                {v.source.slice(0, 4)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[0.95rem] font-semibold tracking-tight text-[color:var(--catalog-ink)]">
                                                {v.source}
                                            </p>
                                            {isCostco && (
                                                <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--catalog-primary)]">
                                                    매장 전용 · 외부 페이지 없음
                                                </p>
                                            )}
                                            {v.original_price > v.current_price && (
                                                <p className="mt-0.5 catalog-mono text-[11px] text-[color:var(--catalog-soft)] line-through">
                                                    {formatPrice(v.original_price)}
                                                </p>
                                            )}
                                            {v.crawled_at && (
                                                <p
                                                    className="mt-0.5 catalog-mono text-[10px] text-[color:var(--catalog-soft)]"
                                                    title={formatDateShort(v.crawled_at) ?? undefined}
                                                >
                                                    {formatRelativeFromNow(v.crawled_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`text-[1.05rem] font-bold ${
                                                idx === 0
                                                    ? "text-[color:var(--catalog-primary)]"
                                                    : "text-[color:var(--catalog-ink)]"
                                            }`}
                                        >
                                            {formatPrice(v.current_price)}
                                        </span>
                                        {!isCostco && (
                                            <svg
                                                className="h-3.5 w-3.5 text-[color:var(--catalog-soft)] transition group-hover:translate-x-1 group-hover:text-[color:var(--catalog-primary)]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M9 5l7 7-7 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </>
                            );

                            return (
                                <li key={v.source}>
                                    {isCostco || !v.product_url ? (
                                        <div
                                            className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-secondary)] px-5 py-4"
                                            aria-label={`${v.source} - 외부 페이지 없음`}
                                        >
                                            {innerContent}
                                        </div>
                                    ) : (
                                        <a
                                            href={v.product_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] px-5 py-4 transition hover:border-[color:var(--catalog-outline-strong)] hover:shadow-[var(--catalog-shadow-md)]"
                                        >
                                            {innerContent}
                                        </a>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </main>
        </div>
    );
}
