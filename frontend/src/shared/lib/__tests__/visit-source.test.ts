import { describe, expect, it } from "vitest";

import { classifyVisitSource, referrerHost } from "../visit-source";

describe("referrerHost", () => {
  it("호스트만 남기고 www 와 검색어를 버린다", () => {
    expect(referrerHost("https://www.google.com/search?q=발베니")).toBe("google.com");
    expect(referrerHost("https://m.search.naver.com/search.naver?query=x")).toBe("m.search.naver.com");
  });
  it("빈 값·잘못된 값은 null", () => {
    expect(referrerHost("")).toBeNull();
    expect(referrerHost("not a url")).toBeNull();
  });
});

describe("classifyVisitSource", () => {
  const self = "whisky.example.com";
  it("검색·SNS 호스트를 알아본다", () => {
    expect(classifyVisitSource({ referrerHost: "m.search.naver.com", selfHost: self })).toBe("네이버");
    expect(classifyVisitSource({ referrerHost: "blog.naver.com", selfHost: self })).toBe("네이버");
    expect(classifyVisitSource({ referrerHost: "google.co.kr", selfHost: self })).toBe("구글");
    expect(classifyVisitSource({ referrerHost: "l.instagram.com", selfHost: self })).toBe("인스타그램");
    expect(classifyVisitSource({ referrerHost: "t.co", selfHost: self })).toBe("X(트위터)");
  });
  it("utm_source 가 referrer 보다 먼저다", () => {
    expect(classifyVisitSource({ referrerHost: "google.com", utmSource: "kakao", selfHost: self })).toBe("카카오톡");
    expect(classifyVisitSource({ referrerHost: null, utmSource: "newsletter", selfHost: self })).toBe("기타");
  });
  it("referrer 가 비면 앱 안 브라우저(UA)로 보충한다", () => {
    expect(classifyVisitSource({ referrerHost: null, userAgent: "Mozilla/5.0 ... KAKAOTALK 10.8.1", selfHost: self })).toBe("카카오톡");
    expect(classifyVisitSource({ referrerHost: null, userAgent: "Mozilla/5.0 ... Instagram 300.0", selfHost: self })).toBe("인스타그램");
  });
  it("자기 사이트 안 이동과 아무 정보 없음은 직접 방문", () => {
    expect(classifyVisitSource({ referrerHost: self, selfHost: "www." + self })).toBe("직접 방문");
    expect(classifyVisitSource({ referrerHost: null, userAgent: "Mozilla/5.0 Chrome", selfHost: self })).toBe("직접 방문");
  });
  it("모르는 사이트는 기타", () => {
    expect(classifyVisitSource({ referrerHost: "cafe.example.org", selfHost: self })).toBe("기타");
  });
});
