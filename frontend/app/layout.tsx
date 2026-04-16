import type { Metadata } from "next";
import { Manrope, Newsreader, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://bit-o-liquor.vercel.app"),
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
    google: "7GV68PkrBE8meWGGpFd0nLV9q2PpMotycvohbcfBa1s",
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
