"use client";

import { useMemo, useState } from "react";
import type { PriceHistoryPoint } from "../api/catalog-server";

interface Props {
  points: PriceHistoryPoint[];
}

const W = 720;
const H = 220;
const PAD_X = 28;
const PAD_TOP = 26;
const PAD_BOTTOM = 32;

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function formatShortDate(iso: string) {
  // iso: YYYY-MM-DD
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function PriceTrendChart({ points }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((p) => p.lowest);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // give some headroom so the line doesn't kiss the edges
    const range = max - min;
    const yMin = range === 0 ? min - min * 0.05 : min - range * 0.15;
    const yMax = range === 0 ? max + max * 0.05 : max + range * 0.15;
    return { min, max, yMin, yMax };
  }, [points]);

  // 추이 그래프는 서로 다른 날짜가 2개 이상일 때만 의미가 있음.
  if (points.length < 2 || !stats) {
    return (
      <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-[color:var(--catalog-outline)] bg-[color:var(--catalog-bg-secondary)] px-6 text-center">
        <p className="text-sm text-[color:var(--catalog-muted)]">
          {points.length === 0
            ? "아직 가격 변동 기록이 없습니다"
            : "가격 추이를 보여주려면 다른 날짜의 기록이 더 필요합니다"}
        </p>
      </div>
    );
  }

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    points.length === 1 ? W / 2 : PAD_X + (i / (points.length - 1)) * innerW;
  const yFor = (v: number) =>
    PAD_TOP + (1 - (v - stats.yMin) / (stats.yMax - stats.yMin)) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(p.lowest).toFixed(2)}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${xFor(points.length - 1).toFixed(2)} ${(H - PAD_BOTTOM).toFixed(2)}` +
    ` L ${xFor(0).toFixed(2)} ${(H - PAD_BOTTOM).toFixed(2)} Z`;

  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.lowest - first.lowest;
  const deltaPct = first.lowest > 0 ? (delta / first.lowest) * 100 : 0;
  const deltaUp = delta > 0;
  const deltaDown = delta < 0;

  const hoverPoint = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div className="rounded-3xl border border-[color:var(--catalog-outline)] bg-[color:var(--catalog-surface)] p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="catalog-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--catalog-primary)]">
            Lowest Price · {points.length}-day trend
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--catalog-ink)]">
            {formatPrice(hoverPoint?.lowest ?? last.lowest)}
          </p>
          <p className="mt-1 catalog-mono text-[11px] text-[color:var(--catalog-muted)]">
            {hoverPoint ? hoverPoint.date : `${first.date} → ${last.date}`}
          </p>
        </div>
        {points.length > 1 && (
          <div
            className={`rounded-full px-3 py-1.5 catalog-mono text-xs font-bold ${
              deltaUp
                ? "bg-[color:var(--catalog-primary-soft)] text-[color:var(--catalog-primary-strong)]"
                : deltaDown
                  ? "bg-[color:var(--catalog-bg-secondary)] text-[color:var(--catalog-ink)]"
                  : "bg-[color:var(--catalog-bg-secondary)] text-[color:var(--catalog-muted)]"
            }`}
          >
            {deltaUp ? "▲" : deltaDown ? "▼" : "—"} {Math.abs(deltaPct).toFixed(1)}% (
            {(delta >= 0 ? "+" : "") + delta.toLocaleString("ko-KR")}원)
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          const i =
            points.length === 1
              ? 0
              : Math.max(
                  0,
                  Math.min(
                    points.length - 1,
                    Math.round(((x - PAD_X) / innerW) * (points.length - 1)),
                  ),
                );
          setHoverIdx(i);
        }}
      >
        <defs>
          <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--catalog-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--catalog-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridline at min/max */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={yFor(stats.max)}
          y2={yFor(stats.max)}
          stroke="var(--catalog-hairline)"
          strokeDasharray="3 4"
        />
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={yFor(stats.min)}
          y2={yFor(stats.min)}
          stroke="var(--catalog-hairline)"
          strokeDasharray="3 4"
        />
        <text
          x={PAD_X}
          y={yFor(stats.max) - 6}
          fontSize="10"
          fill="var(--catalog-muted)"
          fontFamily="ui-monospace, monospace"
        >
          {formatPrice(stats.max)}
        </text>
        <text
          x={PAD_X}
          y={yFor(stats.min) - 6}
          fontSize="10"
          fill="var(--catalog-muted)"
          fontFamily="ui-monospace, monospace"
        >
          {formatPrice(stats.min)}
        </text>

        {/* area fill */}
        <path d={areaPath} fill="url(#priceArea)" />
        {/* line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--catalog-primary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* points */}
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={xFor(i)}
            cy={yFor(p.lowest)}
            r={hoverIdx === i ? 5 : 3}
            fill={hoverIdx === i ? "var(--catalog-primary)" : "var(--catalog-surface)"}
            stroke="var(--catalog-primary)"
            strokeWidth="1.6"
          />
        ))}
        {/* hover guideline */}
        {hoverIdx != null && (
          <line
            x1={xFor(hoverIdx)}
            x2={xFor(hoverIdx)}
            y1={PAD_TOP - 6}
            y2={H - PAD_BOTTOM + 6}
            stroke="var(--catalog-outline-strong)"
            strokeWidth="1"
          />
        )}

        {/* x labels — first / mid / last */}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((idx, i, arr) => arr.indexOf(idx) === i && idx >= 0 && idx < points.length)
          .map((idx) => (
            <text
              key={`xl-${idx}`}
              x={xFor(idx)}
              y={H - 10}
              fontSize="10"
              fill="var(--catalog-muted)"
              textAnchor={idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle"}
              fontFamily="ui-monospace, monospace"
            >
              {formatShortDate(points[idx].date)}
            </text>
          ))}
      </svg>
    </div>
  );
}
