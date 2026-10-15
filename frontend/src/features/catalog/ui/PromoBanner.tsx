const SERVICES = [
  { label: "IQ 검사", url: "https://iq-test-fuyo-pi.vercel.app" },
  { label: "헬쑤", url: "https://health-app-five-iota.vercel.app" },
  { label: "프로젝트 메모", url: "https://meeting-minutes-orcin.vercel.app" },
];
export function PromoBanner() {
  return <nav className="compare-services" aria-label="함께하는 서비스"><span>함께하는 서비스</span><div>{SERVICES.map(service => <a key={service.url} href={service.url} target="_blank" rel="noopener noreferrer">{service.label} <span aria-hidden="true">↗</span></a>)}</div></nav>;
}
