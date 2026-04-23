import Image from "next/image";
import Link from "next/link";

interface Props {
    liquor: any; // 추후 CatalogCardItem을 확장한 상세 타입으로 교체
}

export default function LiquorDetailView({liquor}: Props) {
    const formatPrice = (price: number) => price.toLocaleString("ko-KR") + "원";

    return (
        <div className="min-h-screen bg-[color:var(--catalog-bg-solid)]">
            {/* 상단 네비게이션 */}
            <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[color:var(--catalog-hairline)] bg-[color:var(--catalog-surface-soft)] px-4 py-3 backdrop-blur-md">
                <Link href="/" className="-ml-2 rounded-full p-2 transition hover:bg-black/[0.04]">
                    <svg className="h-5 w-5 text-[color:var(--catalog-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 19l-7-7 7-7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </Link>
                <h1 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--catalog-muted)]">{liquor.brand}</h1>
                <div className="w-9"/>
            </nav>

            <main className="mx-auto max-w-5xl pb-24">
                <div className="flex flex-col md:flex-row md:gap-12 md:pt-12">

                    {/* 제품 이미지 */}
                    <section
                        className="relative aspect-square w-full overflow-hidden bg-white md:w-1/2 md:rounded-[1.75rem] md:ring-1 md:ring-black/[0.04] md:shadow-[0_14px_36px_rgba(28,28,23,0.04)]">
                        <Image
                            src={liquor.image_url || "/default.webp"}
                            alt={liquor.name}
                            fill
                            className="object-contain p-12 transition-transform duration-500 hover:scale-[1.04]"
                            priority
                        />
                    </section>

                    {/* 정보 */}
                    <section className="flex-1 px-6 pt-10 md:pt-2">
                        <header className="mb-12">
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--catalog-primary)]">
                                {liquor.category} · {liquor.country}
                            </p>
                            <h2 className="catalog-editorial text-[2.4rem] font-medium italic leading-[1.1] tracking-[-0.02em] text-[color:var(--catalog-ink)] md:text-[3rem]">
                                {liquor.name}
                            </h2>
                            <div className="mt-7 flex items-center gap-3">
                                <span className="rounded-full bg-[color:var(--catalog-ink)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                    {liquor.alcohol_percent}% ABV
                                </span>
                                <span className="text-sm font-medium text-[color:var(--catalog-muted)]">{liquor.volume}ml</span>
                            </div>
                        </header>

                        {/* 가격 카드 */}
                        <div className="mb-14 rounded-[1.75rem] bg-white p-8 ring-1 ring-black/[0.04] shadow-[0_14px_36px_rgba(28,28,23,0.04)]">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--catalog-muted)]">
                                        Lowest Price
                                    </p>
                                    <p className="catalog-editorial text-[2.4rem] font-medium italic leading-none text-[color:var(--catalog-primary)]">
                                        {formatPrice(liquor.lowest_price)}
                                    </p>
                                </div>
                                <div className="text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-muted)]">
                                    {liquor.vendors?.length} Vendors
                                </div>
                            </div>
                            <button
                                className="mt-8 w-full rounded-2xl bg-[color:var(--catalog-primary-strong)] py-4 text-sm font-semibold tracking-wide text-white transition hover:brightness-105 active:scale-[0.99]">
                                판매처 비교하고 구매하기
                            </button>
                        </div>

                        {/* 판매처 리스트 */}
                        <div>
                            <h3 className="mb-5 border-b border-black/[0.06] pb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[color:var(--catalog-ink)]">
                                Vendors List
                            </h3>
                            <div className="space-y-2.5">
                                {liquor.vendors?.map((v: any) => (
                                    <a
                                        key={v.source}
                                        href={v.product_url}
                                        target="_blank"
                                        className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-black/[0.04] transition hover:ring-[color:rgba(169,98,66,0.28)] hover:shadow-[0_10px_24px_rgba(28,28,23,0.05)]"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(247,243,234,0.94)] text-[9px] font-bold uppercase tracking-[0.1em] text-[color:var(--catalog-muted)] ring-1 ring-black/[0.04]">
                                                {v.source.slice(0, 3)}
                                            </div>
                                            <span className="text-sm font-semibold tracking-wide text-[color:var(--catalog-ink)]">{v.source}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[0.95rem] font-bold text-[color:var(--catalog-ink)]">{formatPrice(v.current_price)}</p>
                                            <p className="mt-0.5 text-[10px] font-bold tracking-[0.1em] text-[color:var(--catalog-primary)]">상세보기 〉</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}