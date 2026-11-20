import { caminho } from "./base";
import type { LatLon } from "./geo";

/* ---------- Tipos ---------- */

export type Categoria = "estacionamento" | "oficina" | "compartilhada" | "banheiro" | "agua" | "ar";

export const CATEGORIAS: Record<Categoria, { rotulo: string; plural: string; cor: string; letra: string }> = {
  estacionamento: { rotulo: "Estacionamento", plural: "Estacionamentos", cor: "#3d6bff", letra: "P" },
  oficina: { rotulo: "Oficina e loja", plural: "Oficinas e lojas", cor: "#ff8a3d", letra: "O" },
  compartilhada: { rotulo: "Bike compartilhada", plural: "Bikes compartilhadas", cor: "#22c3a6", letra: "B" },
  banheiro: { rotulo: "Banheiro", plural: "Banheiros", cor: "#b07cff", letra: "WC" },
  agua: { rotulo: "Água", plural: "Água", cor: "#3dc4ff", letra: "A" },
  ar: { rotulo: "Ar e recarga", plural: "Ar e recarga", cor: "#ffd23d", letra: "+" },
};

export const ORDEM_CATEGORIAS: Categoria[] = ["estacionamento", "oficina", "compartilhada", "banheiro", "agua", "ar"];

export type Ponto = LatLon & {
  id: string; // "node/123"
  categoria: Categoria;
  nome: string;
  temNome: boolean;
  detalhes: { rotulo: string; valor: string }[];
  tags: Record<string, string>;
};

export type Ciclovia = { id: string; tipo: "ciclovia" | "ciclofaixa"; nome: string; coords: [number, number][] };

type ElementoOSM = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
};
type RespostaOSM = { osm3s?: { timestamp_osm_base?: string }; elements: ElementoOSM[] };

/* ---------- Conversão de tags ---------- */

function categoriaDe(t: Record<string, string>): Categoria | null {
  if (t.amenity === "bicycle_parking") return "estacionamento";
  if (t.shop === "bicycle" || t.amenity === "bicycle_repair_station") return "oficina";
  if (t.amenity === "bicycle_rental") return "compartilhada";
  if (t.amenity === "toilets") return "banheiro";
  if (t.amenity === "drinking_water") return "agua";
  if (t.amenity === "compressed_air" || t.amenity === "charging_station") return "ar";
  return null;
}

const TIPO_BICICLETARIO: Record<string, string> = {
  stands: "Paraciclo em U invertido",
  wall_loops: "Prende só a roda",
  rack: "Suporte (rack)",
  bollard: "Poste",
  shed: "Abrigo fechado",
  lockers: "Armários",
  building: "Dentro de prédio",
  ground_slots: "Encaixe no chão",
  wide_stands: "Paraciclo largo",
  "two-tier": "Dois andares",
};

const simNao = (v?: string) => (v === "yes" ? "Sim" : v === "no" ? "Não" : v);

function nomePadrao(c: Categoria, t: Record<string, string>): string {
  if (c === "oficina" && t.amenity === "bicycle_repair_station") return "Estação de reparo";
  if (c === "compartilhada" && t.network) return `Estação ${t.network.replace(/\s*\(.*\)$/, "")}`;
  if (c === "ar" && t.amenity === "charging_station") return "Recarga de e-bike";
  if (c === "ar") return "Calibragem de pneu";
  if (c === "estacionamento") return "Bicicletário";
  if (c === "agua") return "Bebedouro";
  return CATEGORIAS[c].rotulo;
}

function detalhesDe(c: Categoria, t: Record<string, string>): { rotulo: string; valor: string }[] {
  const d: { rotulo: string; valor: string }[] = [];
  const add = (rotulo: string, valor?: string) => { if (valor) d.push({ rotulo, valor }); };
  if (c === "estacionamento") {
    add("Vagas", t.capacity);
    add("Coberto", simNao(t.covered));
    add("Tipo", t.bicycle_parking ? TIPO_BICICLETARIO[t.bicycle_parking] ?? t.bicycle_parking : undefined);
    add("Acesso", t.access === "customers" ? "Só clientes" : t.access === "private" ? "Privado" : t.access === "yes" ? "Público" : undefined);
  }
  if (c === "oficina") {
    add("Conserto", simNao(t["service:bicycle:repair"]));
    add("Bomba de ar", simNao(t["service:bicycle:pump"]));
    add("Aluguel", simNao(t["service:bicycle:rental"]));
  }
  if (c === "compartilhada") {
    add("Rede", t.network);
    add("Operador", t.operator);
    add("Vagas", t.capacity);
  }
  if (c === "banheiro") {
    add("Acessível", simNao(t.wheelchair));
    add("Unissex", simNao(t.unisex));
  }
  add("Pago", t.fee === "yes" ? "Sim" : t.fee === "no" ? "Gratuito" : undefined);
  add("Horário", t.opening_hours === "24/7" ? "24 horas" : t.opening_hours);
  add("Telefone", t.phone ?? t["contact:phone"]);
  add("Site", t.website ?? t["contact:website"]);
  if (t["addr:street"]) add("Endereço", [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", "));
  return d;
}

