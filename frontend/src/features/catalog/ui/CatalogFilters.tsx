import { catalogFilterOptions, categoryLabel, EMPTY_FILTERS, sourceLabel, type CatalogFilters as Filters } from "../model/catalog-filters";
import type { CatalogCardItem } from "../model/catalog";
export default function CatalogFilters({ items, value, onChange }: { items: CatalogCardItem[]; value: Filters; onChange: (value: Filters) => void }) {
  const options = catalogFilterOptions(items);
  const groups = [
    { key: "category" as const, label: "종류", options: options.categories.map(item => ({ value: item, label: categoryLabel(item) })) },
    { key: "volume" as const, label: "용량", options: options.volumes.map(item => ({ value: String(item), label: item.toLocaleString() + "ml" })) },
    { key: "source" as const, label: "판매처", options: options.sources.map(item => ({ value: item, label: sourceLabel(item) })) },
  ];
  return <>
  {/* 휴대폰: 종류 · 용량 · 판매처를 한 줄 선택 상자로(세 줄 칩이 첫 화면을 차지하던 것) */}
  <div className="filter-selects" role="group" aria-label="상품 필터">
    {groups.map(group => <label key={group.key} className={value[group.key] ? "active" : ""}><span className="sr-only">{group.label}</span>
      <select aria-label={group.label} value={value[group.key]} onChange={event => onChange({ ...value, [group.key]: event.target.value })}>
        <option value="">{group.label} 전체</option>
        {group.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>)}
    {(value.category || value.volume || value.source) && <button type="button" onClick={() => onChange(EMPTY_FILTERS)}>초기화</button>}
  </div>
  <aside className="compare-filters" aria-label="상품 필터">
    <div className="filter-heading"><h2>필터</h2><button type="button" onClick={() => onChange(EMPTY_FILTERS)}>초기화</button></div>
    {groups.map(group => <fieldset key={group.key}><legend>{group.label}</legend><div className="filter-options">
      {[{ value: "", label: "전체" }, ...group.options].map(option => <label key={option.value} className={value[group.key] === option.value ? "selected" : ""}>
        <input type="radio" name={group.key} value={option.value} checked={value[group.key] === option.value} onChange={() => onChange({ ...value, [group.key]: option.value })} />{option.label}
      </label>)}
    </div></fieldset>)}
    <p className="filter-note">불러온 상품 안에서 필터와 정렬을 적용합니다. 판매처 필터는 해당 판매처가 있는 상품을 찾습니다.</p>
  </aside>
  </>;
}
