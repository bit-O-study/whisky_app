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

// scale: 0~5 (0.5 step). [sweet, smoky, fruity, spicy, woody, body]
// model override (specific bottle keywords found in normalized_name)
const MODEL_OVERRIDE = [
  // peated heavyweights
  { match: /라가불린.*16/i, flavor: [2.5, 4.5, 2, 3, 4, 4.5] },
  { match: /라가불린.*8/i,  flavor: [2.5, 4.5, 2, 3, 3.5, 4] },
  { match: /라가불린.*11/i, flavor: [3, 4, 2.5, 2.5, 3.5, 4] },
  { match: /아드벡.*10/i,   flavor: [1.5, 5, 2.5, 3.5, 3, 4] },
  { match: /아드벡.*우가달/i, flavor: [2.5, 5, 2, 3.5, 3.5, 4.5] },
  { match: /아드벡.*안 ?오아/i, flavor: [2.5, 4.5, 2.5, 3, 3, 4] },
  { match: /라프로익.*10/i, flavor: [2, 5, 2, 3, 3, 4] },
  { match: /라프로익.*쿼터/i, flavor: [2.5, 4.5, 2.5, 3, 3.5, 4] },
  { match: /라프로익.*로어/i, flavor: [2.5, 4.5, 2.5, 3, 4, 4.5] },
  { match: /라프로익.*18/i, flavor: [3, 4, 3, 2.5, 4, 4.5] },
  { match: /파이어볼/i, flavor: [5, 0, 1, 5, 1, 2] },

  // sherry-forward singles
  { match: /글렌드로낙.*12/i, flavor: [4, 1, 3.5, 2.5, 3.5, 4] },
  { match: /글렌알라키.*15/i, flavor: [4.5, 1, 4, 3, 4, 4.5] },
  { match: /맥캘란.*12.*셰리/i, flavor: [4.5, 1, 4, 2.5, 4, 4.5] },
  { match: /맥캘란.*12.*더블/i, flavor: [4, 1, 3.5, 2, 3.5, 4] },
  { match: /맥캘란.*15/i, flavor: [4.5, 1, 4, 2.5, 4.5, 4.5] },
  { match: /맥캘란.*18/i, flavor: [5, 1.5, 4, 2.5, 5, 5] },
  { match: /발베니.*12.*더블우드/i, flavor: [4, 1, 3.5, 2, 3.5, 3.5] },
  { match: /발베니.*14.*캐리비안/i, flavor: [4, 1, 4, 2, 3.5, 3.5] },
  { match: /글렌리벳.*12/i, flavor: [3.5, 0.5, 4, 1.5, 2.5, 2.5] },
  { match: /글렌리벳.*15/i, flavor: [3.5, 0.5, 4, 1.5, 3, 3] },
  { match: /글렌리벳.*18/i, flavor: [3.5, 0.5, 4, 1.5, 3.5, 3.5] },
  { match: /글렌피딕.*12/i, flavor: [3, 0.5, 4, 1.5, 2.5, 2.5] },
  { match: /글렌피딕.*15/i, flavor: [3.5, 0.5, 4, 1.5, 3, 3] },
  { match: /글렌피딕.*18/i, flavor: [3.5, 0.5, 4, 1.5, 3.5, 3.5] },
  { match: /글렌피딕.*21/i, flavor: [4, 0.5, 4, 1.5, 3.5, 3.5] },
  { match: /글렌모렌지.*10/i, flavor: [3.5, 0.5, 4, 1.5, 2.5, 2.5] },
  { match: /글렌모렌지.*라산타/i, flavor: [4, 0.5, 4, 1.5, 3, 3] },
  { match: /글렌모렌지.*퀸타/i, flavor: [3.5, 1, 4, 2, 3.5, 3.5] },
  { match: /글렌모렌지.*넥타/i, flavor: [4, 0.5, 4, 1.5, 3, 3] },
  { match: /클라이넬리쉬.*14/i, flavor: [3, 1.5, 3.5, 2.5, 3, 3.5] },
  { match: /카발란.*클래식/i, flavor: [4, 0.5, 4.5, 2, 3, 3.5] },
  { match: /토마틴.*12/i, flavor: [3, 0.5, 3.5, 2, 2.5, 2.5] },
  { match: /글렌고인.*12/i, flavor: [3.5, 0.5, 4, 2, 3, 3] },
  { match: /글렌파클라스.*12/i, flavor: [4, 1, 4, 2.5, 3.5, 4] },
  { match: /탐나불린/i, flavor: [3.5, 1, 3.5, 2, 3, 3] },
  { match: /글렌버기/i, flavor: [3.5, 1, 3.5, 2, 3, 3] },
  { match: /보모어.*12/i, flavor: [2.5, 3.5, 2.5, 2.5, 3, 3] },
  { match: /보모어.*15/i, flavor: [3, 3.5, 2.5, 2.5, 3.5, 3] },
  { match: /카올.*일라.*12/i, flavor: [2, 4, 2.5, 2.5, 3, 3] },
  { match: /탈리스커.*10/i, flavor: [2.5, 3.5, 2.5, 4, 3, 3.5] },
  { match: /하이랜드.*파크.*12/i, flavor: [3, 2.5, 3, 2.5, 3, 3] },
  { match: /오반.*14/i, flavor: [3, 1.5, 3, 2.5, 3.5, 3.5] },
  { match: /스프링뱅크.*10/i, flavor: [3, 1.5, 3.5, 2.5, 3, 3.5] },

  // blended
  { match: /조니워커.*블루/i, flavor: [3, 2, 3.5, 2.5, 3.5, 4] },
  { match: /조니워커.*골드/i, flavor: [3.5, 1.5, 3.5, 2, 3, 3.5] },
  { match: /조니워커.*그린/i, flavor: [3, 2, 3.5, 2, 3, 3.5] },
  { match: /조니워커.*더블.*블랙/i, flavor: [2.5, 3, 3, 2.5, 3, 3] },
  { match: /조니워커.*블랙/i, flavor: [3, 2.5, 3, 2.5, 3, 3] },
  { match: /조니워커.*레드/i, flavor: [2.5, 1.5, 2.5, 2.5, 2, 2.5] },
  { match: /조니워커.*블론드/i, flavor: [3.5, 0.5, 4, 1.5, 2, 2.5] },
  { match: /조니워커.*18/i, flavor: [3.5, 1.5, 3.5, 2, 3.5, 3.5] },
  { match: /발렌타인.*파이니스트|발렌타인.*finest/i, flavor: [3, 1.5, 3, 2, 2.5, 2.5] },
  { match: /발렌타인.*12/i, flavor: [3, 1.5, 3, 2, 2.5, 2.5] },
  { match: /발렌타인.*17/i, flavor: [3.5, 1.5, 3.5, 2, 3, 3] },
  { match: /발렌타인.*21/i, flavor: [3.5, 1.5, 3.5, 2, 3.5, 3.5] },
  { match: /발렌타인.*마스터즈/i, flavor: [3.5, 1.5, 3, 2, 3, 3] },
  { match: /시바스.*12/i, flavor: [3.5, 1, 3, 1.5, 2.5, 2.5] },
  { match: /시바스.*18/i, flavor: [3.5, 1, 3.5, 2, 3.5, 3.5] },
  { match: /시바스.*미즈나라/i, flavor: [3.5, 1, 3, 2.5, 3, 3] },
  { match: /로얄.*살루트/i, flavor: [3.5, 1.5, 4, 2.5, 3.5, 4] },
  { match: /듀어스.*화이트/i, flavor: [3, 1, 2.5, 1.5, 2, 2] },
  { match: /듀어스.*12/i, flavor: [3.5, 1, 3, 1.5, 2.5, 2.5] },
  { match: /듀어스.*15/i, flavor: [3.5, 1, 3, 1.5, 3, 3] },
  { match: /몽키숄더/i, flavor: [3.5, 1, 3, 2, 2.5, 2.5] },
  { match: /그란츠.*트리플/i, flavor: [3, 1, 2.5, 2, 2.5, 2.5] },
  { match: /벨즈/i, flavor: [2.5, 1.5, 2, 2, 2, 2] },
  { match: /존바/i, flavor: [2.5, 1.5, 2, 2, 2, 2.5] },
  { match: /라벨.?5/i, flavor: [2.5, 1, 2, 1.5, 2, 2] },
  { match: /그랑웨일/i, flavor: [2.5, 1, 2, 1.5, 2, 2.5] },
  { match: /탈리스만/i, flavor: [2.5, 1.5, 2, 2, 2, 2] },

  // bourbon
  { match: /짐.?빔.*화이트/i, flavor: [4, 1, 2, 2, 2.5, 2.5] },
  { match: /짐.?빔.*블랙/i, flavor: [4, 1, 2.5, 2.5, 3, 3] },
  { match: /짐.?빔.*더블.*오크/i, flavor: [4, 1, 2.5, 2.5, 3.5, 3] },
  { match: /와일드.*터키.*101/i, flavor: [4, 1.5, 2.5, 3.5, 3.5, 4] },
  { match: /와일드.*터키.*81/i, flavor: [3.5, 1, 2.5, 2.5, 3, 3] },
  { match: /와일드.*터키.*레어/i, flavor: [4.5, 1.5, 2.5, 4, 4, 4.5] },
  { match: /버팔로.*트레이스/i, flavor: [4, 1, 2.5, 3, 3, 3] },
  { match: /메이커스.*마크/i, flavor: [4.5, 0.5, 2.5, 2, 3, 3.5] },
  { match: /우드포드/i, flavor: [4, 1, 3, 3, 3.5, 3.5] },
  { match: /엘라이저.*크레이그/i, flavor: [4, 1, 2.5, 3, 3.5, 3.5] },
  { match: /올드.*포레스터/i, flavor: [4, 1, 2.5, 2.5, 3, 3] },
  { match: /놉.*크릭/i, flavor: [4, 1.5, 2.5, 3.5, 3.5, 4] },
  { match: /블랜튼스/i, flavor: [4, 1.5, 3, 3.5, 4, 4] },
  { match: /포.?로지스.*싱글/i, flavor: [4, 1, 2.5, 3.5, 3.5, 3.5] },
  { match: /포.?로지스/i, flavor: [3.5, 1, 2.5, 2.5, 3, 3] },
  { match: /에반.*윌리엄스/i, flavor: [3.5, 1, 2.5, 2.5, 3, 3] },
  { match: /잭.*다니엘.*싱글/i, flavor: [4, 1.5, 3, 3, 3.5, 3.5] },
  { match: /잭.*다니엘.*젠틀맨/i, flavor: [4, 1, 2.5, 2.5, 3, 3] },
  { match: /잭.*다니엘/i, flavor: [3.5, 1, 2.5, 2.5, 3, 3] },

  // irish
  { match: /제임슨.*블랙.*배럴/i, flavor: [4, 1, 3, 2.5, 3.5, 3.5] },
  { match: /제임슨.*캐스크메이츠/i, flavor: [3.5, 1, 2.5, 2, 3, 3] },
  { match: /제임슨/i, flavor: [3.5, 0.5, 2.5, 1.5, 2.5, 2.5] },
  { match: /부쉬밀.*10/i, flavor: [3.5, 0.5, 3.5, 1.5, 2.5, 2.5] },
  { match: /부쉬밀.*12/i, flavor: [3.5, 0.5, 3.5, 1.5, 3, 3] },
  { match: /부쉬밀.*블랙/i, flavor: [3.5, 1, 3, 2, 3, 3] },
  { match: /부쉬밀/i, flavor: [3.5, 0.5, 3, 1.5, 2.5, 2.5] },
  { match: /털라모어/i, flavor: [3.5, 1, 2.5, 1.5, 2.5, 2.5] },

  // japanese
  { match: /산토리.*가쿠빈/i, flavor: [3, 1, 2.5, 1.5, 2, 2] },
  { match: /산토리.*토키/i, flavor: [3, 0.5, 3, 1.5, 2, 2] },
  { match: /야마자키.*12/i, flavor: [3.5, 1, 3.5, 2, 3, 3] },
  { match: /하쿠슈.*12/i, flavor: [3.5, 1.5, 3.5, 2, 2.5, 2.5] },
  { match: /히비키/i, flavor: [3.5, 1, 4, 2, 3, 3] },
  { match: /닛카.*프롬/i, flavor: [3, 1.5, 3, 2.5, 3.5, 4] },
  { match: /닛카.*프론티어/i, flavor: [3, 1, 3, 2, 3, 3] },
  { match: /요이치/i, flavor: [3, 2, 3, 2.5, 3, 3.5] },
  { match: /미야기쿄/i, flavor: [3.5, 1, 3.5, 2, 3, 3] },
  { match: /아케시/i, flavor: [2.5, 4, 2.5, 2.5, 2.5, 3] },
  { match: /다이긴죠|북극곰의.*눈물/i, flavor: [3, 0, 4, 1, 0.5, 1.5] },

  // brandy
  { match: /헤네시.*xo/i, flavor: [4.5, 0.5, 4, 2.5, 4.5, 4.5] },
  { match: /헤네시.*vsop/i, flavor: [4, 0.5, 4, 2, 3.5, 4] },
  { match: /레미.*마틴/i, flavor: [4, 0.5, 4, 2, 3.5, 4] },
  { match: /마텔/i, flavor: [4, 0.5, 4, 2, 3.5, 4] },
  { match: /까뮤/i, flavor: [4, 0.5, 4, 2, 3.5, 4] },
  { match: /하인/i, flavor: [4, 0.5, 4, 2, 3.5, 4] },

  // rum
  { match: /자카파/i, flavor: [4.5, 1, 3.5, 2, 3, 3.5] },
  { match: /디플로마티코/i, flavor: [4, 1, 3.5, 2, 3, 3] },
  { match: /바카디.*카르타.*블랑카|bacardi.*blanca/i, flavor: [3, 0, 2, 1, 0.5, 1.5] },
  { match: /바카디.*오로|bacardi.*oro/i, flavor: [3.5, 0.5, 2.5, 1.5, 1.5, 2] },
  { match: /바카디/i, flavor: [3, 0.5, 2.5, 1.5, 1, 2] },
  { match: /캡틴.*모건/i, flavor: [4, 0, 2.5, 2.5, 1.5, 2.5] },
  { match: /마운트.*게이/i, flavor: [3.5, 1, 3, 2, 3, 3] },
  { match: /돈파파/i, flavor: [4.5, 0, 3, 1.5, 1, 2.5] },
  { match: /하바나/i, flavor: [3.5, 0.5, 3, 2, 2, 3] },
  { match: /말리부/i, flavor: [4.5, 0, 3.5, 0.5, 0.5, 1.5] },

  // gin
  { match: /봄베이.*사파이어/i, flavor: [1.5, 0, 2, 4, 1, 1.5] },
  { match: /헨드릭스/i, flavor: [1.5, 0, 3, 3.5, 1, 1.5] },
  { match: /탱커레이|탠커레이/i, flavor: [1, 0, 1.5, 4.5, 1, 1.5] },
  { match: /비피터/i, flavor: [1, 0, 1.5, 4, 1, 1.5] },
  { match: /몽키.?47/i, flavor: [1.5, 0, 2.5, 4.5, 1.5, 2] },
  { match: /보타니스트/i, flavor: [1.5, 0, 2.5, 3.5, 1, 1.5] },
  { match: /고든스/i, flavor: [1, 0, 1.5, 4, 1, 1.5] },
  { match: /담락/i, flavor: [1.5, 0, 2.5, 4, 1, 1.5] },
  { match: /수이/i, flavor: [1.5, 0, 3, 3, 0.5, 1] },
  { match: /말피/i, flavor: [1.5, 0, 2.5, 3.5, 1, 1.5] },
  { match: /아치로즈/i, flavor: [1.5, 0, 2.5, 3.5, 1, 1.5] },
  { match: /넘버.?3/i, flavor: [1, 0, 1.5, 4, 1, 1.5] },

  // vodka
  { match: /앱솔루트.*페어|앱솔루트.*피치|앱솔루트.*어피치|앱솔루트.*라즈베리|앱솔루트.*자몽|앱솔루트.*그레이프프루트|앱솔루트.*라임|앱솔루트.*워터멜론/i, flavor: [3, 0, 4, 0.5, 0.5, 1.5] },
  { match: /앱솔루트/i, flavor: [1, 0, 1, 0.5, 0.5, 1.5] },
  { match: /그레이.?구스/i, flavor: [1, 0, 1, 0.5, 0.5, 1.5] },
  { match: /케테.?원/i, flavor: [1, 0, 1, 0.5, 0.5, 1.5] },
  { match: /벨베디어/i, flavor: [1, 0, 1, 0.5, 0.5, 1.5] },
  { match: /시락/i, flavor: [1.5, 0, 1.5, 0.5, 0.5, 1.5] },
  { match: /스미노프.*그린.*애플|스미노프.*레드/i, flavor: [3, 0, 3.5, 0.5, 0.5, 1.5] },
  { match: /스미노프/i, flavor: [1, 0, 1, 0.5, 0.5, 1.5] },
  { match: /길비스/i, flavor: [1, 0, 1, 0.5, 0.5, 1.5] },

  // tequila
  { match: /패트론.*레포사도/i, flavor: [3, 1, 2.5, 3.5, 2.5, 3] },
  { match: /패트론.*실버/i, flavor: [2.5, 1, 2.5, 3.5, 2, 2.5] },
  { match: /호세.*쿠에르보|호세쿠엘보/i, flavor: [2.5, 1, 2.5, 3.5, 2, 2.5] },
  { match: /돈.?훌리오/i, flavor: [3, 1, 3, 3.5, 3, 3.5] },
  { match: /카사미고스/i, flavor: [3, 1, 3, 3.5, 2.5, 3] },
];

