"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { LatLon } from "@/lib/geo";
import { CATEGORIAS, type Ciclovia, type Ponto, type Recorte } from "@/lib/osm";
import { TIPOS_ALERTA, type Alerta } from "@/lib/estado";

export type Marcador = LatLon & { id: string; tipo: "eu" | "a" | "b" | "ciclista" };

export type ControleMapa = {
  irPara: (p: LatLon, zoom?: number) => void;
  enquadrar: (pontos: LatLon[], margemInferior?: number, margemSuperior?: number) => void;
  centro: () => LatLon;
  recorte: () => Recorte;
};

type Props = {
  centro: LatLon;
  zoom?: number;
  ciclovias?: Ciclovia[];
  pontos?: Ponto[];
  pontoAtivo?: string | null;
  alertas?: Alerta[];
  rota?: [number, number, number?][] | null;
  rotaFeita?: number; // índice até onde a rota já foi percorrida
  marcadores?: Marcador[];
  aoClicarPonto?: (p: Ponto) => void;
  aoClicarAlerta?: (a: Alerta) => void;
  aoClicarMapa?: (p: LatLon) => void;
  aoMover?: (r: Recorte, centro: LatLon, zoom: number) => void;
  aoPronto?: (c: ControleMapa) => void;
  rotulo?: string;
};

