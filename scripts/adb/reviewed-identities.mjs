import { identityName, volumeFromName } from './validate.mjs';
// Explicit product code/name pairs reviewed against the real app on 2026-10-27.
// No global removal of words such as '더', '라벨', '럼' or '블루'.
const aliases = [
  [868,'5060716145384','글렌드로낙 12년','더 글렌드로낙 12년',700],
  [867,'0080432402825','글렌리벳12년','더 글렌리벳 12년',700],
  [863,'5000267114279','조니워커 블루라벨','조니워커 블루',750],
  [896,'5018481315631','탈리스만 스카치 위스키','탈리스만',700],
  [910,'5013967015944','칼라일 스카치 위스키','칼라일 블렌디드 스카치 위스키',700],
  [963,'0870000027150','캡틴모건','캡틴 모건 럼',750],
  [941,'7312040017591','앱솔루트 보드카','앱솔루트 블루',375],
  [944,'5010677028974','바카디 오로','바카디 카르타 오로',750],
];
export function reviewedIdentity(row, liquor) {
  return aliases.some(([id,code,expected,observed,volume])=>liquor?.id===id&&row.product_id===code
    && identityName(liquor.product_name||'')===identityName(expected)
    && identityName(row.name||'')===identityName(observed)
    && row.volume_ml===volume&&liquor.volume_ml===volume&&volumeFromName(row.name||'')===volume);
}
