"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "../AppShell";
import Icone from "../Icone";
import { useAviso } from "../Aviso";
import { formatarDistancia } from "@/lib/geo";
import { co2Evitado, FATORES, FONTE_FATOR, formatarKg } from "@/lib/carbono";
import { apagarTudo, atualizar, PLANOS, restaurarExemplo, temPlano, useEstado, useMontado, type Modo, type Plano } from "@/lib/estado";

const MODOS: Record<Modo, string> = { urbano: "Dia a dia", lazer: "Lazer", estrada: "Treino" };
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default function PerfilTela() {
  const estado = useEstado();
  const avisar = useAviso();
  const p = estado.perfil;
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const montado = useMontado();

  const totais = useMemo(() => {
    const m = estado.pedaladas.reduce((s, x) => s + x.metros, 0);
    return { metros: m, n: estado.pedaladas.length, co2: co2Evitado(m, estado.fatorCarro), subida: estado.pedaladas.reduce((s, x) => s + x.subida, 0) };
  }, [estado.pedaladas, estado.fatorCarro]);

  /* Km por dia nos últimos 7 dias. */
  const semana = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(hoje.getTime() - (6 - i) * 86400000);
      const fim = dia.getTime() + 86400000;
      const metros = estado.pedaladas.filter((x) => { const t = new Date(x.data).getTime(); return t >= dia.getTime() && t < fim; }).reduce((s, x) => s + x.metros, 0);
      return { rotulo: i === 6 ? "hoje" : DIAS[dia.getDay()]!, metros };
    });
  }, [estado.pedaladas]);
  const maxDia = Math.max(1000, ...semana.map((d) => d.metros));

  const mudar = (campo: Partial<NonNullable<typeof p>>) => atualizar((s) => (s.perfil ? { ...s, perfil: { ...s.perfil, ...campo } } : s));
  const basico = temPlano(p, "basico");

  return (
    <AppShell>
      <div className="tela">
        <div className="topo">
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 22 }} aria-hidden>{p?.nome.slice(0, 1).toUpperCase() ?? "B"}</div>
          <div style={{ flex: 1 }}>
            <h1>{p?.nome ?? "Perfil"}</h1>
            <p className="pequeno muted">{p ? `${MODOS[p.modo]} · plano ${PLANOS[p.plano].nome}` : ""}</p>
          </div>
          <Link className="botao perigo pequeno" href="/emergencia/"><Icone nome="telefone" tamanho={16} />SOS</Link>
        </div>

        <section className="secao cartao" aria-labelledby="pegada-t">
          <div className="secao-topo"><h2 id="pegada-t">Pegada de carbono</h2>{!basico && <span className="selo"><Icone nome="cadeado" tamanho={12} />Básico</span>}</div>
          {basico ? (
            <>
              <div className="resumo-pegada">
                <div className="numero"><b>{totais.n}</b><small>pedaladas</small></div>
                <div className="numero"><b>{formatarDistancia(totais.metros).replace(" ", " ")}</b><small>no total</small></div>
                <div className="numero"><b style={{ color: "#8ff0c4" }}>{formatarKg(totais.co2)}</b><small>de CO₂ evitado</small></div>
              </div>
              <div className="grafico-barras" role="img" aria-label={`Km por dia na última semana: ${semana.map((d) => `${d.rotulo} ${(d.metros / 1000).toFixed(1)} km`).join(", ")}`}>
                {semana.map((d) => (
                  <div key={d.rotulo} className="barra">
                    <span className="valor">{d.metros ? (d.metros / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : ""}</span>
                    <div className="trilho"><div style={{ height: `${(d.metros / maxDia) * 100}%` }} /></div>
                    <span className="dia">{d.rotulo}</span>
                  </div>
                ))}
              </div>
              <div className="campo">
                <label htmlFor="fator">Comparar com</label>
                <select id="fator" value={estado.fatorCarro} onChange={(e) => atualizar((s) => ({ ...s, fatorCarro: e.target.value as "medio" | "gasolina" }))}>
                  {(Object.keys(FATORES) as (keyof typeof FATORES)[]).map((k) => (
                    <option key={k} value={k}>{FATORES[k].rotulo} ({FATORES[k].kgPorKm.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg/km)</option>
                  ))}
                </select>
              </div>
              <details className="pequeno muted">
                <summary style={{ cursor: "pointer" }}>Como calculamos</summary>
                <p style={{ marginTop: 6 }}>
                  CO₂ evitado = km pedalados × emissão de um carro por km. O fator vem da tabela oficial de 2025 do governo do Reino Unido
                  (DESNZ, “Average car”, emissão direta). É uma referência: o Brasil não publica um fator equivalente por km, e cada carro emite diferente.{" "}
                  <a href={FONTE_FATOR} target="_blank" rel="noreferrer">Fonte ↗</a>
                </p>
              </details>
            </>
          ) : (
            <div className="bloqueio">Km pedalados por dia e pegada de carbono fazem parte do plano Básico (a partir de R$ 5,40/mês).
              <button className="botao secundario pequeno" onClick={() => mudar({ plano: "basico" })}>Ativar Básico na demonstração</button>
            </div>
          )}
        </section>

        {estado.pedaladas.length > 0 && (
          <section className="secao" aria-labelledby="hist-t">
            <h2 id="hist-t" style={{ fontSize: 17 }}>Histórico</h2>
            <div className="cartao" style={{ padding: "2px 14px" }}>
              {estado.pedaladas.slice(0, 8).map((x) => (
                <div key={x.id} className="item-lista">
                  <span className="marca" style={{ background: "var(--azul-2)", color: "#fff" }}><Icone nome="bike" tamanho={20} /></span>
                  <span className="corpo">
                    <b>{x.destino}</b>
                    <small>{new Date(x.data).toLocaleDateString("pt-BR")} · {formatarDistancia(x.metros)} · {formatarKg(co2Evitado(x.metros, estado.fatorCarro))} CO₂{x.simulada ? " · simulada" : ""}</small>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="secao" id="planos" aria-labelledby="planos-t">
          <h2 id="planos-t" style={{ fontSize: 17 }}>Plano</h2>
          <div className="planos">
            {(Object.keys(PLANOS) as Plano[]).map((k) => (
              <button key={k} type="button" className="plano" aria-pressed={p?.plano === k} onClick={() => { mudar({ plano: k }); avisar(`Plano ${PLANOS[k].nome} ativado na demonstração.`); }}>
                <span className="cab"><b>{PLANOS[k].nome}</b><span className="pequeno muted">{PLANOS[k].preco}</span></span>
                <ul>{PLANOS[k].itens.map((i) => <li key={i}>{i}</li>)}</ul>
              </button>
            ))}
          </div>
          <p className="pequeno muted">Planos do modelo de negócio do pitch. No protótipo não há cobrança: trocar de plano só libera ou bloqueia funções.</p>
        </section>

        <section className="secao" aria-labelledby="modo-t">
          <h2 id="modo-t" style={{ fontSize: 17 }}>Como você pedala</h2>
          <div className="opcoes">
            {(Object.keys(MODOS) as Modo[]).map((m) => (
              <button key={m} type="button" className="opcao" aria-pressed={p?.modo === m} onClick={() => mudar({ modo: m })}>{MODOS[m]}</button>
            ))}
          </div>
          <p className="pequeno muted">Dia a dia sugere a rota mais segura; lazer, a equilibrada; treino, a mais rápida.</p>
        </section>

        <MinhaBike key={montado ? "local" : "inicial"} />

        <section className="secao" aria-labelledby="dados-t">
          <h2 id="dados-t" style={{ fontSize: 17 }}>Dados deste navegador</h2>
          <p className="pequeno muted">Perfil, pedaladas, avaliações e alertas ficam só no armazenamento local do navegador. Nada é enviado para servidor.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button className="botao fantasma pequeno" onClick={() => { restaurarExemplo(); avisar("Comunidade de exemplo restaurada."); }}>Restaurar exemplos</button>
            {confirmarApagar ? (
              <button className="botao perigo pequeno" onClick={() => { apagarTudo(); setConfirmarApagar(false); }}>Confirmar: apagar</button>
            ) : (
              <button className="botao fantasma pequeno" onClick={() => setConfirmarApagar(true)}>Apagar tudo</button>
            )}
          </div>
          <Link className="link" href="/sobre/">Sobre o projeto e créditos</Link>
        </section>
      </div>
    </AppShell>
  );
}

function MinhaBike() {
  const estado = useEstado();
  const avisar = useAviso();
  const [b, setB] = useState(estado.bike);
  const campos: [keyof typeof b, string, string][] = [
    ["marca", "Marca", "Ex.: Caloi"],
    ["modelo", "Modelo", "Ex.: Explorer"],
    ["cor", "Cor", "Ex.: Azul e preta"],
    ["serie", "Número de série (quadro)", "Fica embaixo do movimento central"],
  ];
  return (
    <section className="secao cartao" aria-labelledby="bike-t">
      <div className="secao-topo"><h2 id="bike-t">Minha bike</h2><Icone nome="escudo" tamanho={20} /></div>
      <p className="pequeno muted">Guarde os dados da sua bicicleta. Em caso de roubo, eles entram no boletim de ocorrência e ajudam a reconhecê-la.</p>
      <form style={{ display: "grid", gap: 10 }} onSubmit={(e) => { e.preventDefault(); atualizar((s) => ({ ...s, bike: b })); avisar("Dados da bike salvos."); }}>
        {campos.map(([k, rot, ph]) => (
          <div className="campo" key={k}>
            <label htmlFor={`bike-${k}`}>{rot}</label>
            <input id={`bike-${k}`} value={b[k]} maxLength={60} placeholder={ph} onChange={(e) => setB({ ...b, [k]: e.target.value })} />
          </div>
        ))}
        <div className="campo">
          <label htmlFor="bike-obs">Marcas e acessórios</label>
          <textarea id="bike-obs" value={b.obs} maxLength={280} placeholder="Adesivos, arranhões, farol, garupa…" onChange={(e) => setB({ ...b, obs: e.target.value })} />
        </div>
        <button className="botao secundario" type="submit">Salvar dados da bike</button>
      </form>
    </section>
  );
}
