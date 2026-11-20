export type LatLon = { lat: number; lon: number };

/* Lugares de partida do protótipo, dentro do retrato de dados gravado. */
export const LUGARES_EXEMPLO = {
  curitiba: { lat: -25.4285, lon: -49.2711, nome: "Praça Tiradentes, Curitiba" },
  tamandare: { lat: -25.3133, lon: -49.2998, nome: "Centro de Almirante Tamandaré" },
} as const;

/* Ponto padrão: Centro de Curitiba, onde está a maior parte da infraestrutura mapeada. */
export const PONTO_PADRAO: LatLon & { nome: string } = LUGARES_EXEMPLO.curitiba;

/* Recorte do retrato gravado do OpenStreetMap (sul, oeste, norte, leste):
   do Centro de Almirante Tamandaré ao Centro de Curitiba, passando pelo Tanguá e pelo Barigui. */
export const RECORTE_RETRATO = { sul: -25.455, oeste: -49.335, norte: -25.29, leste: -49.225 };

const R = 6371008.8;
const rad = (g: number) => (g * Math.PI) / 180;

/* Distância em metros (haversine). */
export function distancia(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* Distância de um ponto a um segmento, em metros, usando projeção plana local (boa para poucos km). */
function distSegmento(p: LatLon, a: LatLon, b: LatLon): number {
  const kx = Math.cos(rad(p.lat)) * 111320;
  const ky = 110540;
  const ax = (a.lon - p.lon) * kx, ay = (a.lat - p.lat) * ky;
  const bx = (b.lon - p.lon) * kx, by = (b.lat - p.lat) * ky;
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : -(ax * dx + ay * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx, y = ay + t * dy;
  return Math.sqrt(x * x + y * y);
}

/* Menor distância de um ponto a uma linha, e o índice do segmento mais próximo. */
export function distanciaALinha(p: LatLon, linha: LatLon[]): { metros: number; indice: number } {
  let melhor = Infinity, indice = 0;
  for (let i = 0; i < linha.length - 1; i++) {
    const d = distSegmento(p, linha[i]!, linha[i + 1]!);
    if (d < melhor) { melhor = d; indice = i; }
  }
  if (linha.length === 1) melhor = distancia(p, linha[0]!);
  return { metros: melhor, indice };
}

export function dentroDoRetrato(p: LatLon): boolean {
  const r = RECORTE_RETRATO;
  return p.lat >= r.sul && p.lat <= r.norte && p.lon >= r.oeste && p.lon <= r.leste;
}

export function formatarDistancia(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10 || Math.round(m)} m`;
  return `${(m / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

export function formatarTempo(seg: number): string {
  const min = Math.max(1, Math.round(seg / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${String(min % 60).padStart(2, "0")}`;
}

/* Tempo pedalando a uma velocidade urbana média, para pontos fora de rota calculada. */
export const VELOCIDADE_URBANA_KMH = 15;
export function tempoPedalando(metros: number): number {
  return (metros / 1000 / VELOCIDADE_URBANA_KMH) * 3600;
}

export function linkMapa(p: LatLon): string {
  return `https://www.openstreetmap.org/?mlat=${p.lat.toFixed(6)}&mlon=${p.lon.toFixed(6)}#map=18/${p.lat.toFixed(6)}/${p.lon.toFixed(6)}`;
}
