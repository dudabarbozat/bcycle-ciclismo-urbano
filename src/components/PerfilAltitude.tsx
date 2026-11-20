import { formatarDistancia } from "@/lib/geo";

/* Perfil de altitude da rota em SVG. */
export default function PerfilAltitude({ coords, dist }: { coords: [number, number, number][]; dist: number[] }) {
  const total = dist[dist.length - 1] ?? 0;
  const eles = coords.map((c) => c[2]);
  const min = Math.min(...eles), max = Math.max(...eles);
  const faixa = Math.max(10, max - min);
  const W = 320, H = 90, pad = 4;
  const x = (d: number) => (total ? (d / total) * W : 0);
  const y = (e: number) => H - pad - ((e - min) / faixa) * (H - pad * 2 - 10);
  const linha = coords.map((c, i) => `${i ? "L" : "M"}${x(dist[i]!).toFixed(1)},${y(c[2]).toFixed(1)}`).join(" ");
  const area = `${linha} L${W},${H} L0,${H} Z`;
  return (
    <figure className="elevacao" style={{ margin: 0, display: "grid", gap: 4 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Altitude entre ${Math.round(min)} e ${Math.round(max)} metros ao longo de ${formatarDistancia(total)}`}>
        <defs>
          <linearGradient id="g-alt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3d5cff" stopOpacity=".7" />
            <stop offset="1" stopColor="#3d5cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#g-alt)" />
        <path d={linha} fill="none" stroke="#8fa2ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="legenda" style={{ justifyContent: "space-between" }}>
        <span>{Math.round(min)} m mín.</span>
        <span>{Math.round(max)} m máx.</span>
      </figcaption>
    </figure>
  );
}
