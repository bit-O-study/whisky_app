import Image from "next/image";
import Link from "next/link";
import type { CatalogCardItem, CatalogCardVendor } from "../model/catalog";

type LiquorDetailItem = CatalogCardItem & {
    sweet?: number;
    smoky?: number;
    fruity?: number;
    body?: number;
};

interface Props {
    liquor: LiquorDetailItem;
}

function isKnownMetaValue(value: string) {
    return Boolean(value && value !== "Unknown");
}

export default function LiquorDetailView({liquor}: Props) {
    const formatPrice = (price: number) => price.toLocaleString("ko-KR") + "원";
    const headerMeta = [liquor.category, liquor.sub_category, liquor.country]
        .filter(isKnownMetaValue)
        .join(" · ");

    // 테이스팅 노트 그래프용 데이터
    const profiles = [
        {label: "Sweet", value: liquor.sweet || 0, color: "bg-pink-400"},
        {label: "Smoky", value: liquor.smoky || 0, color: "bg-stone-600"},
        {label: "Fruity", value: liquor.fruity || 0, color: "bg-orange-400"},
        {label: "Body", value: liquor.body || 0, color: "bg-slate-800"},
    ];

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* 1. 상단 네비게이션 */}
            <nav className="sticky top-0 z-50 flex items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-md">
                <Link href="/" className="p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </Link>
                <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{liquor.brand}</h1>
                <div className="w-10"/>
            </nav>

            <main className="mx-auto max-w-5xl pb-20">
                <div className="flex flex-col md:flex-row md:gap-12 md:pt-10">

                    {/* 2. 제품 이미지 섹션 */}
                    <section
                        className="relative aspect-square w-full bg-white md:w-1/2 md:rounded-3xl md:shadow-sm overflow-hidden">
                        <Image
                            src={liquor.image_url || "/default.webp"}
                            alt={liquor.name}
                            fill
                            className="object-contain p-12 transition-transform duration-700 hover:scale-110"
                            priority
                        />
                    </section>

                    {/* 3. 정보 섹션 */}
                    <section className="flex-1 px-5 pt-8 md:pt-0">
                        <header className="mb-10">
                            {headerMeta && (
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A96242]">
                                    {headerMeta}
                                </p>
                            )}
                            <h2 className="catalog-editorial text-4xl font-medium italic leading-tight text-[#1C1C17] md:text-5xl">
                                {liquor.name}
                            </h2>
                            <div className="mt-6 flex items-center gap-3">
                <span
                    className="rounded-full bg-[#1C1C17] px-3 py-1 text-[9px] font-black text-white uppercase tracking-tighter">
                  {liquor.alcohol_percent}% ABV
                </span>
                                <span className="text-sm text-gray-400 font-medium">{liquor.volume}ml</span>
                            </div>
                        </header>

                        {/* 가격 카드 (데일리샷 스타일) */}
                        <div
                            className="mb-12 rounded-3xl bg-white p-8 shadow-[0_20px_48px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.03]">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-gray-400">Lowest
                                        Price</p>
                                    <p className="catalog-editorial text-4xl font-bold italic text-[#A96242]">
                                        {formatPrice(liquor.lowest_price)}
                                    </p>
                                </div>
                                <div className="text-right text-[10px] font-bold text-gray-300">
                                    {liquor.vendors?.length} Vendors Comparison
                                </div>
                            </div>
                            <button
                                className="mt-8 w-full rounded-2xl bg-[#A96242] py-5 text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]">
                                판매처 비교하고 구매하기
                            </button>
                        </div>

                        {/* 테이스팅 프로필 */}
                        <div className="mb-12">
                            <h3 className="mb-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-800">Tasting
                                Profile</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                {profiles.map((p) => (
                                    <div key={p.label}>
                                        <div
                                            className="mb-2 flex justify-between text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                                            <span>{p.label}</span>
                                            <span className="text-gray-800">{Math.round(p.value * 100)}%</span>
                                        </div>
                                        <div className="h-0.5 w-full bg-gray-100">
                                            <div
                                                className={`h-full ${p.color} transition-all duration-1000`}
                                                style={{width: `${p.value * 100}%`}}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 판매처 리스트 */}
                        <div>
                            <h3 className="mb-6 border-b border-black/5 pb-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-800">Vendors
                                List</h3>
                            <div className="space-y-3">
                                {liquor.vendors?.map((v: CatalogCardVendor) => (
                                    <a
                                        key={v.source}
                                        href={v.product_url}
                                        target="_blank"
                                        className="flex items-center justify-between rounded-2xl bg-white p-5 ring-1 ring-black/[0.03] transition hover:ring-[#A96242]/20 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-50 text-[9px] font-black tracking-tighter text-gray-400 border border-black/5">
                                                {v.source}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{v.source}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-[#1C1C17]">{formatPrice(v.current_price)}</p>
                                            {v.discount_percent > 0 && (
                                                <p className="text-[9px] font-bold text-gray-400">
                                                    {v.discount_percent}% off · {formatPrice(v.original_price)}
                                                </p>
                                            )}
                                            <p className="text-[9px] font-bold text-[#A96242]">상세보기 〉</p>
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
