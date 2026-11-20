"use client";

import Icone from "./Icone";
import { useAviso } from "./Aviso";
import { distancia, formatarDistancia, type LatLon } from "@/lib/geo";
import { atualizar, TIPOS_ALERTA, type Alerta } from "@/lib/estado";

export function quandoFoi(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

export default function FolhaAlerta({ alerta, origem, aoFechar }: { alerta: Alerta; origem: LatLon; aoFechar: () => void }) {
  const avisar = useAviso();
  const t = TIPOS_ALERTA[alerta.tipo];

  function confirmar() {
    atualizar((s) => ({ ...s, alertas: s.alertas.map((a) => (a.id === alerta.id ? { ...a, confirmacoes: a.confirmacoes + 1, resolvido: false } : a)) }));
    avisar("Obrigado! O alerta continua ativo para outros ciclistas.");
  }
  function resolver() {
    atualizar((s) => ({ ...s, alertas: s.alertas.map((a) => (a.id === alerta.id ? { ...a, resolvido: true } : a)) }));
    avisar("Marcado como resolvido.");
  }

  return (
    <div className="folha" role="dialog" aria-labelledby="alerta-titulo" style={{ background: "#c89a1a" }}>
      <div className="alca" />
      <div className="folha-cab">
        <span style={{ fontSize: 30 }} aria-hidden>{t.emoji}</span>
        <div style={{ display: "grid", gap: 2 }}>
          <h2 id="alerta-titulo">{t.rotulo}</h2>
          <span className="pequeno">{formatarDistancia(distancia(origem, alerta))} daqui · {quandoFoi(alerta.data)}</span>
        </div>
        <button className="fechar" onClick={aoFechar} aria-label="Fechar"><Icone nome="x" tamanho={18} /></button>
      </div>
      <div className="folha-corpo">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {alerta.resolvido ? <span className="selo verde">Resolvido</span> : <span className="selo amarelo">Ativo</span>}
          <span className="selo">{alerta.confirmacoes} {alerta.confirmacoes === 1 ? "confirmação" : "confirmações"}</span>
          {alerta.exemplo && <span className="selo">Exemplo</span>}
        </div>
        <p>{alerta.texto || "Sem descrição."}</p>
        <p className="pequeno muted">Reportado por {alerta.autor}.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button className="botao fantasma" onClick={confirmar}>Ainda está lá</button>
          <button className="botao secundario" onClick={resolver} disabled={alerta.resolvido}>Já foi resolvido</button>
        </div>
      </div>
    </div>
  );
}
