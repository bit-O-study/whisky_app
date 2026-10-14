/**
 * 방문 유입 경로 분류 — "이 방문자는 어디서 왔나".
 *
 * 브라우저가 알려 주는 이전 페이지(referrer) 호스트, 광고 링크 태그(utm_source),
 * 그리고 휴대폰 앱 안 브라우저(User-Agent) 순으로 본다.
 * 카카오톡·인스타 같은 앱 안에서 링크를 누르면 referrer 가 비는 일이 많아서 UA 로 보충한다.
 * 개인정보를 남기지 않으려고 referrer 는 호스트만 쓴다(검색어 등 쿼리는 버림).
 */
export type VisitSource =
  | "네이버"
  | "구글"
  | "다음"
  | "카카오톡"
  | "인스타그램"
  | "페이스북"
  | "유튜브"
  | "X(트위터)"
  | "스레드"
  | "밴드"
  | "빙"
  | "직접 방문"
  | "기타";

const BY_UTM: [RegExp, VisitSource][] = [
  [/naver/i, "네이버"],
  [/google/i, "구글"],
  [/daum/i, "다음"],
  [/kakao/i, "카카오톡"],
  [/insta|^ig$/i, "인스타그램"],
  [/facebook|^fb$|meta/i, "페이스북"],
  [/youtube|^yt$/i, "유튜브"],
  [/twitter|^x$/i, "X(트위터)"],
  [/threads/i, "스레드"],
  [/band/i, "밴드"],
];

const BY_HOST: [RegExp, VisitSource][] = [
  [/(^|\.)naver\.(com|me)$/, "네이버"],
  [/(^|\.)google\.[a-z.]+$/, "구글"],
  [/(^|\.)(daum\.net|kakao\.com)$/, "다음"],
  [/(^|\.)instagram\.com$/, "인스타그램"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "페이스북"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "유튜브"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "X(트위터)"],
  [/(^|\.)threads\.(net|com)$/, "스레드"],
  [/(^|\.)band\.us$/, "밴드"],
  [/(^|\.)bing\.com$/, "빙"],
];

// 앱 안 브라우저 표시(UA). 카카오톡 공유 링크가 대표적이다.
const BY_UA: [RegExp, VisitSource][] = [
  [/KAKAOTALK/i, "카카오톡"],
  [/Instagram/i, "인스타그램"],
  [/FBAN|FBAV/i, "페이스북"],
  [/NAVER\(inapp|NAVER\//i, "네이버"],
  [/Barcelona/i, "스레드"],
  [/BAND\//i, "밴드"],
];

/** referrer 문자열에서 호스트만(소문자, www. 제거). 잘못된 값이면 null. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

export function classifyVisitSource(input: {
  referrerHost: string | null;
  utmSource?: string | null;
  userAgent?: string | null;
  /** 이 사이트 자신의 호스트 — 사이트 안에서 옮겨 다닌 건 외부 유입이 아니다. */
  selfHost?: string | null;
}): VisitSource {
  const utm = input.utmSource?.trim();
  if (utm) {
    for (const [re, source] of BY_UTM) if (re.test(utm)) return source;
    return "기타";
  }
  const host = input.referrerHost;
  const self = input.selfHost?.toLowerCase().replace(/^www\./, "");
  if (host && host !== self) {
    for (const [re, source] of BY_HOST) if (re.test(host)) return source;
    return "기타";
  }
  const ua = input.userAgent ?? "";
  for (const [re, source] of BY_UA) if (re.test(ua)) return source;
  return "직접 방문";
}
