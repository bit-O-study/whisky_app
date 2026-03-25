import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bit-o-liquor.vercel.app"),
  title: "Jururuk",
  description: "주류 목록과 최저가를 탐색하는 사이트",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Jururuk",
    description: "주류 목록과 최저가를 탐색하는 사이트",
    url: "/",
    siteName: "Jururuk",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jururuk",
    description: "주류 목록과 최저가를 탐색하는 사이트",
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
      </body>
    </html>
  );
}
