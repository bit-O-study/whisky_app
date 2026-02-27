import type { FlavorVector } from "../types/preference";

interface FlavorRadarChartProps {
  vector: FlavorVector;
}

const labels: { key: keyof FlavorVector; text: string }[] = [
  { key: "sweet", text: "Sweet" },
  { key: "smoky", text: "Smoky" },
  { key: "fruity", text: "Fruity" },
  { key: "spicy", text: "Spicy" },
  { key: "woody", text: "Woody" },
  { key: "body", text: "Body" },
];

function toPoint(index: number, ratio: number, radius: number, cx: number, cy: number) {
  const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * radius * ratio,
    y: cy + Math.sin(angle) * radius * ratio,
  };
}

export default function FlavorRadarChart({ vector }: FlavorRadarChartProps) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 108;

  const ratios = labels.map(({ key }) => Math.max(0, Math.min(100, vector[key])) / 100);

  const polygon = ratios
    .map((ratio, index) => {
      const point = toPoint(index, ratio, radius, cx, cy);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="w-full max-w-sm mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
        {[0.2, 0.4, 0.6, 0.8, 1].map((step) => {
          const points = labels
            .map((_, index) => {
              const point = toPoint(index, step, radius, cx, cy);
              return `${point.x},${point.y}`;
            })
            .join(" ");

          return (
            <polygon
              key={step}
              points={points}
              fill="none"
              stroke={step === 1 ? "#d1d5db" : "#e5e7eb"}
              strokeWidth={step === 1 ? 1.3 : 1}
            />
          );
        })}

        {labels.map((label, index) => {
          const outer = toPoint(index, 1, radius, cx, cy);
          const text = toPoint(index, 1.18, radius, cx, cy);

          return (
            <g key={label.key}>
              <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={text.x} y={text.y} textAnchor="middle" className="fill-gray-600 text-[12px] font-semibold">
                {label.text}
              </text>
            </g>
          );
        })}

        <polygon points={polygon} fill="rgba(245, 158, 11, 0.35)" stroke="#f59e0b" strokeWidth="2" />
        {ratios.map((ratio, index) => {
          const point = toPoint(index, ratio, radius, cx, cy);
          return <circle key={labels[index].key} cx={point.x} cy={point.y} r="4" fill="#f59e0b" />;
        })}
      </svg>
    </div>
  );
}
