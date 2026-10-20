import Link from "next/link";

export default function LiquorNotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" data-testid="liquor-not-found">
            <p className="text-lg font-bold text-[color:var(--catalog-ink)]">찾는 위스키가 없어요</p>
            <p className="text-sm text-[color:var(--catalog-muted)]">주소가 바뀌었거나 판매가 끝난 상품일 수 있어요.</p>
            <Link href="/" className="catalog-btn catalog-btn-pop">위스키 목록으로</Link>
        </main>
    );
}
