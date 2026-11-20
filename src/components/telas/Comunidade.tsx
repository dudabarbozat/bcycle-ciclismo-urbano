"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../AppShell";
import Icone from "../Icone";
import { useAviso } from "../Aviso";
import { quandoFoi } from "../FolhaAlerta";
import { distancia, formatarDistancia } from "@/lib/geo";
import { useLocalizacao } from "@/lib/localizacao";
import { PERFIS } from "@/lib/rota";
import { atualizar, TIPOS_ALERTA, useEstado, type RotaCompartilhada } from "@/lib/estado";

type Aba = "rotas" | "alertas" | "avaliacoes";

function linkRota(r: RotaCompartilhada) {
  const q = new URLSearchParams({
    de: `${r.de.lat},${r.de.lon}`, deNome: r.de.nome,
    para: `${r.para.lat},${r.para.lon}`, nome: r.para.nome, perfil: r.perfil,
  });
  return `/rota/?${q.toString()}`;
}

export default function Comunidade() {
  const estado = useEstado();
  const avisar = useAviso();
  const { posicao } = useLocalizacao();
  const [aba, setAba] = useState<Aba>("rotas");

  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("aba");
    if (a === "alertas" || a === "avaliacoes") setAba(a);
  }, []);

  function curtir(id: string) {
    const ja = estado.curtidas.includes(id);
    atualizar((s) => ({
      ...s,
      curtidas: ja ? s.curtidas.filter((c) => c !== id) : [...s.curtidas, id],
      rotas: s.rotas.map((r) => (r.id === id ? { ...r, curtidas: r.curtidas + (ja ? -1 : 1) } : r)),
    }));
  }

  async function compartilharFora(r: RotaCompartilhada) {
    const url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/comunidade\/?$/, "rota/");
    url.search = linkRota(r).split("?")[1] ?? "";
    const dados = { title: `BCYCLE · ${r.nome}`, text: r.dica || r.nome, url: url.toString() };
    try {
      if (navigator.share) await navigator.share(dados);
      else { await navigator.clipboard.writeText(dados.url); avisar("Link da rota copiado."); }
    } catch { /* compartilhamento cancelado */ }
  }

  const alertas = [...estado.alertas].sort((a, b) => Number(a.resolvido) - Number(b.resolvido) || +new Date(b.data) - +new Date(a.data));

  return (
    <AppShell>
      <div className="tela">
        <div className="topo"><h1>Comunidade</h1></div>
        <p className="muted" style={{ marginTop: -12 }}>Rotas favoritas, alertas na via e avaliações de quem pedala pela região.</p>

        <div className="abas" role="tablist" aria-label="Seções da comunidade">
          {([["rotas", "Rotas"], ["alertas", "Alertas"], ["avaliacoes", "Avaliações"]] as [Aba, string][]).map(([id, r]) => (
            <button key={id} role="tab" id={`aba-${id}`} aria-selected={aba === id} aria-controls={`painel-${id}`} onClick={() => setAba(id)}>{r}</button>
          ))}
        </div>

        {aba === "rotas" && (
          <div role="tabpanel" id="painel-rotas" aria-labelledby="aba-rotas" className="secao">
            {estado.rotas.length === 0 && <div className="vazio">Nenhuma rota compartilhada ainda.</div>}
            {estado.rotas.map((r) => {
              const curtiu = estado.curtidas.includes(r.id);
              return (
                <article key={r.id} className="cartao" style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ fontSize: 16 }}>{r.nome}</h2>
                      <p className="pequeno muted">{r.autor} · {quandoFoi(r.data)}{r.exemplo ? " · exemplo" : ""}</p>
                    </div>
                    <span className="selo azul">{PERFIS[r.perfil].rotulo}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 13.5 }} className="muted">
                    <span><Icone nome="rota" tamanho={15} /> {formatarDistancia(r.metros)}</span>
                    <span><Icone nome="montanha" tamanho={15} /> {r.subida} m de subida</span>
                    <span>{formatarDistancia(distancia(posicao, r.de))} até a partida</span>
                  </div>
                  {r.dica && <p style={{ fontSize: 14 }}>“{r.dica}”</p>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link className="botao pequeno" href={linkRota(r)}>Ver rota</Link>
                    <button className="botao fantasma pequeno" aria-pressed={curtiu} onClick={() => curtir(r.id)} aria-label={`${curtiu ? "Descurtir" : "Curtir"} (${r.curtidas})`}>
                      <span style={{ color: curtiu ? "#ff5c7c" : undefined, display: "inline-flex" }}><Icone nome="coracao" tamanho={17} /></span>{r.curtidas}
                    </button>
                    <button className="botao fantasma pequeno" onClick={() => compartilharFora(r)} aria-label="Enviar link da rota"><Icone nome="compartilhar" tamanho={17} /></button>
                  </div>
                </article>
              );
            })}
            <p className="pequeno muted">Para compartilhar uma rota sua, trace o caminho e toque em “Compartilhar com a comunidade”.</p>
          </div>
        )}

        {aba === "alertas" && (
          <div role="tabpanel" id="painel-alertas" aria-labelledby="aba-alertas" className="secao">
            <Link className="botao secundario" href="/mapa/"><Icone nome="alerta" />Reportar um alerta no mapa</Link>
            {alertas.map((a) => (
              <Link key={a.id} className="cartao" href={`/mapa/?alerta=${a.id}`} style={{ display: "flex", gap: 12, textDecoration: "none", opacity: a.resolvido ? 0.6 : 1 }}>
                <span style={{ fontSize: 26 }} aria-hidden>{TIPOS_ALERTA[a.tipo].emoji}</span>
                <span style={{ display: "grid", gap: 4, flex: 1 }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <b>{TIPOS_ALERTA[a.tipo].rotulo}</b>
                    {a.resolvido ? <span className="selo verde">Resolvido</span> : <span className="selo amarelo">Ativo</span>}
                  </span>
                  {a.texto && <span className="pequeno">{a.texto}</span>}
                  <span className="pequeno muted">{formatarDistancia(distancia(posicao, a))} · {a.autor} · {quandoFoi(a.data)} · {a.confirmacoes} confirmaram</span>
                </span>
              </Link>
            ))}
          </div>
        )}

        {aba === "avaliacoes" && (
          <div role="tabpanel" id="painel-avaliacoes" aria-labelledby="aba-avaliacoes" className="secao">
            {estado.avaliacoes.length === 0 ? (
              <div className="vazio">
                <Icone nome="estrela" tamanho={32} />
                <p>Nenhuma avaliação ainda. Abra um bicicletário ou oficina no mapa e conte como foi.</p>
                <Link className="botao pequeno" href="/mapa/?apoio=1">Abrir pontos de apoio</Link>
              </div>
            ) : (
              estado.avaliacoes.map((a) => (
                <Link key={a.id} href={`/mapa/?ponto=${encodeURIComponent(a.pontoId)}`} className="cartao" style={{ display: "grid", gap: 4, textDecoration: "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <b>{a.pontoNome}</b>
                    <span className="estrelas" aria-label={`${a.nota} de 5`}>{"★".repeat(a.nota)}<span style={{ color: "var(--texto-3)" }}>{"★".repeat(5 - a.nota)}</span></span>
                  </div>
                  {a.texto && <p className="pequeno">{a.texto}</p>}
                  <span className="pequeno muted">{a.autor} · {quandoFoi(a.data)}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
