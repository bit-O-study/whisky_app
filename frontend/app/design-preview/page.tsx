import type { Metadata } from "next";
import DesignGallery from "./DesignGallery";
export const metadata: Metadata = {
 title: "위스키다모아 · 디자인 시안 비교",
 description: "위스키다모아 리뉴얼 디자인 세 가지를 비교합니다.",
 robots: { index: false, follow: false },
 alternates: { canonical: "/design-preview" },
};
export default function DesignPreviewPage() { return <DesignGallery />; }
