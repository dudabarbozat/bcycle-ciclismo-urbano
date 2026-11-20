"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../AppShell";
import Icone from "../Icone";
import { carregarRetrato, CATEGORIAS, type Ponto } from "@/lib/osm";
import { dentroDoRetrato, distancia, formatarDistancia, formatarTempo, tempoPedalando } from "@/lib/geo";
import { useLocalizacao } from "@/lib/localizacao";
import { temPlano, TIPOS_ALERTA, useEstado } from "@/lib/estado";
import { co2Evitado, formatarKg } from "@/lib/carbono";

const ICONE_CAT: Record<Ponto["categoria"], string> = {
  estacionamento: "cadeado", oficina: "chave", compartilhada: "bike", banheiro: "info", agua: "gota", ar: "mais",
};

export default function Inicio() {
  const estado = useEstado();
  const { posicao } = useLocalizacao();
  const [pontos, setPontos] = useState<Ponto[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    carregarRetrato().then((r) => setPontos(r.pontos)).catch(() => setErro(true));
  }, []);

  /* Os mais próximos de cada tipo, na ordem de prioridade do pitch: estacionar, consertar, alugar, beber água. */
  const perto = useMemo(() => {
    if (!pontos) return [];
    const cotas: [Ponto["categoria"], number][] = [["estacionamento", 3], ["oficina", 2], ["compartilhada", 1], ["agua", 1]];
    return cotas.flatMap(([cat, n]) =>
      pontos
        .filter((p) => p.categoria === cat)
        .map((p) => ({ p, d: distancia(posicao, p) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, n),
    );
  }, [pontos, posicao]);

  const nome = estado.perfil?.nome ?? "";
  const semana = useMemo(() => {
    const limite = Date.now() - 7 * 86400000;
    const ps = estado.pedaladas.filter((p) => new Date(p.data).getTime() >= limite);
    const m = ps.reduce((s, p) => s + p.metros, 0);
    return { n: ps.length, metros: m, co2: co2Evitado(m, estado.fatorCarro) };
  }, [estado.pedaladas, estado.fatorCarro]);

  const alertasAtivos = estado.alertas.filter((a) => !a.resolvido && distancia(posicao, a) < 5000);
  const foraDaArea = !dentroDoRetrato(posicao);

  return (
    <AppShell>
      <div className="tela">
        <div className="ola">
          <div>
            <div className="avatar" aria-hidden>{nome.slice(0, 1).toUpperCase() || "B"}</div>
            <h1>Olá{nome ? ` ${nome}` : ""},</h1>
            <p>Onde vamos pedalar hoje?</p>
          </div>
          <Link className="acao-busca" href="/rota/" aria-label="Buscar destino e traçar rota"><Icone nome="busca" /></Link>
        </div>

        <div className="acoes-principais">
          <Link className="acao-grande" href="/mapa/?apoio=1">Encontrar pontos de apoio <Icone nome="seta" /></Link>
          <Link className="acao-grande" href="/mapa/">Abrir mapa <Icone nome="mapa" /></Link>
          <Link className="acao-grande emergencia" href="/emergencia/">Emergência <Icone nome="telefone" /></Link>
        </div>

        <section className="secao" aria-labelledby="perto-titulo">
          <div className="secao-topo">
            <h2 id="perto-titulo">Perto de você</h2>
            <Link href="/mapa/?apoio=1">Navegar no mapa</Link>
          </div>
          <p className="pequeno muted" style={{ marginTop: -6 }}>
            {posicao.real ? "A partir da sua localização." : `A partir de ${posicao.nome}.`}
          </p>
          {erro && <div className="aviso erro"><Icone nome="alerta" />Não foi possível carregar os pontos. Verifique a conexão e recarregue.</div>}
          {!pontos && !erro && <div className="carregando"><span className="girando" />Carregando pontos de apoio…</div>}
          {pontos && foraDaArea && (
            <div className="aviso"><Icone nome="info" />Você está fora da região gravada no protótipo (Av. Paulista). No mapa, toque em “Buscar nesta área” para carregar os pontos ao seu redor.</div>
          )}
          {pontos && !foraDaArea && (
            <div className="carrossel">
              {perto.map(({ p, d }) => {
                const cat = CATEGORIAS[p.categoria];
                return (
                  <Link key={p.id} className="cartao-ponto" href={`/mapa/?ponto=${encodeURIComponent(p.id)}`} style={{ background: cat.cor }}>
                    <div className="arte"><Icone nome={ICONE_CAT[p.categoria]} tamanho={34} /></div>
                    <div className="info">
                      <small>{cat.rotulo}</small>
                      <b>{p.nome}</b>
                      <small>{formatarDistancia(d)} · {formatarTempo(tempoPedalando(d * 1.3))} pedalando</small>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="secao cartao" aria-labelledby="pegada-titulo">
          <div className="secao-topo">
            <h2 id="pegada-titulo">Sua semana</h2>
            <Link href="/perfil/">Ver pegada</Link>
          </div>
          {temPlano(estado.perfil, "basico") ? (
            <div className="resumo-pegada">
              <div className="numero"><b>{semana.n}</b><small>pedaladas</small></div>
              <div className="numero"><b>{formatarDistancia(semana.metros).replace(" ", " ")}</b><small>pedalados</small></div>
              <div className="numero"><b>{formatarKg(semana.co2)}</b><small>de CO₂ que um carro emitiria</small></div>
            </div>
          ) : (
            <p className="pequeno muted">Km pedalados e pegada de carbono fazem parte do plano Básico.</p>
          )}
          {semana.n === 0 && temPlano(estado.perfil, "basico") && (
            <p className="pequeno muted">Ainda sem pedaladas. Trace uma rota e toque em “Iniciar” ou “Simular percurso”.</p>
          )}
        </section>

        <section className="secao" aria-labelledby="alertas-titulo">
          <div className="secao-topo">
            <h2 id="alertas-titulo">Alertas na região</h2>
            <Link href="/comunidade/?aba=alertas">Ver todos</Link>
          </div>
          {alertasAtivos.length === 0 ? (
            <p className="pequeno muted">Nenhum alerta ativo num raio de 5 km.</p>
          ) : (
            <div className="cartao" style={{ padding: "4px 14px" }}>
              {alertasAtivos.slice(0, 3).map((a) => (
                <Link key={a.id} className="item-lista" href={`/mapa/?alerta=${a.id}`}>
                  <span className="marca" style={{ background: "#ffc93d", fontSize: 18 }} aria-hidden>{TIPOS_ALERTA[a.tipo].emoji}</span>
                  <span className="corpo">
                    <b>{TIPOS_ALERTA[a.tipo].rotulo}</b>
                    <small>{formatarDistancia(distancia(posicao, a))} · {a.confirmacoes} confirmaram</small>
                  </span>
                  <Icone nome="seta" tamanho={18} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="pequeno muted" style={{ textAlign: "center" }}>
          Protótipo de portfólio · <Link href="/sobre/" className="link">sobre o projeto</Link>
        </p>
      </div>
    </AppShell>
  );
}
