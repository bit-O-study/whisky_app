import Image from "next/image";
import Link from "next/link";
import type { PriceHistoryPoint } from "../api/catalog-server";
import type { CatalogCardItem } from "../model/catalog";
import { sourceLabel } from "../model/catalog-filters";
import {
    detailBrand,
    detailMetaLine,
    detailName,
    isCostcoVendor,
    isStalePrice,
    onlineBestVendor,
    rankedVendors,
} from "../model/liquor-detail";
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

function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/** 상품 사진이 없을 때 — 밝은 바탕에 어울리는 병 윤곽. */
function BottlePlaceholder() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[color:var(--catalog-soft)]" data-testid="detail-image-placeholder">
            <svg className="h-32 w-32" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M27 6h10v10c0 3 6 5 6 12v28a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V28c0-7 6-9 6-12V6Z" strokeLinejoin="round" />
                <path d="M21 34h22M21 48h22" />
            </svg>
            <span className="text-xs">사진 준비 중</span>
        </div>
    );
}

export default function LiquorDetailView({ liquor, priceHistory = [] }: Props) {
    const vendors = rankedVendors(liquor.vendors);
    const bestVendor = vendors[0];
    const bestIsCostco = !!bestVendor && isCostcoVendor(bestVendor.source);
    const onlineBest = bestIsCostco ? onlineBestVendor(vendors) : null;
    const hasPrice = liquor.lowest_price > 0 && !!bestVendor;

    // 최저가 옆 갱신 시각은 그 최저가를 낸 판매처의 시각이다(다른 판매처의 최신 시각을 붙이면 오래된 최저가가 최신처럼 보인다).
    const bestCrawledAt = bestVendor?.crawled_at ?? null;
    const latestRelative = formatRelativeFromNow(bestCrawledAt);
    const latestExact = formatDateShort(bestCrawledAt);
    const bestStale = isStalePrice(bestCrawledAt);

    const brand = detailBrand(liquor.brand);
    const metaLine = detailMetaLine(liquor);
    const name = detailName(liquor.name, liquor.volume);

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
            <nav className="catalog-glass sticky top-0 z-50">
                <div className="mx-auto grid max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[color:var(--catalog-ink)] transition hover:bg-[color:var(--catalog-bg-secondary)]"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M15 19l-7-7 7-7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-semibold">목록</span>
                    </Link>
                    <span className="truncate text-center text-sm font-semibold text-[color:var(--catalog-muted)]">
                        {brand}
                    </span>
                    <div className="w-[4.5rem]" />
                </div>
            </nav>

            <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-8 sm:pb-32">
                {/* HERO */}
                <section className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pt-16">
                    <div className="catalog-bottle-well relative aspect-square overflow-hidden rounded-3xl border border-[color:var(--catalog-outline)] md:aspect-[4/5]">
                        {liquor.image_url ? (
                            <Image
                                src={liquor.image_url}
                                alt={liquor.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 55vw"
                                className="object-contain p-8 transition-transform duration-500 sm:p-12 [@media(hover:hover)]:hover:scale-[1.04]"
                                priority
                            />
                        ) : (
                            <BottlePlaceholder />
                        )}
                    </div>

                    <div className="flex min-w-0 flex-col">
                        {metaLine && (
                            <span className="catalog-kicker font-sans! tracking-[0.02em]!" data-testid="detail-meta">
                                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--catalog-primary)]" />
                                {metaLine}
                            </span>
                        )}

                        <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.25] tracking-[-0.02em] text-[color:var(--catalog-ink)] [text-wrap:balance] md:mt-5 md:text-[3rem] md:leading-[1.1]">
                            {name}
                        </h1>

                        <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-6">
                            {liquor.alcohol_percent > 0 && (
                                <span className="catalog-chip catalog-chip-ink font-sans! tracking-normal!">도수 {liquor.alcohol_percent}%</span>
                            )}
                            {liquor.volume > 0 && <span className="catalog-chip font-sans! normal-case! tracking-normal!">{liquor.volume}ml</span>}
                            {vendors.length > 0 && (
                                <span className="catalog-chip catalog-chip-soft font-sans! tracking-normal!">판매처 {vendors.length}곳</span>
                            )}
                        </div>

                        {/* 가격 카드 */}
                        <div className="mt-6 rounded-3xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] p-5 shadow-[var(--catalog-shadow-md)] sm:p-7 md:mt-8" data-testid="detail-price-card">
                            {hasPrice ? (
                                <>
                                    <p className="text-xs font-semibold text-[color:var(--catalog-primary)]">최저가</p>
                                    <p className="mt-1.5 whitespace-nowrap text-[2.25rem] font-bold leading-none tracking-tight text-[color:var(--catalog-ink)] sm:text-[2.6rem]">
                                        {formatPrice(liquor.lowest_price)}
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-[color:var(--catalog-muted)]">
                                        {sourceLabel(bestVendor.source)}
                                        {latestRelative && (
                                            <span className="font-normal text-[color:var(--catalog-soft)]" title={latestExact ?? undefined}>
                                                {" "}· 가격 갱신 {latestRelative}
                                            </span>
                                        )}
                                        {bestStale && (
                                            <span className="ml-1.5 rounded-full bg-[color:var(--catalog-bg-secondary)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--catalog-muted)]">오래된 가격</span>
                                        )}
                                    </p>

                                    {bestIsCostco ? (
                                        <div className="mt-5 space-y-3">
                                            <div className="rounded-2xl border border-dashed border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-secondary)] px-4 py-3">
                                                <p className="text-sm font-bold text-[color:var(--catalog-ink)]">코스트코는 매장에서만 파는 가격이에요</p>
                                                <p className="mt-0.5 text-xs text-[color:var(--catalog-muted)]">온라인 상품 페이지가 없으니 매장에서 확인해 주세요.</p>
                                            </div>
                                            {onlineBest && (
                                                <a
                                                    href={onlineBest.product_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="catalog-btn catalog-btn-pop w-full"
                                                    data-testid="detail-online-best"
                                                >
                                                    온라인 최저가 {formatPrice(onlineBest.current_price)} · {sourceLabel(onlineBest.source)}
                                                    <ArrowIcon />
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        bestVendor.product_url && (
                                            <a
                                                href={bestVendor.product_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="catalog-btn catalog-btn-pop mt-5 w-full"
                                            >
                                                {sourceLabel(bestVendor.source)}에서 최저가로 구매
                                                <ArrowIcon />
                                            </a>
                                        )
                                    )}
                                </>
                            ) : (
                                <div data-testid="detail-no-price">
                                    <p className="text-base font-bold text-[color:var(--catalog-ink)]">아직 가격을 모으는 중이에요</p>
                                    <p className="mt-1 text-sm text-[color:var(--catalog-muted)]">판매처 가격이 확인되면 여기에 최저가를 보여 드려요.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 맛 프로필 */}
                {showFlavor && (
                    <section className="mt-14 md:mt-20">
                        <div className="mb-4 flex items-end justify-between gap-3 md:mb-6">
                            <h2 className="text-xl font-bold tracking-[-0.015em] text-[color:var(--catalog-ink)] md:text-2xl">맛 프로필</h2>
                            <span className="text-xs text-[color:var(--catalog-muted)]">5점 만점</span>
                        </div>
                        <div className="grid gap-6 rounded-3xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] p-5 shadow-[var(--catalog-shadow-md)] sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-8">
                            <div className="mx-auto aspect-square w-full max-w-[18rem] md:max-w-[20rem]">
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
                                            <span className="w-16 shrink-0 text-sm font-bold text-[color:var(--catalog-ink)]">
                                                {FLAVOR_AXIS_LABELS[key as FlavorAxisKey]}
                                            </span>
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--catalog-bg-secondary)]">
                                                <div
                                                    className="h-full rounded-full bg-[color:var(--catalog-primary)] transition-[width]"
                                                    style={{ width: `${ratio * 100}%` }}
                                                />
                                            </div>
                                            <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-[color:var(--catalog-ink)]">
                                                {numeric === null ? "—" : numeric.toFixed(1)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </section>
                )}

                {/* 가격 추이 — 가격이 하나도 없는 상품은 숨긴다 */}
                {hasPrice && (
                    <section className="mt-14 md:mt-20">
                        <div className="mb-4 flex items-end justify-between gap-3 md:mb-6">
                            <h2 className="text-xl font-bold tracking-[-0.015em] text-[color:var(--catalog-ink)] md:text-2xl">가격 추이</h2>
                            <span className="text-xs text-[color:var(--catalog-muted)]">최근 90일</span>
                        </div>
                        <PriceTrendChart points={priceHistory} />
                    </section>
                )}

                {/* 판매처 리스트 */}
                {vendors.length > 0 && (
                    <section className="mt-14 md:mt-20">
                        <div className="mb-4 flex items-end justify-between gap-3 md:mb-6">
                            <h2 className="text-xl font-bold tracking-[-0.015em] text-[color:var(--catalog-ink)] md:text-2xl">판매처별 가격</h2>
                            <span className="text-xs text-[color:var(--catalog-muted)]">싼 순서 · {vendors.length}곳</span>
                        </div>

                        <ul className="space-y-2" data-testid="detail-vendors">
                            {vendors.map((v, idx) => {
                                const isCostco = isCostcoVendor(v.source);
                                const linked = !isCostco && !!v.product_url;
                                const stale = isStalePrice(v.crawled_at);
                                const relative = formatRelativeFromNow(v.crawled_at);
                                const innerContent = (
                                    <>
                                        <div className="min-w-0 flex-1">
                                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.95rem] font-semibold tracking-tight text-[color:var(--catalog-ink)]">
                                                <span className="truncate">{sourceLabel(v.source)}</span>
                                                {idx === 0 && (
                                                    <span className="rounded-full bg-[color:var(--catalog-primary-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--catalog-primary-strong)]">최저</span>
                                                )}
                                                {stale && (
                                                    <span className="rounded-full bg-[color:var(--catalog-bg-secondary)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--catalog-muted)]" data-testid="detail-stale">오래된 가격</span>
                                                )}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[color:var(--catalog-soft)]">
                                                {[isCostco ? "매장 전용" : "", relative ? `${relative} 확인` : ""].filter(Boolean).join(" · ")}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <div className="text-right">
                                                <p
                                                    className={`whitespace-nowrap text-[1.05rem] font-bold tabular-nums ${
                                                        idx === 0 ? "text-[color:var(--catalog-primary)]" : "text-[color:var(--catalog-ink)]"
                                                    }`}
                                                >
                                                    {formatPrice(v.current_price)}
                                                </p>
                                                {v.original_price > v.current_price && (
                                                    <p className="whitespace-nowrap text-[11px] tabular-nums text-[color:var(--catalog-soft)] line-through">
                                                        {formatPrice(v.original_price)}
                                                    </p>
                                                )}
                                            </div>
                                            {linked && (
                                                <svg
                                                    className="h-3.5 w-3.5 shrink-0 text-[color:var(--catalog-soft)] transition group-hover:translate-x-1 group-hover:text-[color:var(--catalog-primary)]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M9 5l7 7-7 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </>
                                );

                                return (
                                    <li key={`${v.source}-${idx}`}>
                                        {linked ? (
                                            <a
                                                href={v.product_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] px-4 py-3.5 transition hover:border-[color:var(--catalog-outline-strong)] hover:shadow-[var(--catalog-shadow-md)] sm:px-5 sm:py-4"
                                            >
                                                {innerContent}
                                            </a>
                                        ) : (
                                            <div
                                                className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-secondary)] px-4 py-3.5 sm:px-5 sm:py-4"
                                                aria-label={`${sourceLabel(v.source)} - 온라인 상품 페이지 없음`}
                                            >
                                                {innerContent}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    );
}
