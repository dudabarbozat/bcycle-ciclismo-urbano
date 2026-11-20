"use client";

import { useState } from "react";
import Icone from "./Icone";
import { useAviso } from "./Aviso";
import { CATEGORIAS, type Ponto } from "@/lib/osm";
import { distancia, formatarDistancia, formatarTempo, linkMapa, tempoPedalando, type LatLon } from "@/lib/geo";
import { atualizar, novoId, useEstado } from "@/lib/estado";

export default function FolhaPonto({ ponto, origem, aoFechar, aoRota }: { ponto: Ponto; origem: LatLon; aoFechar: () => void; aoRota: () => void }) {
  const estado = useEstado();
  const avisar = useAviso();
  const cat = CATEGORIAS[ponto.categoria];
  const d = distancia(origem, ponto);
  const avaliacoes = estado.avaliacoes.filter((a) => a.pontoId === ponto.id);
  const media = avaliacoes.length ? avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length : 0;

  const extra: [string, string] | null = ponto.tags.capacity
    ? ["Vagas", ponto.tags.capacity]
    : ponto.tags.fee === "no" ? ["Preço", "Grátis"] : ponto.tags.fee === "yes" ? ["Preço", "Pago"] : null;

  const [nota, setNota] = useState(0);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");

  function avaliar(e: React.FormEvent) {
    e.preventDefault();
    if (nota === 0) { setErro("Escolha de 1 a 5 estrelas."); return; }
    atualizar((s) => ({
      ...s,
      avaliacoes: [
        { id: novoId(), pontoId: ponto.id, pontoNome: ponto.nome, nota, texto: texto.trim().slice(0, 280), autor: s.perfil?.nome ?? "Você", data: new Date().toISOString() },
        ...s.avaliacoes,
      ],
    }));
    setNota(0); setTexto(""); setErro("");
    avisar("Avaliação publicada. Obrigado por ajudar outros ciclistas!");
  }

  return (
    <div className="folha" role="dialog" aria-labelledby="folha-titulo">
      <div className="alca" />
      <div className="folha-cab">
        <div style={{ display: "grid", gap: 2 }}>
          <span className="pequeno" style={{ opacity: 0.85 }}>{cat.rotulo}</span>
          <h2 id="folha-titulo">{ponto.nome}</h2>
          {avaliacoes.length > 0 && (
            <span className="pequeno">★ {media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} · {avaliacoes.length} {avaliacoes.length === 1 ? "avaliação" : "avaliações"}</span>
          )}
        </div>
        <button className="fechar" onClick={aoFechar} aria-label="Fechar"><Icone nome="x" tamanho={18} /></button>
      </div>
      <div className="folha-corpo">
        <div className="metricas" style={extra ? undefined : { gridTemplateColumns: "1fr 1fr" }}>
          <div className="metrica"><small>Distância</small><b>{formatarDistancia(d)}</b></div>
          <div className="metrica"><small>Chegada em</small><b>{formatarTempo(tempoPedalando(d * 1.3))}</b></div>
          {extra && <div className="metrica"><small>{extra[0]}</small><b>{extra[1]}</b></div>}
        </div>
        <p className="pequeno muted" style={{ marginTop: -6 }}>Distância em linha reta e tempo estimado a 15 km/h. A rota mostra o caminho real.</p>

        <button className="botao largo" onClick={aoRota}><Icone nome="rota" />Iniciar rota</button>

        {ponto.detalhes.length > 0 ? (
          <dl className="detalhes">
            {ponto.detalhes.map((x) => (
              <div key={x.rotulo} style={{ display: "contents" }}>
                <dt>{x.rotulo}</dt>
                <dd>{x.rotulo === "Site" ? <a href={x.valor.startsWith("http") ? x.valor : `https://${x.valor}`} target="_blank" rel="noreferrer">{x.valor}</a> : x.valor}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="pequeno muted">O OpenStreetMap ainda não tem detalhes deste ponto (vagas, horário, cobertura).</p>
        )}
        <a className="link pequeno" href={linkMapa(ponto)} target="_blank" rel="noreferrer">Ver no OpenStreetMap e sugerir correções ↗</a>

        <section style={{ display: "grid", gap: 10 }} aria-labelledby="aval-titulo">
          <h3 id="aval-titulo" style={{ fontSize: 15 }}>Avaliações da comunidade</h3>
          {avaliacoes.length === 0 && <p className="pequeno muted">Ninguém avaliou este lugar ainda. Seja a primeira pessoa.</p>}
          {avaliacoes.map((a) => (
            <div key={a.id} className="cartao" style={{ padding: 12, display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <b className="pequeno">{a.autor}</b>
                <span className="estrelas pequeno" aria-label={`${a.nota} de 5 estrelas`}>{"★".repeat(a.nota)}<span style={{ color: "var(--texto-3)" }}>{"★".repeat(5 - a.nota)}</span></span>
              </div>
              {a.texto && <p className="pequeno">{a.texto}</p>}
              <small className="muted" style={{ fontSize: 11.5 }}>{new Date(a.data).toLocaleDateString("pt-BR")}</small>
            </div>
          ))}
          <form onSubmit={avaliar} style={{ display: "grid", gap: 10 }}>
            <div className="estrelas" role="radiogroup" aria-label="Sua nota">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={nota === n} aria-label={`${n} estrela${n > 1 ? "s" : ""}`} className={n <= nota ? "on" : ""} onClick={() => { setNota(n); setErro(""); }}>★</button>
              ))}
            </div>
            {erro && <span className="erro-campo">{erro}</span>}
            <div className="campo">
              <label htmlFor="aval-texto">Comentário (opcional)</label>
              <textarea id="aval-texto" value={texto} maxLength={280} onChange={(e) => setTexto(e.target.value)} placeholder="É seguro? Tem vaga? Atendimento bom?" />
            </div>
            <button className="botao secundario" type="submit">Publicar avaliação</button>
          </form>
        </section>
      </div>
    </div>
  );
}
