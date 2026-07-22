import type { Metadata } from "next";
import { Manrope, Newsreader, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSiteUrl } from "@/shared/config/site-url";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const GA_MEASUREMENT_ID = "G-VKN2T2NQX1";
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "위스키다모아 | 주류 가격 비교 사이트",
  description: "위스키다모아에서 위스키, 와인 등 주류 가격과 최저가를 검색하고 비교해보세요.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "위스키다모아 | 주류 가격 비교 사이트",
    description: "위스키다모아에서 위스키, 와인 등 주류 가격과 최저가를 검색하고 비교해보세요.",
    url: "/",
    siteName: "위스키다모아",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "위스키다모아 | 주류 가격 비교 사이트",
    description: "위스키다모아에서 위스키, 와인 등 주류 가격과 최저가를 검색하고 비교해보세요.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "Q1ZqUu7wUCZLXs7p79KixvVCfUuXO5LrETv4OiNjS-w",
    other: {
      // 네이버 웹마스터도구 소유확인(사이트별 토큰). env 로 덮어쓸 수 있음.
      "naver-site-verification":
        process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ??
        "27a0d402ad2927f9b0b0e39d0cdd523c4924b261",
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${newsreader.variable} ${manrope.variable} ${notoSansKr.variable} ${notoSerifKr.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