// brand-level fallback (if model not found)
const BRAND_DEFAULT = [
  { match: /조니워커|발렌타인|시바스|듀어스|그란츠|페이머스|몽키숄더|커티 ?삭|j.?b|로얄.*살루트|벨즈|존바|그랑웨일|탈리스만|라벨.?5/i, flavor: [3, 1.5, 3, 2, 2.5, 2.5] }, // blended scotch generic
  { match: /글렌피딕|글렌리벳|글렌드로낙|글렌알라키|글렌모렌지|글렌고인|글렌버기|글렌파클라스|글렌로시즈|발베니|맥캘란|보모어|카올|클라이넬리쉬|모틀라크|토마틴|탐나불린|스프링뱅크|롱로우|하이랜드.?파크|오반|탈리스커|카발란/i, flavor: [3.5, 1.5, 3.5, 2, 3, 3] }, // single malt generic
  { match: /라가불린|라프로익|아드벡/i, flavor: [2, 4.5, 2, 3, 3, 4] }, // peated generic
  { match: /짐.?빔|와일드.*터키|버팔로.*트레이스|메이커스|우드포드|엘라이저|올드.*포레스터|놉.*크릭|블랜튼스|포.?로지스|에반.*윌리엄스/i, flavor: [4, 1, 2.5, 3, 3.5, 3.5] }, // bourbon generic
  { match: /잭.*다니엘/i, flavor: [3.5, 1, 2.5, 2.5, 3, 3] }, // tennessee generic
  { match: /제임슨|부쉬밀|털라모어/i, flavor: [3.5, 0.5, 3, 1.5, 2.5, 2.5] }, // irish generic
  { match: /산토리|야마자키|하쿠슈|히비키|닛카|요이치|미야기쿄|아케시/i, flavor: [3, 1, 3, 2, 2.5, 2.5] }, // japanese generic
  { match: /헤네시|레미.?마틴|마텔|까뮤|하인/i, flavor: [4, 0.5, 4, 2, 3.5, 4] }, // brandy
  { match: /자카파|디플로마티코|바카디|캡틴.?모건|마운트.?게이|돈파파|하바나|말리부/i, flavor: [4, 0.5, 3, 1.5, 2, 2.5] }, // rum
  { match: /봄베이|헨드릭스|탱커레이|탠커레이|비피터|몽키.?47|보타니스트|고든스|담락|수이|말피|아치로즈|넘버.?3/i, flavor: [1.5, 0, 2, 4, 1, 1.5] }, // gin
  { match: /앱솔루트|그레이.?구스|케테.?원|벨베디어|시락|스미노프|길비스/i, flavor: [1, 0, 1, 0.5, 0.5, 1.5] }, // vodka
  { match: /패트론|호세.*쿠에르보|호세쿠엘보|돈.?훌리오|카사미고스/i, flavor: [2.5, 1, 2.5, 3.5, 2, 2.5] }, // tequila
  { match: /파이어볼/i, flavor: [5, 0, 1, 5, 1, 2] },
];

