import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jururuk",
  description: "주류 목록과 최저가를 탐색하는 카탈로그",
  verification: {
    google: "7GV68PkrBE8meWGGpFd0nLV9q2PpMotycvohbcfBa1s",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
