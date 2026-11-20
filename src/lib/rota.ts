import type { LatLon } from "./geo";

/* Roteamento pelo BRouter (brouter.de), feito para bicicleta, com altitude e tags de cada trecho. */

export type PerfilRota = "safety" | "trekking" | "fastbike";

export const PERFIS: Record<PerfilRota, { rotulo: string; descricao: string }> = {
  safety: { rotulo: "Mais segura", descricao: "Prioriza ciclovias e ruas calmas, mesmo que fique mais longa." },
  trekking: { rotulo: "Equilibrada", descricao: "Meio-termo entre distância e conforto." },
  fastbike: { rotulo: "Mais rápida", descricao: "Caminho mais direto, aceita avenidas movimentadas." },
};

export type Instrucao = { indice: number; texto: string; seta: string; metrosAteProxima: number };

export type Trecho = { metros: number; tags: Record<string, string>; inicio: number };

export type Analise = {
  emCiclovia: number; // metros
  semPavimento: number;
  viaMovimentadaSemFaixa: number;
  trechosAtencao: { nome: string; motivo: string; metros: number; ponto: LatLon }[];
};

export type Rota = {
  perfil: PerfilRota;
  coords: [number, number, number][]; // lat, lon, altitude
  metros: number;
  segundos: number;
  subida: number;
  instrucoes: Instrucao[];
  analise: Analise;
  distAcumulada: number[]; // metros desde o início até cada ponto
};

/* Comandos de voz do BRouter (VoiceHint). */
const COMANDOS: Record<number, [string, string]> = {
  1: ["Siga em frente", "↑"],
  2: ["Vire à esquerda", "←"],
  3: ["Vire levemente à esquerda", "↖"],
  4: ["Vire acentuadamente à esquerda", "↙"],
  5: ["Vire à direita", "→"],
  6: ["Vire levemente à direita", "↗"],
  7: ["Vire acentuadamente à direita", "↘"],
  8: ["Mantenha-se à esquerda", "↖"],
  9: ["Mantenha-se à direita", "↗"],
  10: ["Faça o retorno", "↶"],
  11: ["Faça o retorno", "↶"],
  12: ["Faça o retorno", "↷"],
  14: ["Entre na rotatória", "⟳"],
  15: ["Entre na rotatória", "⟲"],
  17: ["Saia à esquerda", "↖"],
  18: ["Saia à direita", "↗"],
};

const PAVIMENTADO = /^(asphalt|paved|concrete|concrete:plates|paving_stones|sett|chipseal|metal|wood)$/;
const MOVIMENTADA = /^(primary|primary_link|secondary|secondary_link|trunk|trunk_link)$/;

function tagsDe(s: string): Record<string, string> {
  const t: Record<string, string> = {};
  for (const par of s.split(" ")) {
    const i = par.indexOf("=");
    if (i > 0) t[par.slice(0, i)] = par.slice(i + 1);
  }
  return t;
}

export function temInfraCiclo(t: Record<string, string>): boolean {
  if (t.highway === "cycleway" || t.bicycle === "designated") return true;
  return ["cycleway", "cycleway:left", "cycleway:right", "cycleway:both"].some((k) => {
    const v = t[k];
    return v === "lane" || v === "track" || v === "opposite_lane" || v === "opposite_track";
  });
}

const NOMES_VIA: Record<string, string> = {
  primary: "avenida principal",
  secondary: "avenida",
  trunk: "via expressa",
};

export function urlBRouter(a: LatLon, b: LatLon, perfil: PerfilRota): string {
  const ll = `${a.lon.toFixed(6)},${a.lat.toFixed(6)}|${b.lon.toFixed(6)},${b.lat.toFixed(6)}`;
  return `https://brouter.de/brouter?lonlats=${ll}&profile=${perfil}&alternativeidx=0&format=geojson&timode=2`;
}

type RespostaBRouter = {
  features: {
    geometry: { coordinates: [number, number, number?][] };
    properties: {
      "track-length": string;
      "filtered ascend": string;
      "total-time": string;
      voicehints?: [number, number, number, number, number][];
      messages?: string[][];
    };
  }[];
};

