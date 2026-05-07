import {
  FLAVOR_AXIS_KEYS,
  FLAVOR_AXIS_LABELS,
  type FlavorAxisKey,
} from "../../admin/liquor-info/model/admin-liquor-info";

export interface FlavorRadarValues {
  sweet: number | null;
  smoky: number | null;
  fruity: number | null;
  spicy: number | null;
  woody: number | null;
  body: number | null;
}

interface Props {
  values: FlavorRadarValues;
  size?: number;
  max?: number;
  showLabels?: boolean;
}

const RING_LEVELS = [1, 2, 3, 4, 5];

function pointOnAxis(index: number, ratio: number, cx: number, cy: number, radius: number) {
  const angle = (Math.PI * 2 * index) / FLAVOR_AXIS_KEYS.length - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * radius * ratio,
    y: cy + Math.sin(angle) * radius * ratio,
  };
}

export function hasAnyFlavorValue(values: FlavorRadarValues) {
  return FLAVOR_AXIS_KEYS.some((key) => {
    const v = values[key];
    return typeof v === "number" && v > 0;
  });
}

export default function FlavorRadarChart({ values, size = 280, max = 5, showLabels = true }: Props) {
  const padding = showLabels ? 44 : 8;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - padding * 2) / 2;

  const dataPoints = FLAVOR_AXIS_KEYS.map((key, idx) => {
    const raw = values[key];
    const safe = typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, Math.min(max, raw)) : 0;
    const ratio = safe / max;
    return { ...pointOnAxis(idx, ratio, cx, cy, radius), key, value: safe };
  });

  const polygonPoints = dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="맛 프로필 레이더 차트"
      style={{ display: "block" }}
    >
      {RING_LEVELS.map((level) => {
        const ringRatio = level / max;
        const ringPoints = FLAVOR_AXIS_KEYS.map((_, idx) => {
          const p = pointOnAxis(idx, ringRatio, cx, cy, radius);
          return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={ringPoints}
            fill="none"
            stroke="rgba(82,68,57,0.18)"
            strokeWidth={level === max ? 1.4 : 0.8}
          />
        );
      })}

      {FLAVOR_AXIS_KEYS.map((_, idx) => {
        const end = pointOnAxis(idx, 1, cx, cy, radius);
        return (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="rgba(82,68,57,0.18)"
            strokeWidth={0.8}
          />
        );
      })}

      <polygon
        points={polygonPoints}
        fill="rgba(139,74,44,0.22)"
        stroke="var(--catalog-primary, #8b4a2c)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />

      {dataPoints.map((p) => (
        <circle key={p.key} cx={p.x} cy={p.y} r={3} fill="var(--catalog-primary, #8b4a2c)" />
      ))}

      {showLabels &&
        FLAVOR_AXIS_KEYS.map((key, idx) => {
          const labelPos = pointOnAxis(idx, 1.18, cx, cy, radius);
          const anchor =
            Math.abs(labelPos.x - cx) < 6 ? "middle" : labelPos.x > cx ? "start" : "end";
          return (
            <text
              key={key}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={700}
              fill="var(--catalog-ink, #1c1c17)"
            >
              {FLAVOR_AXIS_LABELS[key as FlavorAxisKey]}
            </text>
          );
        })}
    </svg>
  );
}