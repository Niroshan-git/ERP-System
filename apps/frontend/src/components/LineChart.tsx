/**
 * Small inline-SVG line+area chart — no charting library in this project, and a single
 * 12-point monthly series doesn't need one. Matches the shape of ERPNext's own
 * "Sales Order Trends" dashboard chart (line with a filled region under it, gridlines
 * with abbreviated K values) using this app's own design tokens rather than Desk's.
 */
function formatK(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}K`;
  return String(Math.round(value));
}

export function LineChart({ labels, values }: { labels: string[]; values: number[] }) {
  const width = 900;
  const height = 220;
  const paddingLeft = 44;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 24;

  const max = Math.max(...values, 1);
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const stepX = values.length > 1 ? chartWidth / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + chartHeight - (v / max) * chartHeight;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const baseline = paddingTop + chartHeight;
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1][0]},${baseline} L${points[0][0]},${baseline} Z`
      : "";

  const gridFractions = [1 / 3, 2 / 3, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Sales Order Trends chart">
      {gridFractions.map((f) => {
        const y = paddingTop + chartHeight - f * chartHeight;
        return (
          <g key={f}>
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--color-border)" strokeWidth={1} />
            <text x={0} y={y + 4} fontSize={11} fill="currentColor" className="text-graphite-500">
              {formatK(max * f)}
            </text>
          </g>
        );
      })}

      {areaPath && <path d={areaPath} fill="var(--color-signal)" fillOpacity={0.08} />}
      {linePath && <path d={linePath} fill="none" stroke="var(--color-signal)" strokeWidth={2} />}

      {labels.map((label, i) => (
        <text
          key={label}
          x={paddingLeft + i * stepX}
          y={height - 4}
          fontSize={11}
          textAnchor="middle"
          fill="currentColor"
          className="text-graphite-500"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
