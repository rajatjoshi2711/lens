/**
 * Low-contrast network motif echoing the brain mark's graph. Corner or edge
 * treatment only, never behind body text. Geometry from the brand UI kit.
 */
const NODES: [number, number][] = [
  [470, 20], [540, 54], [610, 26], [680, 60], [610, 96], [500, 92], [620, 130], [700, 120],
];

export function NetworkMotif({ opacity = 0.16, color = "#ffffff", className }: {
  opacity?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 700 160"
      preserveAspectRatio="xMaxYMin meet"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke={color} strokeOpacity={opacity} fill={color} fillOpacity={opacity * 1.4} strokeWidth="1">
        <path d="M470 20 L540 54 L610 26 L680 60 L610 96 L540 54 M470 20 L500 92 L540 54 M610 96 L620 130 L700 120 M610 26 L700 10" />
        {NODES.map(([x, y], i) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={i % 2 ? 4 : 5.5} />
        ))}
      </g>
    </svg>
  );
}
