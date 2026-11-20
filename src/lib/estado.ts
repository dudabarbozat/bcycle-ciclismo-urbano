"use client";

import { useSyncExternalStore } from "react";
import type { LatLon } from "./geo";
import type { PerfilRota } from "./rota";
import { ALERTAS_EXEMPLO, ROTAS_EXEMPLO } from "./comunidade";

/* Estado do protótipo, salvo no localStorage deste navegador. Não há servidor. */

export type Plano = "freemium" | "basico" | "premium";
export type Modo = "urbano" | "lazer" | "estrada";

export type Perfil = { nome: string; modo: Modo; plano: Plano; criadoEm: string };

export type Pedalada = { id: string; data: string; metros: number; subida: number; destino: string; simulada: boolean };

export type Avaliacao = { id: string; pontoId: string; pontoNome: string; nota: number; texto: string; autor: string; data: string };

export type TipoAlerta = "buraco" | "obra" | "arvore" | "alagamento" | "escuro" | "roubo";
export const TIPOS_ALERTA: Record<TipoAlerta, { rotulo: string; emoji: string }> = {
  buraco: { rotulo: "Buraco na via", emoji: "🕳️" },
  obra: { rotulo: "Obra no caminho", emoji: "🚧" },
  arvore: { rotulo: "Árvore caída", emoji: "🌳" },
  alagamento: { rotulo: "Alagamento", emoji: "🌊" },
  escuro: { rotulo: "Trecho sem iluminação", emoji: "🌑" },
  roubo: { rotulo: "Relato de roubo", emoji: "⚠️" },
};

export type Alerta = LatLon & {
  id: string;
  tipo: TipoAlerta;
  texto: string;
  autor: string;
  data: string;
  confirmacoes: number;
  resolvido: boolean;
  exemplo?: boolean;
};

export type RotaCompartilhada = {
  id: string;
  nome: string;
  dica: string;
  autor: string;
  de: LatLon & { nome: string };
  para: LatLon & { nome: string };
  perfil: PerfilRota;
  metros: number;
  subida: number;
  curtidas: number;
  data: string;
  exemplo?: boolean;
};

export type Bike = { marca: string; modelo: string; cor: string; serie: string; obs: string };

export type Estado = {
  versao: 1;
  perfil: Perfil | null;
  pedaladas: Pedalada[];
  avaliacoes: Avaliacao[];
  alertas: Alerta[];
  rotas: RotaCompartilhada[];
  curtidas: string[];
  bike: Bike;
  fatorCarro: "medio" | "gasolina";
};

const CHAVE = "bcycle:estado:v1";

function inicial(): Estado {
  return {
    versao: 1,
    perfil: null,
    pedaladas: [],
    avaliacoes: [],
    alertas: ALERTAS_EXEMPLO.map((a) => ({ ...a })),
    rotas: ROTAS_EXEMPLO.map((r) => ({ ...r })),
    curtidas: [],
    bike: { marca: "", modelo: "", cor: "", serie: "", obs: "" },
    fatorCarro: "medio",
  };
}

let atual: Estado | null = null;
const ouvintes = new Set<() => void>();

function ler(): Estado {
  if (atual) return atual;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const e = JSON.parse(bruto) as Estado;
      if (e.versao === 1) { atual = { ...inicial(), ...e }; return atual; }
    }
  } catch { /* armazenamento indisponível: segue com o inicial */ }
  atual = inicial();
  return atual;
}

function gravar(e: Estado) {
  atual = e;
  try { localStorage.setItem(CHAVE, JSON.stringify(e)); } catch { /* ignora */ }
  ouvintes.forEach((f) => f());
}

export function atualizar(f: (e: Estado) => Estado) {
  gravar(f(ler()));
}

export function restaurarExemplo() {
  const p = ler().perfil;
  gravar({ ...inicial(), perfil: p });
}

export function apagarTudo() {
  try { localStorage.removeItem(CHAVE); } catch { /* ignora */ }
  atual = null;
  gravar(inicial());
}

const SERVIDOR = inicial();
export function useEstado(): Estado {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      const aoMudarOutraAba = (ev: StorageEvent) => { if (ev.key === CHAVE) { atual = null; f(); } };
      window.addEventListener("storage", aoMudarOutraAba);
      return () => { ouvintes.delete(f); window.removeEventListener("storage", aoMudarOutraAba); };
    },
    ler,
    () => SERVIDOR,
  );
}

/* Hidratação: no servidor (exportação estática) o estado é o inicial; só depois de montar sabemos o real. */
export function useMontado(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

export const novoId = () => Math.random().toString(36).slice(2, 10);

/* ---------- Planos (do pitch) ---------- */

export const PLANOS: Record<Plano, { nome: string; preco: string; itens: string[] }> = {
  freemium: {
    nome: "Freemium",
    preco: "Gratuito",
    itens: ["Mapa com ciclovias e pontos de apoio", "Rotas para bicicleta", "Comunidade e avaliações"],
  },
  basico: {
    nome: "Básico",
    preco: "a partir de R$ 5,40/mês",
    itens: ["Tudo do Freemium", "Km pedalados por dia e pegada de carbono", "Avisos de alertas da comunidade na sua rota"],
  },
  premium: {
    nome: "Premium",
    preco: "valor sob consulta",
    itens: ["Tudo do Básico", "Rotas com relevo (perfil de altitude)", "Rota personalizada pelo seu jeito de pedalar", "Mapa offline (fora deste protótipo)"],
  },
};

const NIVEL: Record<Plano, number> = { freemium: 0, basico: 1, premium: 2 };
export function temPlano(perfil: Perfil | null, minimo: Plano): boolean {
  return NIVEL[perfil?.plano ?? "premium"] >= NIVEL[minimo];
}
