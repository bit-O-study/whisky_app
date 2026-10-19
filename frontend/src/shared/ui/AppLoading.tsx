import Image from "next/image";

interface AppLoadingProps {
  variant?: "page" | "list" | "more";
  label?: string;
}

export function AppLoading({ variant = "page", label = "상품과 가격을 불러오고 있어요" }: AppLoadingProps) {
  return (
    <div className={`app-loading app-loading--${variant}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="app-loading-content">
        {variant === "page" && (
          <div className="app-loading-brand">
            <Image src="/branding/app-icon-v3.png" alt="" width={72} height={72} priority unoptimized />
            <strong>위스키다모아</strong>
            <p>좋은 위스키, 더 현명한 선택</p>
          </div>
        )}
        <div className="app-loading-message"><span className="app-loading-spinner" aria-hidden="true" /><span>{label}</span></div>
        {variant !== "more" && (
          <div className="app-loading-rows" aria-hidden="true">
            {Array.from({ length: variant === "page" ? 3 : 5 }, (_, index) => (
              <div className="app-loading-row" key={index}>
                <span className="app-loading-bottle" />
                <div><span className="app-loading-line" /><span className="app-loading-line app-loading-line--short" /></div>
                <span className="app-loading-price" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
