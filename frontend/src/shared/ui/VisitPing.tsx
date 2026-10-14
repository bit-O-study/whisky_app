"use client";

import { useEffect } from "react";

/**
 * 세션당 1회 사이트 방문 기록. 레이아웃에 두어 첫 로드 때 한 번만 /api/visit 로 남긴다.
 * 유입 경로(어디서 왔나)를 보려고 이전 페이지 주소와 광고 링크 태그(utm_*)도 같이 보낸다 —
 * 서버가 호스트만 남기고 분류한다(src/shared/lib/visit-source.ts).
 */
export function VisitPing() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("whisky_visit_logged")) return;
      sessionStorage.setItem("whisky_visit_logged", "1");
      const params = new URLSearchParams(window.location.search);
      void fetch("/api/visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || null,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
        keepalive: true,
      });
    } catch {
      /* 무시 */
    }
  }, []);
  return null;
}