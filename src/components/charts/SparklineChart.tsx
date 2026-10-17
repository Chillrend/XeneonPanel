import React, { useId, useMemo } from 'react';
import type { MetricPoint, ThemeAccent } from '../../types';

interface SparklineChartProps {
  data: MetricPoint[];
  color?: ThemeAccent | string;
  height?: number;
  unit?: string;
  showGradient?: boolean;
}

const colorMap: Record<ThemeAccent, string> = {
  amber: '#f59e0b',
  blue: '#3b82f6',
  emerald: '#10b981',
  rose: '#f43f5e',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
  indigo: '#6366f1',
};

// Generates smooth cubic Bezier curve through points
function buildSmoothSpline(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export const SparklineChart: React.FC<SparklineChartProps> = React.memo(({
  data,
  color = 'blue',
  height = 52,
  showGradient = true,
}) => {
  const gradientId = useId().replace(/:/g, '_');
  const hexColor = (colorMap as Record<string, string>)[color as ThemeAccent] || color;

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (!data || data.length === 0) {
      return { linePath: '', areaPath: '', lastPoint: null };
    }

    const VIEW_WIDTH = 300;
    const VIEW_HEIGHT = height;
    const PAD_Y = 6;

    const values = data.map((d) => d.value);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }

    const range = maxVal - minVal;
    const count = data.length;

    const coords = data.map((d, index) => {
      const x = count > 1 ? (index / (count - 1)) * VIEW_WIDTH : VIEW_WIDTH / 2;
      const normalizedY = (d.value - minVal) / range;
      const y = VIEW_HEIGHT - PAD_Y - normalizedY * (VIEW_HEIGHT - PAD_Y * 2);
      return { x, y };
    });

    const spline = buildSmoothSpline(coords);
    const last = coords[coords.length - 1];

    const area = `${spline} L ${VIEW_WIDTH} ${VIEW_HEIGHT} L 0 ${VIEW_HEIGHT} Z`;

    return { linePath: spline, areaPath: area, lastPoint: last };
  }, [data, height]);

  if (!data || data.length === 0) {
    return <div style={{ height }} className="w-full" />;
  }

  return (
    <div style={{ height }} className="w-full overflow-hidden flex items-end">
      <svg
        viewBox={`0 0 300 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full block overflow-visible pointer-events-none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hexColor} stopOpacity="0.38" />
            <stop offset="100%" stopColor={hexColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Soft gradient area fill */}
        {showGradient && areaPath && (
          <path d={areaPath} fill={`url(#${gradientId})`} />
        )}

        {/* Smooth spline stroke line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={hexColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Subtle glowing dot on the latest point */}
        {lastPoint && (
          <>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="3"
              fill={hexColor}
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="6"
              fill={hexColor}
              fillOpacity="0.3"
            />
          </>
        )}
      </svg>
    </div>
  );
});