export async function calcularRota(a: LatLon, b: LatLon, perfil: PerfilRota, sinal?: AbortSignal): Promise<Rota> {
  const resp = await fetch(urlBRouter(a, b, perfil), { signal: sinal });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    if (/not mapped|position not/i.test(txt)) throw new Error("Um dos pontos está longe de qualquer rua mapeada.");
    throw new Error(`O serviço de rotas respondeu com erro (${resp.status}).`);
  }
  const json = (await resp.json()) as RespostaBRouter;
  const f = json.features[0];
  if (!f) throw new Error("Nenhuma rota encontrada.");
  const coords = f.geometry.coordinates.map(([lon, lat, ele]) => [lat, lon, ele ?? 0] as [number, number, number]);

  const distAcumulada: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const [la1, lo1] = coords[i - 1]!, [la2, lo2] = coords[i]!;
    const dy = (la2 - la1) * 110540, dx = (lo2 - lo1) * 111320 * Math.cos((la1 * Math.PI) / 180);
    distAcumulada.push(distAcumulada[i - 1]! + Math.hypot(dx, dy));
  }

  /* Trechos: cada linha de "messages" traz as tags do caminho e a distância percorrida com elas. */
  const msgs = f.properties.messages ?? [];
  const cab = msgs[0] ?? [];
  const iLon = cab.indexOf("Longitude"), iLat = cab.indexOf("Latitude"), iDist = cab.indexOf("Distance"), iTags = cab.indexOf("WayTags");
  const analise: Analise = { emCiclovia: 0, semPavimento: 0, viaMovimentadaSemFaixa: 0, trechosAtencao: [] };
  const atencao = new Map<string, { nome: string; motivo: string; metros: number; ponto: LatLon }>();
  for (const linha of msgs.slice(1)) {
    const metros = Number(linha[iDist]) || 0;
    const t = tagsDe(linha[iTags] ?? "");
    const ponto = { lat: Number(linha[iLat]) / 1e6, lon: Number(linha[iLon]) / 1e6 };
    if (temInfraCiclo(t)) analise.emCiclovia += metros;
    if (t.surface && !PAVIMENTADO.test(t.surface) && t.surface !== "unknown") {
      analise.semPavimento += metros;
      const k = `pav:${t.surface}`;
      const a = atencao.get(k) ?? { nome: "Trecho sem asfalto", motivo: `Piso ${t.surface}`, metros: 0, ponto };
      a.metros += metros;
      atencao.set(k, a);
    }
    if (t.highway && MOVIMENTADA.test(t.highway) && !temInfraCiclo(t)) {
      analise.viaMovimentadaSemFaixa += metros;
      const tipo = NOMES_VIA[t.highway.replace("_link", "")] ?? "via movimentada";
      const k = `via:${tipo}`;
      const a = atencao.get(k) ?? { nome: `Trecho em ${tipo}`, motivo: "Sem ciclovia ou ciclofaixa", metros: 0, ponto };
      a.metros += metros;
      atencao.set(k, a);
    }
  }
  analise.trechosAtencao = [...atencao.values()].filter((a) => a.metros >= 30).sort((x, y) => y.metros - x.metros);

  const instrucoes: Instrucao[] = (f.properties.voicehints ?? []).map(([indice, cmd, saida, dist, angulo]) => {
    const [texto, seta] = COMANDOS[cmd] ?? (angulo < -20 ? ["Vire à esquerda", "←"] : angulo > 20 ? ["Vire à direita", "→"] : ["Siga em frente", "↑"]);
    return { indice, texto: cmd === 14 || cmd === 15 ? `${texto} e pegue a ${saida}ª saída` : texto, seta, metrosAteProxima: dist };
  });

  return {
    perfil,
    coords,
    metros: Number(f.properties["track-length"]) || distAcumulada[distAcumulada.length - 1]!,
    segundos: Number(f.properties["total-time"]) || 0,
    subida: Number(f.properties["filtered ascend"]) || 0,
    instrucoes,
    analise,
    distAcumulada,
  };
}

/* ---------- Busca de endereços (Photon, da Komoot, sobre dados do OpenStreetMap) ---------- */

export type Lugar = LatLon & { nome: string; detalhe: string };

export async function buscarLugar(q: string, perto: LatLon, sinal?: AbortSignal): Promise<Lugar[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${perto.lat}&lon=${perto.lon}&limit=6`;
  const resp = await fetch(url, { signal: sinal });
  if (!resp.ok) throw new Error("A busca de endereços não respondeu.");
  const json = (await resp.json()) as {
    features: { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }[];
  };
  return json.features.map((f) => {
    const p = f.properties;
    const nome = p.name ?? [p.street, p.housenumber].filter(Boolean).join(", ") ?? "Local";
    const detalhe = [p.name ? p.street : undefined, p.district, p.city, p.state].filter(Boolean).join(" · ");
    return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], nome: nome || "Local sem nome", detalhe };
  });
}
