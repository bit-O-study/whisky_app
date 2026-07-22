"use client";

import { useEffect } from "react";

/** 세션당 1회 사이트 방문 기록. 레이아웃에 두어 첫 로드 때 한 번만 /api/visit 로 남긴다. */
export function VisitPing() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("whisky_visit_logged")) return;
      sessionStorage.setItem("whisky_visit_logged", "1");
      void fetch("/api/visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: window.location.pathname }),
        keepalive: true,
      });
    } catch {
      /* 무시 */
    }
  }, []);
  return null;
}