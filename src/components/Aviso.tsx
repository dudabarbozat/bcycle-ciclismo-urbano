"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* Aviso curto (toast). O provedor fica no layout; a saída é desenhada dentro do app pelo AppShell. */

type Ctx = { avisar: (msg: string) => void; msg: string | null };
const Contexto = createContext<Ctx>({ avisar: () => {}, msg: null });
export const useAviso = () => useContext(Contexto).avisar;

export function AvisoProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avisar = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3500);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <Contexto.Provider value={{ avisar, msg }}>{children}</Contexto.Provider>;
}

export function SaidaAviso() {
  const { msg } = useContext(Contexto);
  return <div role="status" aria-live="polite" className={msg ? "toast" : "sr"}>{msg}</div>;
}
