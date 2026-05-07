import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }),
);
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

// seed_whisky_master_top100_kr.sql 100개 위스키를 한글 표기로 매핑.
// brand+clazz+volume_ml 충돌 시 자동 skip (fetchLiquorInfoKeywords가 unique 키워드만 사용).
// sub_category: "Blended" / "Single Malt" / "Bourbon" 3가지로 통일 (기존 운영 데이터 패턴 따름).
const TOP100 = [
  { brand: "조니워커", clazz: "블랙 라벨 12년",  sub: "Blended", abv: 40,    vol: 700 },
  { brand: "조니워커", clazz: "더블 블랙",       sub: "Blended", abv: 40,    vol: 700 },
  { brand: "조니워커", clazz: "그린 라벨 15년",  sub: "Blended", abv: 43,    vol: 700 },
  { brand: "조니워커", clazz: "골드 라벨",       sub: "Blended", abv: 40,    vol: 700 },
  { brand: "조니워커", clazz: "블루 라벨",       sub: "Blended", abv: 40,    vol: 700 },
  { brand: "조니워커", clazz: "레드 라벨",       sub: "Blended", abv: 40,    vol: 700 },
  { brand: "발렌타인", clazz: "파이니스트",      sub: "Blended", abv: 40,    vol: 700 },
  { brand: "발렌타인", clazz: "12년",            sub: "Blended", abv: 40,    vol: 700 },
  { brand: "발렌타인", clazz: "17년",            sub: "Blended", abv: 43,    vol: 700 },
  { brand: "발렌타인", clazz: "21년",            sub: "Blended", abv: 40,    vol: 700 },
  { brand: "시바스 리갈", clazz: "12년",         sub: "Blended", abv: 40,    vol: 700 },
  { brand: "시바스 리갈", clazz: "18년",         sub: "Blended", abv: 40,    vol: 700 },
  { brand: "시바스 리갈", clazz: "미즈나라",     sub: "Blended", abv: 40,    vol: 700 },
  { brand: "듀어스", clazz: "화이트 라벨",       sub: "Blended", abv: 40,    vol: 700 },
  { brand: "듀어스", clazz: "12년",              sub: "Blended", abv: 40,    vol: 700 },
  { brand: "듀어스", clazz: "15년",              sub: "Blended", abv: 40,    vol: 700 },
  { brand: "몽키숄더", clazz: "None",            sub: "Blended", abv: 40,    vol: 700 },
  { brand: "페이머스 그라우스", clazz: "None",   sub: "Blended", abv: 40,    vol: 700 },
  { brand: "그란츠", clazz: "트리플 우드",       sub: "Blended", abv: 40,    vol: 700 },
  { brand: "J&B", clazz: "레어",                 sub: "Blended", abv: 40,    vol: 700 },
  { brand: "커티 삭", clazz: "프로히비션",       sub: "Blended", abv: 50,    vol: 700 },
  { brand: "제임슨", clazz: "오리지널",          sub: "Blended", abv: 40,    vol: 700 },
  { brand: "제임슨", clazz: "블랙 배럴",         sub: "Blended", abv: 40,    vol: 700 },
  { brand: "제임슨", clazz: "캐스크메이츠 스타우트", sub: "Blended", abv: 40, vol: 700 },
  { brand: "부쉬밀", clazz: "오리지널",          sub: "Blended", abv: 40,    vol: 700 },
  { brand: "부쉬밀", clazz: "10년",              sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "부쉬밀", clazz: "블랙 부쉬",         sub: "Blended", abv: 40,    vol: 700 },
  { brand: "부쉬밀", clazz: "12년",              sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "털라모어 듀", clazz: "None",         sub: "Blended", abv: 40,    vol: 700 },
  { brand: "털라모어 듀", clazz: "12년",         sub: "Blended", abv: 40,    vol: 700 },
  { brand: "글렌피딕", clazz: "12년",            sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "글렌피딕", clazz: "15년",            sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "글렌피딕", clazz: "18년",            sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "글렌피딕", clazz: "21년 럼 캐스크",  sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "글렌리벳", clazz: "12년",            sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "글렌리벳", clazz: "15년",            sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "글렌리벳", clazz: "18년",            sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "글렌리벳", clazz: "파운더스 리저브", sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "맥캘란", clazz: "12 더블 캐스크",    sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "맥캘란", clazz: "12 셰리 오크",      sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "맥캘란", clazz: "15 더블 캐스크",    sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "맥캘란", clazz: "18 셰리 오크",      sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "발베니", clazz: "12 더블우드",       sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "발베니", clazz: "14 캐리비안 캐스크",sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "발베니", clazz: "12 스위트 토스트",  sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "글렌모렌지", clazz: "오리지널 10년", sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "글렌모렌지", clazz: "라산타 12년",   sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "글렌모렌지", clazz: "퀸타 루반 14년",sub: "Single Malt", abv: 46, vol: 700 },
  { brand: "글렌모렌지", clazz: "넥타 도르",     sub: "Single Malt", abv: 46, vol: 700 },
  { brand: "달모어", clazz: "12년",              sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "달모어", clazz: "15년",              sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "달모어", clazz: "시거 몰트 리저브",  sub: "Single Malt", abv: 44, vol: 700 },
  { brand: "아드벡", clazz: "10년",              sub: "Single Malt", abv: 46, vol: 700 },
  { brand: "아드벡", clazz: "우가달",            sub: "Single Malt", abv: 54.2, vol: 700 },
  { brand: "아드벡", clazz: "안 오아",           sub: "Single Malt", abv: 46.6, vol: 700 },
  { brand: "라가불린", clazz: "16년",            sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "라가불린", clazz: "8년",             sub: "Single Malt", abv: 48, vol: 700 },
  { brand: "라프로익", clazz: "10년",            sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "라프로익", clazz: "쿼터 캐스크",     sub: "Single Malt", abv: 48, vol: 700 },
  { brand: "라프로익", clazz: "로어",            sub: "Single Malt", abv: 48, vol: 700 },
  { brand: "보모어", clazz: "12년",              sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "보모어", clazz: "15년",              sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "카올 일라", clazz: "12년",           sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "탈리스커", clazz: "10년",            sub: "Single Malt", abv: 45.8, vol: 700 },
  { brand: "탈리스커", clazz: "스톰",            sub: "Single Malt", abv: 45.8, vol: 700 },
  { brand: "탈리스커", clazz: "스카이",          sub: "Single Malt", abv: 45.8, vol: 700 },
  { brand: "하이랜드 파크", clazz: "12년",       sub: "Single Malt", abv: 40, vol: 700 },
  { brand: "하이랜드 파크", clazz: "15년",       sub: "Single Malt", abv: 44, vol: 700 },
  { brand: "오반", clazz: "14년",                sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "오반", clazz: "리틀 베이",           sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "스프링뱅크", clazz: "10년",          sub: "Single Malt", abv: 46, vol: 700 },
  { brand: "롱로우", clazz: "피티드",            sub: "Single Malt", abv: 46, vol: 700 },
  { brand: "야마자키", clazz: "12년",            sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "하쿠슈", clazz: "12년",              sub: "Single Malt", abv: 43, vol: 700 },
  { brand: "히비키", clazz: "재패니즈 하모니",   sub: "Blended", abv: 43,    vol: 700 },
  { brand: "닛카", clazz: "프롬 더 배럴",        sub: "Blended", abv: 51.4,  vol: 500 },
  { brand: "요이치", clazz: "싱글 몰트",         sub: "Single Malt", abv: 45, vol: 700 },
  { brand: "미야기쿄", clazz: "싱글 몰트",       sub: "Single Malt", abv: 45, vol: 700 },
  { brand: "산토리", clazz: "토키",              sub: "Blended", abv: 43,    vol: 700 },
  { brand: "산토리", clazz: "가쿠빈",            sub: "Blended", abv: 40,    vol: 700 },
  { brand: "와일드 터키", clazz: "81",           sub: "Bourbon", abv: 40.5,  vol: 750 },
  { brand: "와일드 터키", clazz: "101",          sub: "Bourbon", abv: 50.5,  vol: 750 },
  { brand: "와일드 터키", clazz: "레어 브리드",  sub: "Bourbon", abv: 58.4,  vol: 750 },
  { brand: "메이커스 마크", clazz: "None",       sub: "Bourbon", abv: 45,    vol: 750 },
  { brand: "불릿", clazz: "버번",                sub: "Bourbon", abv: 45,    vol: 750 },
  { brand: "포 로지스", clazz: "버번",           sub: "Bourbon", abv: 40,    vol: 750 },
  { brand: "포 로지스", clazz: "싱글 배럴",      sub: "Bourbon", abv: 50,    vol: 750 },
  { brand: "버팔로 트레이스", clazz: "None",     sub: "Bourbon", abv: 45,    vol: 750 },
  { brand: "우드포드 리저브", clazz: "None",     sub: "Bourbon", abv: 45.2,  vol: 750 },
  { brand: "에반 윌리엄스", clazz: "블랙",       sub: "Bourbon", abv: 43,    vol: 750 },
  { brand: "짐 빔", clazz: "화이트 라벨",        sub: "Bourbon", abv: 40,    vol: 750 },
  { brand: "짐 빔", clazz: "블랙",               sub: "Bourbon", abv: 43,    vol: 750 },
  { brand: "짐 빔", clazz: "더블 오크",          sub: "Bourbon", abv: 43,    vol: 750 },
  { brand: "잭 다니엘", clazz: "Old No. 7",      sub: "Bourbon", abv: 40,    vol: 700 },
  { brand: "잭 다니엘", clazz: "젠틀맨 잭",      sub: "Bourbon", abv: 40,    vol: 700 },
  { brand: "잭 다니엘", clazz: "싱글 배럴",      sub: "Bourbon", abv: 47,    vol: 700 },
  { brand: "놉 크릭", clazz: "9년",              sub: "Bourbon", abv: 50,    vol: 750 },
  { brand: "엘라이저 크레이그", clazz: "스몰 배치", sub: "Bourbon", abv: 47, vol: 750 },
  { brand: "올드 포레스터", clazz: "86",         sub: "Bourbon", abv: 43,    vol: 750 },
  { brand: "블랜튼스", clazz: "오리지널",        sub: "Bourbon", abv: 46.5,  vol: 700 },
];

