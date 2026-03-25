import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-VKN2T2NQX1";

export const metadata: Metadata = {
  metadataBase: new URL("https://bit-o-liquor.vercel.app"),
  title: "Jururuk | 주류 가격 비교 사이트",
  description: "Jururuk에서 위스키, 와인 등 주류 가격과 최저가를 검색하고 비교해보세요.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Jururuk | 주류 가격 비교 사이트",
    description: "Jururuk에서 위스키, 와인 등 주류 가격과 최저가를 검색하고 비교해보세요.",
    url: "/",
    siteName: "Jururuk",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jururuk | 주류 가격 비교 사이트",
    description: "Jururuk에서 위스키, 와인 등 주류 가격과 최저가를 검색하고 비교해보세요.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