const CATEGORY_DEFAULT = {
  Whisky: [3, 1.5, 3, 2, 2.5, 2.5],
  Vodka: [1, 0, 1, 0.5, 0.5, 1.5],
  Gin: [1.5, 0, 2, 4, 1, 1.5],
  Rum: [4, 0.5, 3, 1.5, 2, 2.5],
  Tequila: [2.5, 1, 2.5, 3.5, 2, 2.5],
  Brandy: [4, 0.5, 4, 2, 3.5, 4],
  Sake: [3, 0, 4, 1, 0.5, 1.5],
};

function pickFlavor(name, brand, category) {
  const search = `${name ?? ""} ${brand ?? ""}`;
  for (const m of MODEL_OVERRIDE) if (m.match.test(search)) return { source: "model", flavor: m.flavor };
  for (const b of BRAND_DEFAULT) if (b.match.test(search)) return { source: "brand", flavor: b.flavor };
  if (category && CATEGORY_DEFAULT[category]) return { source: "category", flavor: CATEGORY_DEFAULT[category] };
  return null;
}

const { data: rows, error } = await supabase
  .from("liquor")
  .select("id, normalized_name, product_name, brand, category, sweet, smoky, fruity, spicy, woody, body");
if (error) { console.error(error); process.exit(1); }

const targets = rows.filter((r) =>
  [r.sweet, r.smoky, r.fruity, r.spicy, r.woody, r.body].every((v) => v == null),
);
console.log(`flavor-empty rows: ${targets.length} / ${rows.length}`);

let modelHits = 0, brandHits = 0, catHits = 0, miss = 0, fail = 0;
for (const row of targets) {
  const name = row.normalized_name || row.product_name || "";
  const r = pickFlavor(name, row.brand, row.category);
  if (!r) { miss += 1; continue; }
  if (r.source === "model") modelHits += 1;
  else if (r.source === "brand") brandHits += 1;
  else catHits += 1;

  const [sweet, smoky, fruity, spicy, woody, body] = r.flavor;
  const { error: upErr } = await supabase
    .from("liquor")
    .update({ sweet, smoky, fruity, spicy, woody, body })
    .eq("id", row.id);
  if (upErr) { console.log(`FAIL id=${row.id}: ${upErr.message}`); fail += 1; }
}

console.log(`\nDONE. model=${modelHits} brand=${brandHits} category=${catHits} miss=${miss} fail=${fail}`);
