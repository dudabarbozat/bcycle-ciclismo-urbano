"use client";

import { useEffect, useRef, useState } from "react";
import { useAviso } from "./Aviso";
import type { LatLon } from "@/lib/geo";
import { atualizar, novoId, TIPOS_ALERTA, type TipoAlerta } from "@/lib/estado";

export default function DialogoAlerta({ ponto, aoFechar }: { ponto: LatLon; aoFechar: (salvo: boolean) => void }) {
  const avisar = useAviso();
  const [tipo, setTipo] = useState<TipoAlerta | null>(null);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const primeiro = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primeiro.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aoFechar]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo) { setErro("Escolha o tipo de alerta."); return; }
    atualizar((s) => ({
      ...s,
      alertas: [
        { id: novoId(), tipo, lat: ponto.lat, lon: ponto.lon, texto: texto.trim().slice(0, 280), autor: s.perfil?.nome ?? "Você", data: new Date().toISOString(), confirmacoes: 1, resolvido: false },
        ...s.alertas,
      ],
    }));
    avisar("Alerta publicado. Ciclistas com rota por aqui serão avisados.");
    aoFechar(true);
  }

  return (
    <div className="dialogo-fundo" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(false); }}>
      <form className="dialogo" role="dialog" aria-modal="true" aria-labelledby="dlg-alerta" onSubmit={salvar}>
        <h2 id="dlg-alerta">O que tem no caminho?</h2>
        <div className="opcoes" role="radiogroup" aria-label="Tipo de alerta">
          {(Object.keys(TIPOS_ALERTA) as TipoAlerta[]).map((t, i) => (
            <button
              key={t} ref={i === 0 ? primeiro : undefined} type="button" role="radio" aria-checked={tipo === t}
              className="opcao" onClick={() => { setTipo(t); setErro(""); }}
            >
              <span style={{ fontSize: 22 }} aria-hidden>{TIPOS_ALERTA[t].emoji}</span>
              {TIPOS_ALERTA[t].rotulo}
            </button>
          ))}
        </div>
        {erro && <span className="erro-campo">{erro}</span>}
        <div className="campo">
          <label htmlFor="dlg-texto">Detalhes (opcional)</label>
          <textarea id="dlg-texto" value={texto} maxLength={280} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: buraco no meio da ciclofaixa, perto do semáforo" />
        </div>
        <p className="pequeno muted">O alerta fica no ponto da mira. Neste protótipo ele é salvo só neste navegador.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
          <button type="button" className="botao fantasma" onClick={() => aoFechar(false)}>Cancelar</button>
          <button type="submit" className="botao">Publicar alerta</button>
        </div>
      </form>
    </div>
  );
}