export function converterPontos(r: RespostaOSM): Ponto[] {
  const vistos = new Set<string>();
  const out: Ponto[] = [];
  for (const e of r.elements) {
    const t = e.tags ?? {};
    const c = categoriaDe(t);
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!c || lat == null || lon == null) continue;
    const id = `${e.type}/${e.id}`;
    if (vistos.has(id)) continue;
    vistos.add(id);
    out.push({ id, categoria: c, lat, lon, nome: t.name ?? nomePadrao(c, t), temNome: !!t.name, detalhes: detalhesDe(c, t), tags: t });
  }
  return out;
}

const RE_FAIXA = /^(lane|track|shared_lane|share_busway)$/;
export function converterCiclovias(r: RespostaOSM): Ciclovia[] {
  return r.elements
    .filter((e) => e.type === "way" && e.geometry && e.geometry.length > 1)
    .map((e) => {
      const t = e.tags ?? {};
      const segregada = t.highway === "cycleway" || [t.cycleway, t["cycleway:left"], t["cycleway:right"], t["cycleway:both"]].includes("track");
      const temFaixa = [t.cycleway, t["cycleway:left"], t["cycleway:right"], t["cycleway:both"]].some((v) => v && RE_FAIXA.test(v));
      return {
        id: `way/${e.id}`,
        tipo: segregada ? "ciclovia" : temFaixa ? "ciclofaixa" : "ciclovia",
        nome: t.name ?? (t.highway === "cycleway" ? "Ciclovia" : "Ciclofaixa"),
        coords: e.geometry!.map((g) => [g.lat, g.lon] as [number, number]),
      };
    });
}

/* ---------- Retrato gravado (região da Paulista) ---------- */

export type Retrato = { pontos: Ponto[]; ciclovias: Ciclovia[]; dataOSM: string };

let retratoCache: Promise<Retrato> | null = null;
export function carregarRetrato(): Promise<Retrato> {
  retratoCache ??= Promise.all([
    fetch(caminho("/dados/pontos-paulista.json")).then((r) => r.json() as Promise<RespostaOSM>),
    fetch(caminho("/dados/ciclovias-paulista.json")).then((r) => r.json() as Promise<RespostaOSM>),
  ]).then(([p, c]) => ({
    pontos: converterPontos(p),
    ciclovias: converterCiclovias(c),
    dataOSM: p.osm3s?.timestamp_osm_base ?? "",
  }));
  retratoCache.catch(() => { retratoCache = null; });
  return retratoCache;
}

/* ---------- Busca ao vivo (Overpass) ---------- */

/* Servidores públicos do Overpass. Todos respondem com CORS liberado, mas são lentos e às vezes
   recusam a consulta; tentamos um de cada vez. */
const SERVIDORES = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export type Recorte = { sul: number; oeste: number; norte: number; leste: number };

/* Área máxima aceita, em graus quadrados (cerca de 6 x 6 km no Brasil). */
export const AREA_MAXIMA = 0.0035;
export const areaDo = (r: Recorte) => (r.norte - r.sul) * (r.leste - r.oeste);

export function consultaOverpass(r: Recorte): string {
  const bb = `${r.sul.toFixed(5)},${r.oeste.toFixed(5)},${r.norte.toFixed(5)},${r.leste.toFixed(5)}`;
  return `[out:json][timeout:60][bbox:${bb}];
(nwr[amenity~"^(bicycle_parking|bicycle_repair_station|bicycle_rental|toilets|drinking_water|compressed_air)$"];nwr[shop=bicycle];node[amenity=charging_station][bicycle=yes];);
out center tags;
(way[highway=cycleway];way[~"^cycleway(:left|:right|:both)?$"~"^(lane|track)$"];);
out geom;`;
}

export async function buscarAoVivo(
  r: Recorte,
  aoTentar?: (n: number, total: number) => void,
  sinal?: AbortSignal,
): Promise<Retrato> {
  const corpo = new URLSearchParams({ data: consultaOverpass(r) });
  let ultimoErro: unknown = null;
  for (let i = 0; i < SERVIDORES.length; i++) {
    if (sinal?.aborted) throw new DOMException("cancelado", "AbortError");
    aoTentar?.(i + 1, SERVIDORES.length);
    const ctrl = new AbortController();
    const parar = () => ctrl.abort();
    sinal?.addEventListener("abort", parar);
    const prazo = setTimeout(parar, 40000);
    try {
      const resp = await fetch(SERVIDORES[i]!, { method: "POST", body: corpo, signal: ctrl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = (await resp.json()) as RespostaOSM;
      return { pontos: converterPontos(json), ciclovias: converterCiclovias(json), dataOSM: json.osm3s?.timestamp_osm_base ?? "" };
    } catch (e) {
      ultimoErro = e;
      if (sinal?.aborted) throw e;
    } finally {
      clearTimeout(prazo);
      sinal?.removeEventListener("abort", parar);
    }
  }
  throw ultimoErro ?? new Error("Sem resposta");
}

export function rotuloDataOSM(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
