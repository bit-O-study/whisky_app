import Image from "next/image";
import Link from "next/link";
import type { PriceHistoryPoint } from "../api/catalog-server";
import type { CatalogCardItem, CatalogCardVendor } from "../model/catalog";
import { categoryLabel, sourceLabel } from "../model/catalog-filters";
import {
    detailBrand,
    detailName,
    isCostcoVendor,
    isStalePrice,
    priceSummary,
    rankedVendors,
    tasteSummary,
} from "../model/liquor-detail";
import { checkedDate, priceFreshness } from "../model/price-freshness";
import FreshnessChip from "./FreshnessChip";
import PriceTrendChart from "./PriceTrendChart";
import ReportIssueButton from "./ReportIssueButton";
import ShareButton from "./ShareButton";
import {
    FLAVOR_AXIS_KEYS,
    FLAVOR_AXIS_LABELS,
    type FlavorAxisKey,
} from "../../admin/liquor-info/model/admin-liquor-info";

interface Props {
    liquor: CatalogCardItem;
    priceHistory?: PriceHistoryPoint[];
    /** 신고 테이블이 준비된 경우에만 "알려 주기"를 보여 준다. */
    reportEnabled?: boolean;
    /** 같은 브랜드의 다른 상품(가격 있는 것만). */
    sameBrand?: CatalogCardItem[];
}

const won = (price: number) => price.toLocaleString("ko-KR") + "원";

const DOT_COLOR = { new: "bg-[#1f7a45]", mid: "bg-[#6b778d]", stale: "bg-[#b36b00]", unknown: "bg-[#c9d1de]" } as const;

const isBlank = (value?: string | null) => !value?.trim() || value.trim().toLowerCase() === "unknown";

function ArrowUpRight() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17L17 7" />
            <path d="M8 7h9v9" />
        </svg>
    );
}

/** 상품 사진이 없을 때 — 밝은 바탕에 어울리는 병 윤곽. */
function BottlePlaceholder({ small = false }: { small?: boolean }) {
    return (
        <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-[color:var(--catalog-soft)]" data-testid="detail-image-placeholder">
            <svg className={small ? "h-10 w-10" : "h-14 w-14"} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M27 6h10v10c0 3 6 5 6 12v28a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V28c0-7 6-9 6-12V6Z" strokeLinejoin="round" />
                <path d="M21 34h22" />
            </svg>
            {!small && <span className="text-xs">사진 준비 중</span>}
        </span>
    );
}

function SectionHead({ id, title, aside }: { id: string; title: string; aside?: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <h2 id={id} className="text-lg font-extrabold tracking-[-0.01em] text-[color:var(--catalog-ink)] md:text-xl">
                {title}
            </h2>
            {aside && <span className="text-xs text-[color:var(--catalog-muted)]">{aside}</span>}
        </div>
    );
}

function VendorRow({ vendor, lowestPrice, first }: { vendor: CatalogCardVendor; lowestPrice: number; first: boolean }) {
    const storeOnly = isCostcoVendor(vendor.source);
    const linked = !storeOnly && !!vendor.product_url;
    const fresh = priceFreshness(vendor.crawled_at);
    const stale = isStalePrice(vendor.crawled_at);
    const isLowest = vendor.current_price === lowestPrice;
    const name = sourceLabel(vendor.source);
    const date = checkedDate(vendor.crawled_at);
    const body = (
        <>
            <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[fresh.tone]}`} aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-[15px] font-bold text-[color:var(--catalog-ink)]">
                    <span className="truncate">{name}</span>
                    {storeOnly && (
                        <span className="shrink-0 rounded-md bg-[#eef1f6] px-1.5 py-px text-[11px] font-bold text-[#4f5d77]">매장 전용</span>
                    )}
                </span>
                <span className="text-xs text-[color:var(--catalog-muted)]" data-testid="vendor-checked">
                    {[date ? `${date} 확인` : "", fresh.tone !== "unknown" ? fresh.label : ""].filter(Boolean).join(" · ")}
                </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className={`whitespace-nowrap text-base font-extrabold tabular-nums ${stale ? "text-[#6b778d]" : "text-[color:var(--catalog-ink)]"}`}>
                    {won(vendor.current_price)}
                </span>
                <span className={`whitespace-nowrap text-[11px] font-bold ${isLowest ? "text-[color:var(--catalog-primary-strong)]" : "text-[#6b778d]"}`}>
                    {isLowest ? "최저" : `+${won(vendor.current_price - lowestPrice)}`}
                </span>
            </span>
            <span className="w-4 shrink-0 text-sm text-[#8a94a8]" aria-hidden="true">
                {linked ? "›" : ""}
            </span>
        </>
    );
    const rowClass = `flex min-h-[72px] items-center gap-3 px-3.5 py-3 ${first ? "" : "border-t border-[#edf0f6]"} ${stale ? "bg-[#fbfcfe]" : "bg-[color:var(--catalog-surface)]"}`;
    return (
        <li>
            {linked ? (
                <a
                    href={vendor.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${name} ${won(vendor.current_price)}, 판매처 페이지 열기`}
                    className={`${rowClass} transition hover:bg-[#f5f8ff]`}
                >
                    {body}
                </a>
            ) : (
                <div className={rowClass} aria-label={`${name} ${won(vendor.current_price)}${storeOnly ? ", 매장 전용" : ", 판매처 페이지 없음"}`}>
                    {body}
                </div>
            )}
        </li>
    );
}

