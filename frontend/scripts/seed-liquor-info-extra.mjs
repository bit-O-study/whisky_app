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

// top100 밖의 카테고리/브랜드 보강. 한국 시장에서 흔히 유통되는 양주 위주.
const EXTRA = [
  // === 위스키 추가 (top100 외) ===
  { brand: "글렌파클라스", clazz: "12년",         category: "Whisky", sub: "Single Malt", abv: 43,   vol: 700 },
  { brand: "글렌고인", clazz: "12년",             category: "Whisky", sub: "Single Malt", abv: 43,   vol: 700 },
  { brand: "토마틴", clazz: "12년",               category: "Whisky", sub: "Single Malt", abv: 43,   vol: 700 },
  { brand: "클라이넬리쉬", clazz: "14년",         category: "Whisky", sub: "Single Malt", abv: 46,   vol: 700 },
  { brand: "모틀라크", clazz: "16년",             category: "Whisky", sub: "Single Malt", abv: 43.4, vol: 700 },
  { brand: "라프로익", clazz: "18년",             category: "Whisky", sub: "Single Malt", abv: 48,   vol: 700 },
  { brand: "글렌로시즈", clazz: "12년",           category: "Whisky", sub: "Single Malt", abv: 40,   vol: 700 },

  // === 럼 ===
  { brand: "자카파", clazz: "23",                 category: "Rum",     sub: "Rum",     abv: 40,   vol: 750 },
  { brand: "디플로마티코", clazz: "리저바 익스클루시바", category: "Rum", sub: "Rum",  abv: 40,   vol: 700 },
  { brand: "마운트 게이", clazz: "XO",            category: "Rum",     sub: "Rum",     abv: 43,   vol: 700 },
  { brand: "캡틴 모건", clazz: "오리지널 스파이스",category: "Rum",     sub: "Rum",     abv: 35,   vol: 700 },
  { brand: "바카디", clazz: "카르타 블랑카",      category: "Rum",     sub: "Rum",     abv: 37.5, vol: 700 },

  // === 진 ===
  { brand: "봄베이 사파이어", clazz: "오리지널",  category: "Gin",     sub: "Gin",     abv: 47,   vol: 700 },
  { brand: "헨드릭스", clazz: "오리지널",         category: "Gin",     sub: "Gin",     abv: 41.4, vol: 700 },
  { brand: "탱커레이", clazz: "런던 드라이",      category: "Gin",     sub: "Gin",     abv: 47.3, vol: 700 },
  { brand: "비피터", clazz: "24",                 category: "Gin",     sub: "Gin",     abv: 45,   vol: 700 },
  { brand: "몽키 47", clazz: "드라이 진",         category: "Gin",     sub: "Gin",     abv: 47,   vol: 500 },
  { brand: "더 보타니스트", clazz: "아일라 드라이 진", category: "Gin", sub: "Gin",     abv: 46,   vol: 700 },

  // === 보드카 ===
  { brand: "그레이 구스", clazz: "오리지널",      category: "Vodka",   sub: "Vodka",   abv: 40,   vol: 700 },
  { brand: "케테 원", clazz: "오리지널",          category: "Vodka",   sub: "Vodka",   abv: 40,   vol: 700 },
  { brand: "앱솔루트", clazz: "오리지널",         category: "Vodka",   sub: "Vodka",   abv: 40,   vol: 700 },
  { brand: "벨베디어", clazz: "퓨어",             category: "Vodka",   sub: "Vodka",   abv: 40,   vol: 700 },
  { brand: "시락", clazz: "시그너처",             category: "Vodka",   sub: "Vodka",   abv: 40,   vol: 700 },

  // === 테킬라 ===
  { brand: "패트론", clazz: "실버",               category: "Tequila", sub: "Tequila", abv: 40,   vol: 700 },
  { brand: "패트론", clazz: "레포사도",           category: "Tequila", sub: "Tequila", abv: 40,   vol: 700 },
  { brand: "호세 쿠에르보", clazz: "트래디셔널 골드", category: "Tequila", sub: "Tequila", abv: 38, vol: 700 },
  { brand: "돈 훌리오", clazz: "1942",            category: "Tequila", sub: "Tequila", abv: 38,   vol: 750 },
  { brand: "카사미고스", clazz: "블랑코",         category: "Tequila", sub: "Tequila", abv: 40,   vol: 700 },

  // === 코냑/브랜디 ===
  { brand: "헤네시", clazz: "V.S.O.P.",           category: "Brandy",  sub: "Cognac",  abv: 40,   vol: 700 },
  { brand: "헤네시", clazz: "X.O.",               category: "Brandy",  sub: "Cognac",  abv: 40,   vol: 700 },
  { brand: "레미 마틴", clazz: "V.S.O.P.",        category: "Brandy",  sub: "Cognac",  abv: 40,   vol: 700 },
  { brand: "마텔", clazz: "V.S.O.P.",             category: "Brandy",  sub: "Cognac",  abv: 40,   vol: 700 },
  { brand: "카뮈", clazz: "V.S.O.P.",             category: "Brandy",  sub: "Cognac",  abv: 40,   vol: 700 },
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

const toInsert = [];
let skipped = 0;
for (const item of EXTRA) {
  const key = `${item.brand}|${item.clazz}|${item.vol}`;
  if (existingKey.has(key)) {
    console.log(`SKIP ${key}`);
    skipped += 1;
    continue;
  }
  toInsert.push({
    brand: item.brand,
    category: item.category,
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
}
console.log(`DONE. inserted=${toInsert.length} skipped=${skipped} total=${EXTRA.length}`);