const { data: existing, error: exErr } = await supabase
  .from("liquor_info")
  .select("brand, clazz, volume_ml");
if (exErr) {
  console.error(exErr);
  process.exit(1);
}

const existingKey = new Set(
  existing.map((r) => `${(r.brand ?? "").trim()}|${(r.clazz ?? "").trim()}|${r.volume_ml ?? ""}`),
);

let inserted = 0;
let skipped = 0;
const toInsert = [];
for (const item of TOP100) {
  const key = `${item.brand}|${item.clazz}|${item.vol}`;
  if (existingKey.has(key)) {
    console.log(`SKIP   ${key}`);
    skipped += 1;
    continue;
  }
  toInsert.push({
    brand: item.brand,
    category: "Whisky",
    sub_category: item.sub,
    clazz: item.clazz,
    alcohol_percent: item.abv,
    volume_ml: item.vol,
  });
}

console.log(`\nto insert: ${toInsert.length}, skip: ${skipped}`);

if (toInsert.length > 0) {
  const { error: insErr } = await supabase.from("liquor_info").insert(toInsert);
  if (insErr) {
    console.error("INSERT failed:", insErr);
    process.exit(1);
  }
  inserted = toInsert.length;
}

console.log(`\nDONE. inserted=${inserted} skipped=${skipped} total_top100=${TOP100.length}`);
