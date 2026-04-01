import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchLiquorDetailFromServer } from "../../../src/features/catalog/api/catalog-server";

interface LiquorDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatPrice(price: number) {
  return price > 0 ? `${price.toLocaleString("ko-KR")}원` : "가격 확인 중";
}

function formatMetaValue(value: string, fallback: string) {
  return value && value !== "Unknown" ? value : fallback;
}

function hasDistinctVendorLinks(productUrls: string[]) {
  const normalizedUrls = productUrls.filter(Boolean);
  return normalizedUrls.length > 0 && new Set(normalizedUrls).size === normalizedUrls.length;
}

export default async function LiquorDetailPage({ params }: LiquorDetailPageProps) {
  const resolvedParams = await params;
  const id = Number.parseInt(resolvedParams.id, 10);
  const detail = await fetchLiquorDetailFromServer({ id });

  if (!detail) {
    notFound();
  }

  const liquor = detail.item;
  const canOpenVendorLinks = hasDistinctVendorLinks(liquor.vendors.map((vendor) => vendor.product_url));

  return (
    <main className="catalog-shell min-h-screen pb-24">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="catalog-kicker inline-flex items-center gap-2 text-[color:var(--catalog-primary)] transition hover:opacity-80"
        >
          <span aria-hidden="true">←</span>
          카탈로그로 돌아가기
        </Link>

        <div className="catalog-panel mt-8 overflow-hidden rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,241,0.96))]">
          <div className="grid gap-0 lg:grid-cols-[0.94fr_1.06fr] lg:items-stretch">
            <div className="relative min-h-[23rem] bg-[rgba(255,255,255,0.4)] lg:min-h-[34rem]">
              <div className="absolute inset-x-[16%] top-12 h-[68%] rounded-full bg-[radial-gradient(circle,rgba(169,98,66,0.12),transparent_72%)] blur-3xl" />
              <Image
                src={liquor.image_url || "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp"}
                alt={liquor.name}
                fill
                className="object-contain p-8 sm:p-10"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                priority
              />

            </div>

            <div className="min-w-0 border-t border-[color:rgba(216,195,180,0.16)] bg-[rgba(255,255,255,0.16)] px-6 py-6 sm:px-7 sm:py-7 lg:border-l lg:border-t-0">
              <div className="max-w-xl min-w-0">
                <p className="catalog-kicker text-[color:var(--catalog-primary)]">
                  {formatMetaValue(liquor.category, "분류 미상")} · {formatMetaValue(liquor.country, "원산지 미상")}
                </p>
                <h1 className="catalog-editorial mt-3 break-words text-[clamp(1.8rem,3vw,2.75rem)] font-semibold italic leading-[1.08] tracking-[-0.03em] text-[color:var(--catalog-ink)]">
                  {liquor.name}
                </h1>
              </div>

              <div className="mt-6 rounded-[1.4rem] bg-[rgba(250,247,241,0.78)] px-5 py-5 ring-1 ring-[color:rgba(216,195,180,0.12)]">
                <dl className="grid grid-cols-3 gap-x-6 gap-y-6">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-primary)]">
                      원산지
                    </dt>
                    <dd className="catalog-editorial mt-2 text-lg font-medium italic text-[color:var(--catalog-ink)]">
                      {formatMetaValue(liquor.country, "미상")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-primary)]">
                      도수
                    </dt>
                    <dd className="catalog-editorial mt-2 text-lg font-medium italic text-[color:var(--catalog-ink)]">
                      {liquor.alcohol_percent > 0 ? `${liquor.alcohol_percent}%` : "--"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-primary)]">
                      용량
                    </dt>
                    <dd className="catalog-editorial mt-2 text-lg font-medium italic text-[color:var(--catalog-ink)]">
                      {liquor.volume > 0 ? `${liquor.volume}ml` : "--"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 rounded-[1.4rem] bg-[rgba(250,247,241,0.78)] px-5 py-5 ring-1 ring-[color:rgba(216,195,180,0.12)]">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="catalog-kicker text-[color:var(--catalog-primary)]">판매처 가격</p>
                    <h2 className="catalog-editorial mt-2 text-[1.55rem] font-semibold italic tracking-[-0.03em] text-[color:var(--catalog-ink)]">
                      구매 링크
                    </h2>
                  </div>
                  <p className="text-sm text-[color:var(--catalog-muted)]">낮은 가격순</p>
                </div>

                <div className="space-y-2.5">
                  {liquor.vendors.map((vendor, index) => {
                    const content = (
                      <div className="flex items-center justify-between gap-5">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--catalog-primary)]">
                            {index === 0 ? "최저가" : "판매처"}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="catalog-editorial text-[1.55rem] font-medium italic text-[color:var(--catalog-ink)]">
                              {vendor.source}
                            </span>
                            {index === 0 && (
                              <span className="catalog-chip catalog-chip-warm text-[9px] tracking-[0.12em]">
                                최저가
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {vendor.original_price > vendor.current_price && (
                            <span className="block text-xs text-[color:var(--catalog-soft)] line-through">
                              {formatPrice(vendor.original_price)}
                            </span>
                          )}
                          <span className="catalog-editorial block text-[1.65rem] font-medium italic leading-none text-[color:var(--catalog-primary)]">
                            {formatPrice(vendor.current_price)}
                          </span>
                        </div>
                      </div>
                    );

                    if (!canOpenVendorLinks) {
                      return (
                        <div
                          key={vendor.source}
                          className="rounded-[1.25rem] bg-[rgba(255,255,255,0.72)] px-4 py-4 ring-1 ring-[color:rgba(216,195,180,0.1)]"
                        >
                          {content}
                        </div>
                      );
                    }

                    return (
                      <a
                        key={vendor.source}
                        href={vendor.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-[1.25rem] bg-[rgba(255,255,255,0.72)] px-4 py-4 ring-1 ring-[color:rgba(216,195,180,0.1)] transition hover:bg-[rgba(255,255,255,0.9)]"
                      >
                        {content}
                      </a>
                    );
                  })}

                  {liquor.vendors.length === 0 && (
                    <div className="rounded-[1.25rem] bg-[rgba(255,255,255,0.72)] px-5 py-8 text-sm leading-7 text-[color:var(--catalog-muted)] ring-1 ring-[color:rgba(216,195,180,0.1)]">
                      아직 표시할 판매처 가격이 없습니다.
                    </div>
                  )}
                </div>

                {!canOpenVendorLinks && liquor.vendors.length > 0 && (
                  <p className="mt-4 text-sm leading-6 text-[color:var(--catalog-muted)]">
                    현재 데이터 구조에서는 판매처별 개별 구매 링크를 구분할 수 없어 링크를 비활성화했습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
