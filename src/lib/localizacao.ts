"use client";

import { useSyncExternalStore } from "react";
import { PONTO_PADRAO, type LatLon } from "./geo";

/* Posição do ciclista. Começa no ponto de exemplo (Centro de Curitiba) e só usa o GPS quando a pessoa pede. */

export type Posicao = LatLon & { nome: string; real: boolean; precisao?: number };
export type StatusGps = "exemplo" | "pedindo" | "ativo" | "negado" | "indisponivel";

type Estado = { posicao: Posicao; status: StatusGps };

const EXEMPLO: Posicao = { ...PONTO_PADRAO, real: false };
let estado: Estado = { posicao: EXEMPLO, status: "exemplo" };
const ouvintes = new Set<() => void>();
const definir = (e: Estado) => { estado = e; ouvintes.forEach((f) => f()); };

let vigia: number | null = null;

export function pedirGps(): Promise<Posicao> {
  return new Promise((ok, falha) => {
    if (!("geolocation" in navigator)) {
      definir({ ...estado, status: "indisponivel" });
      falha(new Error("Este navegador não oferece localização."));
      return;
    }
    definir({ ...estado, status: "pedindo" });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos: Posicao = { lat: p.coords.latitude, lon: p.coords.longitude, nome: "Minha localização", real: true, precisao: p.coords.accuracy };
        definir({ posicao: pos, status: "ativo" });
        if (vigia == null) {
          vigia = navigator.geolocation.watchPosition(
            (q) => definir({ posicao: { lat: q.coords.latitude, lon: q.coords.longitude, nome: "Minha localização", real: true, precisao: q.coords.accuracy }, status: "ativo" }),
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000 },
          );
        }
        ok(pos);
      },
      (e) => {
        definir({ posicao: EXEMPLO, status: e.code === e.PERMISSION_DENIED ? "negado" : "indisponivel" });
        falha(new Error(e.code === e.PERMISSION_DENIED ? "Permissão de localização negada." : "Não foi possível obter a localização."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

export function usarExemplo(lugar: LatLon & { nome: string } = PONTO_PADRAO) {
  if (vigia != null) { navigator.geolocation.clearWatch(vigia); vigia = null; }
  definir({ posicao: { ...lugar, real: false }, status: "exemplo" });
}

const SERVIDOR: Estado = { posicao: EXEMPLO, status: "exemplo" };
export function useLocalizacao(): Estado {
  return useSyncExternalStore(
    (f) => { ouvintes.add(f); return () => ouvintes.delete(f); },
    () => estado,
    () => SERVIDOR,
  );
}