export default function Mapa(props: Props) {
  const div = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const mapa = useRef<Leaflet.Map | null>(null);
  const camadas = useRef<Record<string, Leaflet.LayerGroup>>({});
  const cbs = useRef(props);
  cbs.current = props;
  const [pronto, setPronto] = useState(false);

  /* Cria o mapa uma vez. */
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const lf = await import("leaflet");
      if (cancelado || !div.current) return;
      L.current = lf;
      const m = lf.map(div.current, {
        center: [props.centro.lat, props.centro.lon],
        zoom: props.zoom ?? 15,
        zoomControl: false,
        preferCanvas: false,
        attributionControl: true,
      });
      lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(m);
      m.attributionControl.setPrefix(false);
      for (const k of ["ciclovias", "rota", "pontos", "alertas", "marcadores"]) camadas.current[k] = lf.layerGroup().addTo(m);
      const recorte = (): Recorte => {
        const b = m.getBounds();
        return { sul: b.getSouth(), oeste: b.getWest(), norte: b.getNorth(), leste: b.getEast() };
      };
      m.on("moveend", () => {
        const c = m.getCenter();
        cbs.current.aoMover?.(recorte(), { lat: c.lat, lon: c.lng }, m.getZoom());
      });
      m.on("click", (e: Leaflet.LeafletMouseEvent) => cbs.current.aoClicarMapa?.({ lat: e.latlng.lat, lon: e.latlng.lng }));
      mapa.current = m;
      setPronto(true);
      cbs.current.aoPronto?.({
        irPara: (p, z) => m.flyTo([p.lat, p.lon], z ?? m.getZoom(), { duration: 0.6 }),
        enquadrar: (pts, baixo = 40, cima = 40) => {
          if (pts.length === 0) return;
          m.invalidateSize();
          m.fitBounds(lf.latLngBounds(pts.map((p) => [p.lat, p.lon] as [number, number])), {
            paddingTopLeft: [30, cima],
            paddingBottomRight: [30, baixo],
          });
        },
        centro: () => { const c = m.getCenter(); return { lat: c.lat, lon: c.lng }; },
        recorte,
      });
      const c = m.getCenter();
      cbs.current.aoMover?.(recorte(), { lat: c.lat, lon: c.lng }, m.getZoom());
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* O mapa precisa recalcular o tamanho quando o contêiner muda (painéis que abrem e fecham). */
  useEffect(() => {
    if (!pronto || !div.current) return;
    const ro = new ResizeObserver(() => mapa.current?.invalidateSize());
    ro.observe(div.current);
    return () => ro.disconnect();
  }, [pronto]);

  /* Ciclovias: linhas azuis; ciclofaixas tracejadas. Desenhadas em canvas por desempenho. */
  useEffect(() => {
    const lf = L.current, g = camadas.current.ciclovias;
    if (!pronto || !lf || !g) return;
    g.clearLayers();
    const r = lf.canvas({ padding: 0.3 });
    for (const c of props.ciclovias ?? []) {
      lf.polyline(c.coords, {
        renderer: r,
        color: c.tipo === "ciclovia" ? "#3d7bff" : "#7fa0ff",
        weight: c.tipo === "ciclovia" ? 4 : 3,
        opacity: 0.85,
        dashArray: c.tipo === "ciclofaixa" ? "6 6" : undefined,
        interactive: false,
      }).addTo(g);
    }
  }, [pronto, props.ciclovias]);

  /* Rota calculada (e o trecho já percorrido, se houver). */
  useEffect(() => {
    const lf = L.current, g = camadas.current.rota;
    if (!pronto || !lf || !g) return;
    g.clearLayers();
    const rota = props.rota;
    if (!rota || rota.length < 2) return;
    const pts = rota.map(([a, b]) => [a, b] as [number, number]);
    lf.polyline(pts, { color: "#05080d", weight: 10, opacity: 0.7, interactive: false }).addTo(g);
    lf.polyline(pts, { color: "#ffffff", weight: 6, opacity: 0.95, interactive: false }).addTo(g);
    if (props.rotaFeita && props.rotaFeita > 0) {
      lf.polyline(pts.slice(0, props.rotaFeita + 1), { color: "#2fd18c", weight: 6, opacity: 1, interactive: false }).addTo(g);
    }
  }, [pronto, props.rota, props.rotaFeita]);

  /* Pontos de apoio. */
  useEffect(() => {
    const lf = L.current, g = camadas.current.pontos;
    if (!pronto || !lf || !g) return;
    g.clearLayers();
    for (const p of props.pontos ?? []) {
      const cat = CATEGORIAS[p.categoria];
      const ativo = p.id === props.pontoAtivo;
      const icon = lf.divIcon({
        className: "",
        html: `<div class="pino${ativo ? " ativo" : ""}" style="background:${cat.cor}"><span>${cat.letra}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [4, 30],
      });
      lf.marker([p.lat, p.lon], { icon, title: `${cat.rotulo}: ${p.nome}`, alt: `${cat.rotulo}: ${p.nome}`, keyboard: true, zIndexOffset: ativo ? 1000 : 0 })
        .on("click", () => cbs.current.aoClicarPonto?.(p))
        .addTo(g);
    }
  }, [pronto, props.pontos, props.pontoAtivo]);

  /* Alertas da comunidade. */
  useEffect(() => {
    const lf = L.current, g = camadas.current.alertas;
    if (!pronto || !lf || !g) return;
    g.clearLayers();
    for (const a of props.alertas ?? []) {
      const t = TIPOS_ALERTA[a.tipo];
      const icon = lf.divIcon({
        className: "",
        html: `<div class="pino-alerta${a.resolvido ? " resolvido" : ""}">${t.emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      lf.marker([a.lat, a.lon], { icon, title: t.rotulo, alt: t.rotulo, keyboard: true })
        .on("click", () => cbs.current.aoClicarAlerta?.(a))
        .addTo(g);
    }
  }, [pronto, props.alertas]);

  /* Marcadores: posição, origem, destino e o ciclista na navegação. */
  useEffect(() => {
    const lf = L.current, g = camadas.current.marcadores;
    if (!pronto || !lf || !g) return;
    g.clearLayers();
    for (const m of props.marcadores ?? []) {
      const html =
        m.tipo === "eu" || m.tipo === "ciclista"
          ? `<div class="pino-eu"></div>`
          : `<div class="pino-ab" style="background:${m.tipo === "a" ? "#2fd18c" : "#ff2a55"}">${m.tipo.toUpperCase()}</div>`;
      const tam = m.tipo === "eu" || m.tipo === "ciclista" ? 20 : 28;
      lf.marker([m.lat, m.lon], {
        icon: lf.divIcon({ className: "", html, iconSize: [tam, tam], iconAnchor: [tam / 2, tam / 2] }),
        interactive: false,
        zIndexOffset: 2000,
      }).addTo(g);
    }
  }, [pronto, props.marcadores]);

  return <div ref={div} className="mapa" role="region" aria-label={props.rotulo ?? "Mapa"} />;
}
