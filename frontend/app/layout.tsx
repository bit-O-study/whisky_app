import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jururuk",
  description: "주류 목록과 최저가를 탐색하는 카탈로그",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
