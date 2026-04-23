import Image from "next/image";
import Link from "next/link";

interface Props {
    liquor: any;
}

function formatPrice(price: number) {
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return "—";
    return price.toLocaleString("ko-KR") + "원";
}

export default function LiquorDetailView({ liquor }: Props) {
    const sortedVendors = (liquor.vendors ?? []).slice().sort((a: any, b: any) => a.current_price - b.current_price);
    const bestVendor = sortedVendors[0];

    return (
        <div className="min-h-screen bg-[color:var(--catalog-bg-solid)] text-[color:var(--catalog-ink)]">
            {/* 상단 nav */}
            <nav className="catalog-glass sticky top-0 z-50 border-b border-[color:var(--catalog-hairline)]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[color:var(--catalog-ink-soft)] transition hover:text-[color:var(--catalog-primary)]"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 19l-7-7 7-7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em]">Back</span>
                    </Link>
                    <span className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-muted)]">
                        {liquor.brand}
                    </span>
                    <div className="w-12" />
                </div>
            </nav>

            <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-8">
                {/* HERO */}
                <section className="grid grid-cols-1 gap-10 pt-12 md:grid-cols-[1.1fr_1fr] md:gap-14 md:pt-20">
                    {/* 이미지 well */}
                    <div className="catalog-bottle-well relative aspect-[4/5] overflow-hidden rounded-3xl border border-[color:var(--catalog-outline)]">
                        <Image
                            src={liquor.image_url || "/default.webp"}
                            alt={liquor.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 55vw"
                            className="object-contain p-12 transition-transform duration-700 hover:scale-[1.03]"
                            priority
                        />
                    </div>

                    {/* 정보 */}
                    <div className="flex flex-col">
                        <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-primary)]">
                            {liquor.category} · {liquor.country}
                        </p>

                        <h1 className="mt-5 catalog-editorial text-[2.6rem] font-medium italic leading-[1.05] tracking-[-0.022em] text-[color:var(--catalog-ink)] md:text-[3.2rem]">
                            {liquor.name}
                        </h1>

                        <div className="mt-7 flex items-center gap-3">
                            <span className="catalog-chip">
                                <span className="catalog-mono">{liquor.alcohol_percent}% ABV</span>
                            </span>
                            <span className="catalog-mono text-sm font-semibold tracking-wide text-[color:var(--catalog-muted)]">
                                {liquor.volume}ml
                            </span>
                        </div>

                        {/* 가격 카드 */}
                        <div className="mt-10 rounded-2xl border border-[color:var(--catalog-outline-strong)] bg-[color:var(--catalog-surface-strong)] p-7">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-primary)]">
                                        Lowest Price
                                    </p>
                                    <p className="mt-2 catalog-mono text-[2.4rem] font-bold leading-none text-[color:var(--catalog-ink)]">
                                        {formatPrice(liquor.lowest_price)}
                                    </p>
                                    {bestVendor && (
                                        <p className="mt-2 catalog-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">
                                            via {bestVendor.source}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-muted)]">
                                        Vendors
                                    </p>
                                    <p className="mt-2 catalog-mono text-[1.6rem] font-bold leading-none text-[color:var(--catalog-ink-soft)]">
                                        {sortedVendors.length}
                                    </p>
                                </div>
                            </div>

                            {bestVendor?.product_url && (
                                <a
                                    href={bestVendor.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--catalog-primary)] px-6 py-4 catalog-mono text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--catalog-bg-solid)] transition hover:bg-[color:var(--catalog-primary-strong)]"
                                >
                                    최저가 판매처로 이동
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* 판매처 리스트 */}
                <section className="mt-20">
                    <div className="mb-6 flex items-end justify-between border-b border-[color:var(--catalog-hairline)] pb-4">
                        <h2 className="catalog-editorial text-2xl font-medium italic tracking-[-0.015em] text-[color:var(--catalog-ink)]">
                            모든 판매처
                        </h2>
                        <span className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--catalog-muted)]">
                            {sortedVendors.length} listed
                        </span>
                    </div>

                    <ul className="space-y-2">
                        {sortedVendors.map((v: any, idx: number) => (
                            <li key={v.source}>
                                <a
                                    href={v.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between gap-4 rounded-xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] px-5 py-4 transition hover:border-[color:var(--catalog-outline-strong)] hover:bg-[color:var(--catalog-surface-elevated)]"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="catalog-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-soft)]">
                                            {String(idx + 1).padStart(2, "0")}
                                        </span>
                                        <div className="flex h-10 w-14 items-center justify-center rounded-md border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-strong)]">
                                            <span className="catalog-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-ink-soft)]">
                                                {v.source.slice(0, 4)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="catalog-mono text-sm font-semibold tracking-wide text-[color:var(--catalog-ink)]">
                                                {v.source}
                                            </p>
                                            {v.original_price > v.current_price && (
                                                <p className="mt-0.5 catalog-mono text-[10px] text-[color:var(--catalog-soft)] line-through">
                                                    {formatPrice(v.original_price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`catalog-mono text-base font-bold ${
                                                idx === 0
                                                    ? "text-[color:var(--catalog-primary)]"
                                                    : "text-[color:var(--catalog-ink)]"
                                            }`}
                                        >
                                            {formatPrice(v.current_price)}
                                        </span>
                                        <svg
                                            className="h-3.5 w-3.5 text-[color:var(--catalog-soft)] transition group-hover:translate-x-1 group-hover:text-[color:var(--catalog-primary)]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M9 5l7 7-7 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
        </div>
    );
}
