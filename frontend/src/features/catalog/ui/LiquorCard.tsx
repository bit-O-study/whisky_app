import Image from "next/image";
import Link from "next/link";
import { DEFAULT_LIQUOR_IMAGE_URL } from "../../../shared/config/default-images";
import type { CatalogCardItem } from "../model/catalog";
import { sourceLabel } from "../model/catalog-filters";
import { checkedDate, priceFreshness } from "../model/price-freshness";
import FreshnessChip from "./FreshnessChip";
const price = (value: number) => value > 0 ? value.toLocaleString("ko-KR") + "원" : "가격 확인 중";
export default function LiquorCard({ liquor, prioritizeImage = false }: { liquor: CatalogCardItem; prioritizeImage?: boolean }) {
  const vendors = liquor.vendors.slice().sort((a, b) => (a.current_price > 0 ? a.current_price : Infinity) - (b.current_price > 0 ? b.current_price : Infinity));
  const best = vendors.find(vendor => vendor.current_price > 0);
  const bestStale = priceFreshness(best?.crawled_at).tone === "stale";
  return <article className="compare-row">
    <div className="compare-product">
      <Link href={"/liquor/" + liquor.id} className="compare-image" tabIndex={-1} aria-hidden="true"><Image src={liquor.image_url || DEFAULT_LIQUOR_IMAGE_URL} alt="" fill sizes="72px" priority={prioritizeImage} className="object-contain" /></Link>
      <div className="compare-name"><h2><Link href={"/liquor/" + liquor.id}>{liquor.name}</Link></h2><p>{liquor.volume > 0 ? liquor.volume.toLocaleString() + "ml" : "용량 미제공"} · {liquor.alcohol_percent > 0 ? liquor.alcohol_percent + "%" : "도수 미제공"}</p></div>
      <div className="compare-price"><span>최저가</span><strong className={bestStale ? "is-stale" : ""}>{price(best?.current_price ?? liquor.lowest_price)}</strong>{best && <FreshnessChip crawledAt={best.crawled_at} />}</div>
      <div className="compare-meta"><span>판매처 {vendors.length}곳</span><time dateTime={best?.crawled_at || undefined}>{checkedDate(best?.crawled_at) ? checkedDate(best?.crawled_at) + " 확인" : "확인 시각 미제공"}</time></div>
    </div>
    <details className="compare-vendors">
      <summary aria-label={liquor.name + " 가격 비교"}>가격 비교 <span aria-hidden="true">⌄</span></summary>
      <div className="compare-table-wrap"><table><caption className="sr-only">{liquor.name} 판매처별 가격</caption><thead><tr><th>판매처</th><th>가격</th><th>확인 날짜</th><th>구매 페이지</th></tr></thead><tbody>
        {vendors.map((vendor, index) => { const stale = priceFreshness(vendor.crawled_at).tone === "stale"; const storeOnly = vendor.source.trim().toUpperCase() === "COSTCO"; return <tr key={vendor.source + "-" + index} className={stale ? "is-stale" : ""}><th scope="row">{sourceLabel(vendor.source)}</th><td><strong>{price(vendor.current_price)}</strong>{vendor.original_price > vendor.current_price && vendor.current_price > 0 && <del>{price(vendor.original_price)}</del>}</td><td><span className="compare-checked">{checkedDate(vendor.crawled_at) ?? "미제공"}<FreshnessChip crawledAt={vendor.crawled_at} /></span></td><td>{!storeOnly && vendor.product_url ? <a href={vendor.product_url} target="_blank" rel="noopener noreferrer" aria-label={sourceLabel(vendor.source) + "에서 " + liquor.name + " 구매 페이지 열기"}>바로가기 ↗</a> : <span className="compare-no-link">{storeOnly ? "매장에서 확인" : "링크 없음"}</span>}</td></tr>; })}
      </tbody></table>{!vendors.length && <p className="compare-no-vendors">등록된 판매처가 없습니다.</p>}</div>
    </details>
  </article>;
}