export default function LiquorDetailView({ liquor, priceHistory = [], reportEnabled = false, sameBrand = [] }: Props) {
    const vendors = rankedVendors(liquor.vendors);
    const summary = priceSummary(vendors);
    const hero = summary.hero;
    const heroStale = !summary.recent;
    const buy = summary.buy;

    const brand = detailBrand(liquor.brand);
    const category = categoryLabel(liquor.sub_category || "") || categoryLabel(liquor.category || "");
    const country = isBlank(liquor.country) ? "" : liquor.country.trim();
    const metaLine = [category, brand].filter(Boolean).join(" · ");
    const name = detailName(liquor.name, liquor.volume);

    const flavor: Record<FlavorAxisKey, number | null> = {
        sweet: liquor.sweet,
        smoky: liquor.smoky,
        fruity: liquor.fruity,
        spicy: liquor.spicy,
        woody: liquor.woody,
        body: liquor.body,
    };
    const hasFlavor = Object.values(flavor).some((v) => typeof v === "number" && Number.isFinite(v));
    const tasteLine = tasteSummary(flavor);

    const infoRows = [
        ["분류", category],
        ["브랜드", brand],
        ["원산지", country],
        ["용량", liquor.volume > 0 ? `${liquor.volume.toLocaleString("ko-KR")}ml` : ""],
        ["도수", liquor.alcohol_percent > 0 ? `${liquor.alcohol_percent}%` : ""],
    ].filter(([, value]) => value);

    const tabs = [
        vendors.length ? { href: "#prices", label: "판매처 가격" } : null,
        vendors.length ? { href: "#trend", label: "가격 추이" } : null,
        hasFlavor ? { href: "#taste", label: "맛" } : null,
        { href: "#info", label: "정보" },
    ].filter((tab): tab is { href: string; label: string } => !!tab);

    return (
        <div className="min-h-screen bg-[color:var(--catalog-bg-solid)] text-[color:var(--catalog-ink)]">
            <header className="sticky top-0 z-50 border-b border-[#edf0f6] bg-[color:var(--catalog-bg-solid)]">
                <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-2 sm:px-6">
                    <Link
                        href="/"
                        aria-label="목록으로"
                        className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--catalog-ink)] transition hover:bg-[color:var(--catalog-bg-secondary)]"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <span className="truncate text-center text-[15px] font-bold">{brand}</span>
                    <ShareButton title={`${name} 최저가 | 위스키다모아`} />
                </div>
            </header>

            <main className="mx-auto max-w-6xl pb-32 md:px-6 md:pb-24">
                <div className="md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-10 md:pt-10">
                    {/* 상품 머리 — 휴대폰은 작은 사진 옆에 이름, PC는 큰 사진 아래 이름 */}
                    <section className="flex gap-4 px-5 pt-5 md:flex-col md:gap-6 md:px-0 md:pt-0">
                        <div className="catalog-bottle-well relative h-[156px] w-[116px] shrink-0 overflow-hidden rounded-2xl md:aspect-[4/3] md:h-auto md:w-full md:rounded-3xl">
                            {liquor.image_url ? (
                                <Image
                                    src={liquor.image_url}
                                    alt={liquor.name}
                                    fill
                                    sizes="(max-width: 768px) 116px, 640px"
                                    className="object-contain p-3 md:p-10"
                                    priority
                                />
                            ) : (
                                <BottlePlaceholder />
                            )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                            {metaLine && (
                                <span className="text-xs font-bold text-[color:var(--catalog-primary-text)]" data-testid="detail-meta">
                                    {metaLine}
                                </span>
                            )}
                            <h1 className="text-[22px] font-extrabold leading-[1.3] tracking-[-0.02em] [text-wrap:balance] md:text-[2.25rem] md:leading-[1.2]">
                                {name}
                            </h1>
                            <div className="flex flex-wrap gap-1.5">
                                {liquor.alcohol_percent > 0 && (
                                    <span className="rounded-full bg-[color:var(--catalog-ink)] px-2.5 py-0.5 text-xs font-bold text-white">도수 {liquor.alcohol_percent}%</span>
                                )}
                                {liquor.volume > 0 && (
                                    <span className="rounded-full bg-[#f0f3f8] px-2.5 py-0.5 text-xs font-bold text-[#33405a]">{liquor.volume.toLocaleString("ko-KR")}ml</span>
                                )}
                                {vendors.length > 0 && (
                                    <span className="rounded-full bg-[color:var(--catalog-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[color:var(--catalog-primary-strong)]">판매처 {vendors.length}곳</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 최저가 — 최근 30일 가격이 있으면 그중 최저, 더 싼 오래된 가격은 따로 알린다 */}
                    <aside className="px-5 pt-5 md:sticky md:top-20 md:px-0 md:pt-0">
                        {hero ? (
                            <section aria-label="최저가" className="flex flex-col gap-2.5 rounded-[18px] bg-[#f5f8ff] p-[18px] md:p-6" data-testid="detail-price-card">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[13px] font-bold text-[color:var(--catalog-primary-strong)]" data-testid="detail-price-basis">
                                        {summary.recent ? "최근 30일 최저가" : "최저가"}
                                    </span>
                                    <span className="text-xs text-[color:var(--catalog-muted)]">가격은 판매처에서 최종 확인</span>
                                </div>
                                <strong
                                    className={`whitespace-nowrap text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] tabular-nums ${heroStale ? "text-[#6b778d]" : ""}`}
                                    data-testid="detail-hero-price"
                                >
                                    {won(hero.current_price)}
                                </strong>
                                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" data-testid="detail-best-meta">
                                    <b>
                                        {sourceLabel(hero.source)}
                                        {isCostcoVendor(hero.source) ? " · 매장 전용" : ""}
                                    </b>
                                    {checkedDate(hero.crawled_at) && (
                                        <span className="text-[color:var(--catalog-muted)]">{checkedDate(hero.crawled_at)} 확인</span>
                                    )}
                                    <FreshnessChip crawledAt={hero.crawled_at} />
                                </p>
                                {heroStale && (
                                    <p className="text-xs text-[color:var(--catalog-muted)]">한 달 넘게 확인하지 못한 가격이에요. 판매처에서 지금 가격을 꼭 확인해 주세요.</p>
                                )}
                                {summary.olderCheaper && (
                                    <div className="flex items-start gap-2.5 rounded-xl border border-[#e3e9f5] bg-white px-3 py-2.5 text-[13px] text-[#33405a]" data-testid="detail-older-cheaper">
                                        <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8f5300" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M12 7v6" />
                                            <path d="M12 16.5v.5" />
                                        </svg>
                                        <span>
                                            {sourceLabel(summary.olderCheaper.source)}
                                            {isCostcoVendor(summary.olderCheaper.source) ? " 매장" : ""} {won(summary.olderCheaper.current_price)}이 더 싸지만{" "}
                                            {checkedDate(summary.olderCheaper.crawled_at) ?? "예전"}에 확인한 가격이에요.
                                            {isCostcoVendor(summary.olderCheaper.source) ? " 매장에서 확인해 주세요." : " 판매처에서 확인해 주세요."}
                                        </span>
                                    </div>
                                )}
                                {buy && (
                                    <a
                                        href={buy.product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 hidden min-h-[52px] items-center justify-center gap-1.5 rounded-[14px] bg-[color:var(--catalog-primary)] text-base font-extrabold text-white transition hover:bg-[color:var(--catalog-primary-strong)] md:flex"
                                    >
                                        {sourceLabel(buy.source)}에서 {won(buy.current_price)}에 구매
                                        <ArrowUpRight />
                                    </a>
                                )}
                            </section>
                        ) : (
                            <section aria-label="가격" className="flex flex-col gap-2.5 rounded-[18px] bg-[#f5f7fb] p-5" data-testid="detail-no-price">
                                <p className="text-[17px] font-extrabold">아직 가격을 확인하지 못했어요</p>
                                <p className="text-sm text-[#33405a]">가격을 모으면 여기에 최저가를 보여 드려요.</p>
                            </section>
                        )}
                    </aside>
                </div>

                {tabs.length > 1 && (
                    <nav aria-label="상세 섹션" className="sticky top-14 z-40 mt-5 flex gap-3 overflow-x-auto border-b border-[#edf0f6] bg-[color:var(--catalog-bg-solid)] px-5 md:mt-10 md:px-0">
                        {tabs.map((tab) => (
                            <a key={tab.href} href={tab.href} className="shrink-0 px-1 py-3 text-sm font-semibold text-[color:var(--catalog-muted)] hover:text-[color:var(--catalog-ink)]">
                                {tab.label}
                            </a>
                        ))}
                    </nav>
                )}

                <div className="md:max-w-[calc(100%-420px)]">
                    {vendors.length > 0 && (
                        <section aria-labelledby="prices" className="flex scroll-mt-28 flex-col gap-3 px-5 pt-5 md:px-0 md:pt-8">
                            <SectionHead id="prices" title="판매처별 가격" aside="싼 순서" />
                            <div className="flex flex-wrap gap-3.5 text-xs text-[color:var(--catalog-muted)]">
                                <span className="inline-flex items-center gap-1.5"><span className={`h-[7px] w-[7px] rounded-full ${DOT_COLOR.new}`} />7일 이내</span>
                                <span className="inline-flex items-center gap-1.5"><span className={`h-[7px] w-[7px] rounded-full ${DOT_COLOR.mid}`} />30일 이내</span>
                                <span className="inline-flex items-center gap-1.5"><span className={`h-[7px] w-[7px] rounded-full ${DOT_COLOR.stale}`} />30일 넘음</span>
                            </div>
                            <ul className="overflow-hidden rounded-2xl border border-[#e3e9f2]" data-testid="detail-vendors">
                                {vendors.map((v, idx) => (
                                    <VendorRow key={`${v.source}-${idx}`} vendor={v} lowestPrice={summary.lowestPrice} first={idx === 0} />
                                ))}
                            </ul>
                            {reportEnabled && (
                                <ReportIssueButton
                                    liquorId={liquor.id}
                                    liquorName={name}
                                    vendors={vendors.map((v) => ({ source: v.source, label: sourceLabel(v.source) }))}
                                />
                            )}
                        </section>
                    )}

                    {vendors.length > 0 && (
                        <section aria-labelledby="trend" className="flex scroll-mt-28 flex-col gap-3 px-5 pt-8 md:px-0 md:pt-12">
                            <SectionHead id="trend" title="가격 추이" aside="최근 90일 · 판매처 최저가" />
                            <PriceTrendChart points={priceHistory} />
                        </section>
                    )}

                    {hasFlavor && (
                        <section aria-labelledby="taste" className="flex scroll-mt-28 flex-col gap-3 px-5 pt-8 md:px-0 md:pt-12">
                            <SectionHead id="taste" title="맛" aside="5점 만점" />
                            {tasteLine && <p className="text-sm font-bold">{tasteLine}</p>}
                            <ul className="flex flex-col gap-2.5">
                                {FLAVOR_AXIS_KEYS.map((key) => {
                                    const value = flavor[key as FlavorAxisKey];
                                    const numeric = typeof value === "number" && Number.isFinite(value) ? value : null;
                                    const ratio = numeric === null ? 0 : Math.max(0, Math.min(1, numeric / 5));
                                    return (
                                        <li key={key} className="grid grid-cols-[56px_minmax(0,1fr)_32px] items-center gap-2.5 text-[13px]">
                                            <span className="font-bold">{FLAVOR_AXIS_LABELS[key as FlavorAxisKey]}</span>
                                            <span className="h-2 overflow-hidden rounded-full bg-[#eef1f6]">
                                                <span
                                                    className={`block h-full rounded-full ${numeric !== null && numeric >= 3.5 ? "bg-[color:var(--catalog-primary)]" : "bg-[#9db7f5]"}`}
                                                    style={{ width: `${ratio * 100}%` }}
                                                />
                                            </span>
                                            <span className="text-right font-bold tabular-nums">{numeric === null ? "—" : numeric.toFixed(1)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    <section aria-labelledby="info" className="flex scroll-mt-28 flex-col gap-3 px-5 pt-8 md:px-0 md:pt-12">
                        <SectionHead id="info" title="상품 정보" />
                        <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-sm" data-testid="detail-info">
                            {infoRows.map(([label, value]) => (
                                <div key={label} className="contents">
                                    <dt className="text-[color:var(--catalog-muted)]">{label}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>
                        {infoRows.length < 5 && (
                            <p className="text-[13px] text-[color:var(--catalog-muted)]">비어 있는 항목은 정리 중이라 보여 주지 않아요.</p>
                        )}
                    </section>

                    {sameBrand.length > 0 && (
                        <section aria-labelledby="same-brand" className="flex flex-col gap-3 pt-8 md:pt-12">
                            <div className="px-5 md:px-0">
                                <SectionHead id="same-brand" title="같은 브랜드" />
                            </div>
                            <ul className="flex gap-2.5 overflow-x-auto px-5 pb-1 md:px-0" data-testid="detail-same-brand">
                                {sameBrand.map((item) => {
                                    const itemHero = priceSummary(item.vendors).hero;
                                    return (
                                        <li key={item.id} className="w-[160px] shrink-0">
                                            <Link
                                                href={`/liquor/${item.id}`}
                                                className="flex h-full flex-col gap-1.5 rounded-[14px] border border-[#e3e9f2] p-3 transition hover:border-[color:var(--catalog-primary)]"
                                            >
                                                <span className="catalog-bottle-well relative block h-[88px] overflow-hidden rounded-[10px]">
                                                    {item.image_url ? (
                                                        <Image src={item.image_url} alt="" fill sizes="160px" className="object-contain p-2" />
                                                    ) : (
                                                        <BottlePlaceholder small />
                                                    )}
                                                </span>
                                                <span className="line-clamp-2 text-[13px] font-bold">{detailName(item.name, item.volume)}</span>
                                                {itemHero && (
                                                    <span className="text-[15px] font-extrabold text-[color:var(--catalog-primary)]">{won(itemHero.current_price)}</span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}
                </div>
            </main>

            {/* 휴대폰 아래 고정 구매 버튼 */}
            {buy && (
                <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-[#edf0f6] bg-[color:var(--catalog-bg-solid)] px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 md:hidden" data-testid="detail-buy-bar">
                    <div className="flex flex-col">
                        <span className="text-xs text-[color:var(--catalog-muted)]">
                            {sourceLabel(buy.source)}
                            {priceFreshness(buy.crawled_at).tone !== "unknown" ? ` · ${priceFreshness(buy.crawled_at).label} 확인` : ""}
                        </span>
                        <strong className="whitespace-nowrap text-lg font-extrabold tabular-nums">{won(buy.current_price)}</strong>
                    </div>
                    <a
                        href={buy.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[52px] flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[color:var(--catalog-primary)] text-base font-extrabold text-white"
                    >
                        구매하러 가기
                        <ArrowUpRight />
                    </a>
                </div>
            )}
        </div>
    );
}
