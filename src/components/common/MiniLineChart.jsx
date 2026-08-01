import React, { useId } from "react";

/**
 * Gráfico de línea liviano en SVG puro.
 * Reemplaza a recharts (~400 KB) que estaba en el bundle solo para una pantalla
 * que ni siquiera se mostraba. Escala solo y funciona bien en celular.
 */
export const MiniLineChart = ({
  points = [],
  color = "var(--accent-blue)",
  height = 160,
  unit = "kg",
  showDots = true,
  formatLabel = (p) => p.date?.slice(5) || ""
}) => {
  const gradientId = useId();

  if (!points || points.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        Todavía no hay datos suficientes para dibujar la evolución.
      </div>
    );
  }

  const W = 300;
  const H = 100;
  const padY = 12;

  const values = points.map((p) => p.weight ?? p.value ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W);
  const y = (v) => H - padY - ((v - min) / range) * (H - padY * 2);

  const coords = points.map((p, i) => ({ x: x(i), y: y(values[i]), value: values[i], raw: p }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>
          {last}
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "3px" }}>{unit}</span>
        </div>
        {points.length > 1 && (
          <span className={`badge ${delta > 0 ? "badge-success" : delta < 0 ? "badge-warning" : "badge-neutral"}`}>
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {delta > 0 ? "+" : ""}
            {Number(delta.toFixed(1))} {unit} desde el inicio
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: `${height}px`, display: "block", overflow: "visible" }}
        role="img"
        aria-label={`Evolución: de ${first} a ${last} ${unit}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1="0"
            x2={W}
            y1={padY + t * (H - padY * 2)}
            y2={padY + t * (H - padY * 2)}
            stroke="var(--border-subtle)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {showDots &&
          coords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="3" fill="#FFFFFF" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "4px" }}>
        <span>{formatLabel(points[0])}</span>
        {points.length > 2 && <span>{formatLabel(points[Math.floor(points.length / 2)])}</span>}
        <span>{formatLabel(points[points.length - 1])}</span>
      </div>
    </div>
  );
};
