"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../AppShell";
import Icone from "../Icone";
import Mapa, { type ControleMapa, type Marcador } from "../Mapa";
import PerfilAltitude from "../PerfilAltitude";
import { useAviso } from "../Aviso";
import { buscarLugar, calcularRota, PERFIS, type Lugar, type PerfilRota, type Rota } from "@/lib/rota";
import { carregarRetrato, CATEGORIAS, type Ponto } from "@/lib/osm";
import { distancia, distanciaALinha, formatarDistancia, formatarTempo, PONTO_PADRAO, type LatLon } from "@/lib/geo";
import { pedirGps, useLocalizacao } from "@/lib/localizacao";
import { atualizar, novoId, temPlano, TIPOS_ALERTA, useEstado, type Alerta, type Modo } from "@/lib/estado";
import { co2Evitado, formatarKg } from "@/lib/carbono";

type Lugarzinho = LatLon & { nome: string };
const PERFIL_DO_MODO: Record<Modo, PerfilRota> = { urbano: "safety", lazer: "trekking", estrada: "fastbike" };

/* Velocidade da simulação: 18 km/h acelerado 20 vezes (3 km em cerca de 30 s). */
const SIM_MPS = (18 / 3.6) * 20;

function pontoNaRota(rota: Rota, metros: number): { lat: number; lon: number; indice: number } {
  const d = rota.distAcumulada;
  let i = 0;
  while (i < d.length - 2 && d[i + 1]! < metros) i++;
  const a = rota.coords[i]!, b = rota.coords[Math.min(i + 1, rota.coords.length - 1)]!;
  const seg = (d[i + 1] ?? d[i]!) - d[i]!;
  const t = seg > 0 ? Math.min(1, Math.max(0, (metros - d[i]!) / seg)) : 0;
  return { lat: a[0] + (b[0] - a[0]) * t, lon: a[1] + (b[1] - a[1]) * t, indice: i };
}

export default function RotaTela() {
  const avisar = useAviso();
  const estado = useEstado();
  const { posicao, status } = useLocalizacao();
  const controle = useRef<ControleMapa | null>(null);

  const [origem, setOrigem] = useState<Lugarzinho | null>(null);
  const [destino, setDestino] = useState<Lugarzinho | null>(null);
  const [perfil, setPerfil] = useState<PerfilRota>("safety");
  const [rota, setRota] = useState<Rota | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const pedido = useRef<AbortController | null>(null);

  const [editando, setEditando] = useState<"origem" | "destino" | null>(null);
  const [termo, setTermo] = useState("");
  const [sugestoes, setSugestoes] = useState<Lugar[]>([]);
  const [buscandoLugar, setBuscandoLugar] = useState(false);
  const [recolhido, setRecolhido] = useState(false);

  const [pontosRetrato, setPontosRetrato] = useState<Ponto[]>([]);

  /* Navegação */
  const [nav, setNav] = useState<null | { modo: "gps" | "simulado"; feitos: number; pausado: boolean }>(null);
  const [alertaPop, setAlertaPop] = useState<Alerta | null>(null);
  const avisados = useRef<Set<string>>(new Set());
  const [concluida, setConcluida] = useState<null | { metros: number; simulada: boolean }>(null);
  const [compartilhar, setCompartilhar] = useState(false);

  /* Parâmetros da URL: ?de=lat,lon&deNome=…&para=lat,lon&nome=…&perfil=… */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ll = (s: string | null) => {
      const [a, b] = (s ?? "").split(",").map(Number);
      return a != null && b != null && Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lon: b } : null;
    };
    const de = ll(q.get("de"));
    const para = ll(q.get("para"));
    setOrigem(de ? { ...de, nome: q.get("deNome") ?? "Partida" } : { lat: posicao.lat, lon: posicao.lon, nome: posicao.nome });
    if (para) setDestino({ ...para, nome: q.get("nome") ?? "Destino" });
    const p = q.get("perfil") as PerfilRota | null;
    if (p && p in PERFIS) setPerfil(p);
    else if (estado.perfil) setPerfil(PERFIL_DO_MODO[estado.perfil.modo]);
    if (!para) setEditando("destino");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { carregarRetrato().then((r) => setPontosRetrato(r.pontos)).catch(() => {}); }, []);

  const origemEfetiva: Lugarzinho = origem ?? posicao;

  /* Enquadra a rota na parte do mapa que fica visível acima do painel (que ocupa até 62% da altura). */
  const enquadrarRota = useCallback((r: Rota) => {
    const altura = document.querySelector(".mapa-tela")?.clientHeight ?? 700;
    controle.current?.enquadrar(r.coords.map(([lat, lon]) => ({ lat, lon })), Math.round(altura * 0.62) + 20, 130);
  }, []);

  /* Calcula a rota sempre que origem, destino ou perfil mudam. */
  const calcular = useCallback(async () => {
    if (!destino) return;
    pedido.current?.abort();
    const ctrl = new AbortController();
    pedido.current = ctrl;
    setCarregando(true);
    setErro("");
    try {
      const r = await calcularRota(origemEfetiva, destino, perfil, ctrl.signal);
      setRota(r);
      setRecolhido(false);
      enquadrarRota(r);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setRota(null);
      setErro(e instanceof TypeError ? "Sem conexão com o serviço de rotas (BRouter). Tente de novo." : (e as Error).message);
    } finally {
      if (pedido.current === ctrl) { setCarregando(false); pedido.current = null; }
    }
  }, [origemEfetiva.lat, origemEfetiva.lon, destino, perfil]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!nav) calcular(); }, [calcular]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => pedido.current?.abort(), []);

  /* Busca de endereço com espera curta entre teclas. */
  useEffect(() => {
    if (!editando || termo.trim().length < 3) { setSugestoes([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBuscandoLugar(true);
      try { setSugestoes(await buscarLugar(termo.trim(), origemEfetiva, ctrl.signal)); }
      catch (e) { if ((e as Error).name !== "AbortError") setSugestoes([]); }
      finally { setBuscandoLugar(false); }
    }, 450);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [termo, editando]); // eslint-disable-line react-hooks/exhaustive-deps

  function escolher(l: Lugarzinho) {
    if (editando === "origem") setOrigem(l); else setDestino(l);
    setEditando(null);
    setTermo("");
    setSugestoes([]);
  }

  async function usarGps() {
    try {
      const p = await pedirGps();
      setOrigem({ ...p, nome: "Minha localização" });
      setEditando(null);
      setTermo("");
    } catch (e) {
      avisar((e as Error).message);
    }
  }

  /* ---------- Análises que dependem da rota ---------- */
  const linha = useMemo(() => (rota ? rota.coords.map(([lat, lon]) => ({ lat, lon })) : []), [rota]);

  const alertasNoCaminho = useMemo(() => {
    if (!rota) return [];
    return estado.alertas
      .filter((a) => !a.resolvido)
      .map((a) => ({ a, ...distanciaALinha(a, linha) }))
      .filter((x) => x.metros <= 60)
      .sort((x, y) => x.indice - y.indice);
  }, [rota, linha, estado.alertas]);

  const apoioNoCaminho = useMemo(() => {
    if (!rota) return [];
    return pontosRetrato
      .filter((p) => p.categoria === "estacionamento" || p.categoria === "oficina" || p.categoria === "agua" || p.categoria === "banheiro")
      .map((p) => ({ p, ...distanciaALinha(p, linha) }))
      .filter((x) => x.metros <= 120)
      .sort((x, y) => x.indice - y.indice);
  }, [rota, linha, pontosRetrato]);

  /* ---------- Navegação ---------- */
  const feitos = nav?.feitos ?? 0;
  const total = rota ? rota.distAcumulada[rota.distAcumulada.length - 1]! : 0;
  const posNav = useMemo(() => (rota && nav ? pontoNaRota(rota, feitos) : null), [rota, nav, feitos]);
  const proxima = useMemo(() => {
    if (!rota || !posNav) return null;
    const ins = rota.instrucoes.find((i) => i.indice > posNav.indice);
    if (!ins) return { texto: "Chegando ao destino", seta: "⚑", metros: Math.max(0, total - feitos) };
    return { texto: ins.texto, seta: ins.seta, metros: Math.max(0, (rota.distAcumulada[ins.indice] ?? 0) - feitos) };
  }, [rota, posNav, feitos, total]);

  /* Simulação: avança ao longo da rota com requestAnimationFrame. */
  useEffect(() => {
    if (!nav || nav.modo !== "simulado" || nav.pausado || !rota) return;
    let ultimo = performance.now();
    let raf = 0;
    const passo = (agora: number) => {
      const dt = (agora - ultimo) / 1000;
      ultimo = agora;
      setNav((n) => (n ? { ...n, feitos: Math.min(total, n.feitos + dt * SIM_MPS) } : n));
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [nav?.modo, nav?.pausado, rota, total]); // eslint-disable-line react-hooks/exhaustive-deps

  /* GPS: projeta a posição real na rota. */
  const foraDaRota = useMemo(() => {
    if (!nav || nav.modo !== "gps" || !rota) return false;
    return distanciaALinha(posicao, linha).metros > 60;
  }, [nav, rota, posicao, linha]);
  useEffect(() => {
    if (!nav || nav.modo !== "gps" || !rota || !posicao.real) return;
    const { indice, metros } = distanciaALinha(posicao, linha);
    if (metros > 60) return;
    const d = rota.distAcumulada[indice] ?? 0;
    setNav((n) => (n && d > n.feitos ? { ...n, feitos: d } : n));
  }, [posicao, nav?.modo, rota, linha]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Câmera segue o ciclista a cada ~1,2 s. */
  const ultimaCamera = useRef(0);
  useEffect(() => {
    if (!posNav) return;
    const agora = Date.now();
    if (agora - ultimaCamera.current < 1200) return;
    ultimaCamera.current = agora;
    controle.current?.irPara(posNav, 17);
  }, [posNav]);

  /* Aviso de alerta da comunidade a 150 m (plano Básico ou acima). */
  useEffect(() => {
    if (!nav || !rota || !temPlano(estado.perfil, "basico")) return;
    for (const { a, indice } of alertasNoCaminho) {
      const faltam = (rota.distAcumulada[indice] ?? 0) - feitos;
      if (faltam > 0 && faltam < 150 && !avisados.current.has(a.id)) {
        avisados.current.add(a.id);
        setAlertaPop(a);
        setTimeout(() => setAlertaPop((x) => (x?.id === a.id ? null : x)), 6000);
      }
    }
  }, [feitos, nav, rota, alertasNoCaminho, estado.perfil]);

  /* Chegada. */
  useEffect(() => {
    if (!nav || !rota) return;
    const chegou = nav.modo === "simulado" ? feitos >= total - 0.5 : total - feitos < 30 || (posicao.real && destino && distancia(posicao, destino) < 30);
    if (!chegou) return;
    const simulada = nav.modo === "simulado";
    setNav(null);
    setAlertaPop(null);
    setConcluida({ metros: rota.metros, simulada });
    atualizar((s) => ({
      ...s,
      pedaladas: [{ id: novoId(), data: new Date().toISOString(), metros: Math.round(rota.metros), subida: rota.subida, destino: destino?.nome ?? "Destino", simulada }, ...s.pedaladas],
    }));
  }, [feitos, nav, rota, posicao, destino, total]);

  async function iniciarGps() {
    try {
      await pedirGps();
      avisados.current.clear();
      setNav({ modo: "gps", feitos: 0, pausado: false });
    } catch (e) {
      avisar(`${(e as Error).message} Use "Simular percurso" para ver a navegação.`);
    }
  }
  function simular() {
    avisados.current.clear();
    setNav({ modo: "simulado", feitos: 0, pausado: false });
  }

  const marcadores: Marcador[] = useMemo(() => {
    const m: Marcador[] = [];
    if (!nav) {
      m.push({ id: "a", tipo: "a", ...origemEfetiva });
    }
    if (destino) m.push({ id: "b", tipo: "b", ...destino });
    if (posNav) m.push({ id: "ciclista", tipo: "ciclista", lat: posNav.lat, lon: posNav.lon });
    else if (posicao.real && !nav) m.push({ id: "eu", tipo: "eu", ...posicao });
    return m;
  }, [origemEfetiva, destino, posNav, posicao, nav]);

  const pct = (m: number) => (rota && rota.metros ? Math.round((m / rota.metros) * 100) : 0);
  const pCiclo = rota ? pct(rota.analise.emCiclovia) : 0;
  const pMov = rota ? pct(rota.analise.viaMovimentadaSemFaixa) : 0;
  const pOutros = Math.max(0, 100 - pCiclo - pMov);
  const premium = temPlano(estado.perfil, "premium");
  const basico = temPlano(estado.perfil, "basico");

  return (
    <AppShell cheio>
      <h1 className="sr">Traçar rota de bicicleta</h1>
      <div className="mapa-tela">
        <Mapa
          centro={origemEfetiva}
          zoom={15}
          rotulo="Mapa da rota"
          rota={rota?.coords ?? null}
          rotaFeita={posNav?.indice}
          alertas={alertasNoCaminho.map((x) => x.a)}
          marcadores={marcadores}
          aoPronto={(c) => { controle.current = c; if (rota) enquadrarRota(rota); }}
        />

        {nav && proxima && (
          <div className="navegando" role="status" aria-live="polite">
            <span className="seta" aria-hidden>{proxima.seta}</span>
            <div style={{ flex: 1 }}>
              <b>{formatarDistancia(proxima.metros)}</b>
              <span>{proxima.texto}</span>
            </div>
            <span className="selo" style={{ background: "rgba(0,0,0,.25)", color: "#fff", borderColor: "transparent" }}>
              {nav.modo === "simulado" ? "Simulação 20×" : "GPS"}
            </span>
          </div>
        )}
        {alertaPop && (
          <div className="alerta-pop" role="alert">
            <span className="emoji" aria-hidden>{TIPOS_ALERTA[alertaPop.tipo].emoji}</span>
            <div><b>{TIPOS_ALERTA[alertaPop.tipo].rotulo} à frente</b><br /><span className="pequeno">{alertaPop.texto}</span></div>
          </div>
        )}

        {!nav && (
          <div className="mapa-sobre">
            <div className="barra-busca">
              <Link className="botao-redondo" href="/mapa/" aria-label="Voltar ao mapa"><Icone nome="voltar" /></Link>
              <div className="pontas" style={{ flex: 1 }}>
                {(["origem", "destino"] as const).map((qual) => {
                  const valor = qual === "origem" ? origemEfetiva : destino;
                  const ed = editando === qual;
                  return (
                    <div key={qual} className="ponta" style={{ background: "rgba(13,22,34,.96)" }}>
                      <span className="letra" style={{ background: qual === "origem" ? "#2fd18c" : "#ff2a55" }} aria-hidden>{qual === "origem" ? "A" : "B"}</span>
                      {ed ? (
                        <input
                          autoFocus value={termo} onChange={(e) => setTermo(e.target.value)}
                          placeholder={qual === "origem" ? "Partida: rua, lugar…" : "Para onde? Rua, parque, lugar…"}
                          aria-label={qual === "origem" ? "Buscar ponto de partida" : "Buscar destino"}
                          onKeyDown={(e) => { if (e.key === "Escape") { setEditando(null); setTermo(""); } }}
                        />
                      ) : (
                        <button type="button" className="texto" style={{ background: "none", border: 0, textAlign: "left", padding: 0 }} onClick={() => { setEditando(qual); setTermo(""); }}>
                          {valor ? valor.nome : <span className="muted">Para onde?</span>}
                        </button>
                      )}
                      {ed && buscandoLugar && <span className="girando" />}
                      {ed && (
                        <button type="button" className="link" style={{ padding: "0 6px" }} onClick={() => { setEditando(null); setTermo(""); }}>Cancelar</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {editando && (
              <div className="sugestoes">
                {editando === "origem" && (
                  <>
                    <button type="button" onClick={usarGps}><b>{status === "pedindo" ? "Obtendo localização…" : "Minha localização (GPS)"}</b><small>Usa o GPS do aparelho</small></button>
                    <button type="button" onClick={() => escolher({ ...PONTO_PADRAO })}><b>MASP, Av. Paulista</b><small>Ponto de exemplo do protótipo</small></button>
                  </>
                )}
                {sugestoes.map((s, i) => (
                  <button key={`${s.lat},${s.lon},${i}`} type="button" onClick={() => escolher(s)}>
                    <b>{s.nome}</b>
                    <small>{s.detalhe}</small>
                  </button>
                ))}
                {termo.trim().length >= 3 && !buscandoLugar && sugestoes.length === 0 && (
                  <div className="vazio pequeno" style={{ padding: 14 }}>Nada encontrado para “{termo}”.</div>
                )}
                {termo.trim().length < 3 && editando === "destino" && (
                  <div className="pequeno muted" style={{ padding: "10px 14px" }}>Digite pelo menos 3 letras. Ex.: “Parque Ibirapuera”, “Rua Augusta”.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Painel inferior */}
        {!editando && (destino || erro) && (
          <section className={`painel-rota${recolhido || nav ? " recolhido" : ""}`} aria-label="Detalhes da rota">
            <button type="button" className="alca" style={{ border: 0, background: "var(--linha)", width: 44, height: 5, borderRadius: 5, justifySelf: "center", padding: 0 }}
              aria-label={recolhido ? "Expandir detalhes" : "Recolher detalhes"} onClick={() => setRecolhido((v) => !v)} />

            {nav ? (
              <>
                <div className="metricas">
                  <div className="metrica"><small>Faltam</small><b>{formatarDistancia(Math.max(0, total - feitos))}</b></div>
                  <div className="metrica"><small>Pedalados</small><b>{formatarDistancia(feitos)}</b></div>
                  <div className="metrica"><small>CO₂ evitado</small><b>{formatarKg(co2Evitado(feitos, estado.fatorCarro))}</b></div>
                </div>
                {foraDaRota && (
                  <div className="aviso atencao"><Icone nome="alerta" /><span style={{ flex: 1 }}>Você saiu da rota.</span>
                    <button className="link" onClick={() => { setNav(null); setOrigem({ ...posicao, nome: "Minha localização" }); }}>Recalcular</button>
                  </div>
                )}
                {nav.modo === "gps" && !posicao.real && <div className="aviso atencao"><Icone nome="alerta" />Aguardando sinal do GPS…</div>}
                <div style={{ display: "grid", gridTemplateColumns: nav.modo === "simulado" ? "1fr 1fr" : "1fr", gap: 8 }}>
                  {nav.modo === "simulado" && (
                    <button className="botao fantasma" onClick={() => setNav((n) => (n ? { ...n, pausado: !n.pausado } : n))}>
                      <Icone nome={nav.pausado ? "play" : "pausa"} />{nav.pausado ? "Continuar" : "Pausar"}
                    </button>
                  )}
                  <button className="botao perigo" onClick={() => { setNav(null); setAlertaPop(null); }}>Encerrar</button>
                </div>
              </>
            ) : (
              <>
                <div className="perfis" role="group" aria-label="Tipo de rota">
                  {(Object.keys(PERFIS) as PerfilRota[]).map((p) => (
                    <button key={p} type="button" className="perfil-btn" aria-pressed={perfil === p} onClick={() => setPerfil(p)} title={PERFIS[p].descricao}>
                      <b>{PERFIS[p].rotulo}</b>
                      {estado.perfil && PERFIL_DO_MODO[estado.perfil.modo] === p && premium && <small>Seu jeito de pedalar</small>}
                    </button>
                  ))}
                </div>

                {carregando && <div className="carregando"><span className="girando" />Calculando a rota de bicicleta…</div>}
                {erro && !carregando && (
                  <div className="aviso erro"><Icone nome="alerta" /><span style={{ flex: 1 }}>{erro}</span><button className="link" onClick={calcular}>Tentar de novo</button></div>
                )}

                {rota && !carregando && (
                  <>
                    <div className="metricas">
                      <div className="metrica"><small>Distância</small><b>{formatarDistancia(rota.metros)}</b></div>
                      <div className="metrica"><small>Tempo</small><b>{formatarTempo(rota.segundos)}</b></div>
                      <div className="metrica"><small>Subida</small><b>{rota.subida} m</b></div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button className="botao" onClick={iniciarGps}><Icone nome="play" />Iniciar</button>
                      <button className="botao secundario" onClick={simular}>Simular percurso</button>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <div className="secao-topo"><h2 style={{ fontSize: 15 }}>Segurança do trajeto</h2><span className="pequeno muted">{PERFIS[perfil].rotulo}</span></div>
                      <div className="barra-seguranca" role="img" aria-label={`${pCiclo}% em ciclovia ou ciclofaixa, ${pMov}% em avenida sem ciclofaixa, ${pOutros}% em ruas comuns`}>
                        <span style={{ width: `${pCiclo}%`, background: "#2fd18c" }} />
                        <span style={{ width: `${pOutros}%`, background: "#6f86ff" }} />
                        <span style={{ width: `${pMov}%`, background: "#ff2a55" }} />
                      </div>
                      <div className="legenda">
                        <span><i style={{ background: "#2fd18c" }} />{pCiclo}% ciclovia ou ciclofaixa</span>
                        <span><i style={{ background: "#6f86ff" }} />{pOutros}% ruas comuns</span>
                        <span><i style={{ background: "#ff2a55" }} />{pMov}% avenida sem faixa</span>
                      </div>
                      {rota.analise.trechosAtencao.slice(0, 3).map((t) => (
                        <div key={t.nome + t.motivo} className="aviso atencao"><Icone nome="alerta" /><span><b>{t.nome}</b> · {formatarDistancia(t.metros)}. {t.motivo}.</span></div>
                      ))}
                      {perfil !== "safety" && pMov > 10 && (
                        <button className="link pequeno" style={{ justifySelf: "start" }} onClick={() => setPerfil("safety")}>Ver a opção “Mais segura” →</button>
                      )}
                    </div>

                    {alertasNoCaminho.length > 0 && (
                      <div style={{ display: "grid", gap: 6 }}>
                        <h2 style={{ fontSize: 15 }}>Alertas da comunidade no caminho</h2>
                        {alertasNoCaminho.map(({ a }) => (
                          <div key={a.id} className="aviso atencao"><span aria-hidden>{TIPOS_ALERTA[a.tipo].emoji}</span><span><b>{TIPOS_ALERTA[a.tipo].rotulo}.</b> {a.texto}</span></div>
                        ))}
                        {!basico && <p className="pequeno muted">No plano Básico você recebe esses avisos durante o trajeto.</p>}
                      </div>
                    )}

                    <div style={{ display: "grid", gap: 6 }}>
                      <h2 style={{ fontSize: 15 }}>Altitude</h2>
                      {premium ? (
                        <PerfilAltitude coords={rota.coords} dist={rota.distAcumulada} />
                      ) : (
                        <div className="bloqueio"><span><Icone nome="cadeado" tamanho={16} /> Rotas com relevo fazem parte do Premium.</span><Link className="botao secundario pequeno" href="/perfil/#planos">Ver planos</Link></div>
                      )}
                    </div>

                    {apoioNoCaminho.length > 0 && (
                      <div style={{ display: "grid", gap: 4 }}>
                        <h2 style={{ fontSize: 15 }}>Pontos de apoio no caminho</h2>
                        <div className="cartao" style={{ padding: "2px 12px" }}>
                          {apoioNoCaminho.slice(0, 6).map(({ p, indice }) => (
                            <Link key={p.id} className="item-lista" href={`/mapa/?ponto=${encodeURIComponent(p.id)}`}>
                              <span className="marca" style={{ background: CATEGORIAS[p.categoria].cor, width: 32, height: 32 }} aria-hidden>{CATEGORIAS[p.categoria].letra}</span>
                              <span className="corpo"><b style={{ fontSize: 13.5 }}>{p.nome}</b><small>no km {((rota.distAcumulada[indice] ?? 0) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</small></span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {rota.instrucoes.length > 0 && (
                      <details>
                        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 15 }}>Curva a curva ({rota.instrucoes.length})</summary>
                        <ol className="instrucoes">
                          {rota.instrucoes.map((i, k) => (
                            <li key={k}><span className="seta" aria-hidden>{i.seta}</span><span style={{ flex: 1 }}>{i.texto}</span><span className="pequeno muted">{formatarDistancia(i.metrosAteProxima)}</span></li>
                          ))}
                        </ol>
                      </details>
                    )}

                    <button className="botao fantasma" onClick={() => setCompartilhar(true)}><Icone nome="compartilhar" />Compartilhar com a comunidade</button>
                    <p className="pequeno muted">Rota calculada pelo BRouter com dados do OpenStreetMap. Confira a sinalização: o mapa pode estar desatualizado.</p>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {concluida && (
          <div className="dialogo-fundo">
            <div className="dialogo" role="dialog" aria-modal="true" aria-labelledby="fim-titulo">
              <h2 id="fim-titulo">🎉 Pedal concluído!</h2>
              <div className="metricas">
                <div className="metrica"><small>Distância</small><b>{formatarDistancia(concluida.metros)}</b></div>
                <div className="metrica"><small>CO₂ evitado</small><b>{formatarKg(co2Evitado(concluida.metros, estado.fatorCarro))}</b></div>
                <div className="metrica"><small>Subida</small><b>{rota?.subida ?? 0} m</b></div>
              </div>
              <p className="pequeno muted">
                {concluida.simulada ? "Percurso simulado, registrado como simulação no seu histórico." : "Registrado no seu histórico."} O CO₂ é o que um carro médio emitiria no mesmo trajeto.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button className="botao fantasma" onClick={() => setConcluida(null)}>Fechar</button>
                <button className="botao" onClick={() => { setConcluida(null); setCompartilhar(true); }}>Compartilhar rota</button>
              </div>
              <Link href="/perfil/" className="link" style={{ justifySelf: "center" }}>Ver minha pegada</Link>
            </div>
          </div>
        )}

        {compartilhar && rota && destino && (
          <DialogoCompartilhar
            sugestao={`${origemEfetiva.nome.replace(/\s*\(exemplo\)/, "")} até ${destino.nome}`}
            aoFechar={() => setCompartilhar(false)}
            aoSalvar={(nome, dica) => {
              atualizar((s) => ({
                ...s,
                rotas: [{
                  id: novoId(), nome, dica, autor: s.perfil?.nome ?? "Você",
                  de: { lat: origemEfetiva.lat, lon: origemEfetiva.lon, nome: origemEfetiva.nome.replace(/\s*\(exemplo\)/, "") },
                  para: { ...destino }, perfil, metros: Math.round(rota.metros), subida: rota.subida, curtidas: 0, data: new Date().toISOString(),
                }, ...s.rotas],
              }));
              setCompartilhar(false);
              avisar("Rota compartilhada na comunidade.");
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

function DialogoCompartilhar({ sugestao, aoFechar, aoSalvar }: { sugestao: string; aoFechar: () => void; aoSalvar: (nome: string, dica: string) => void }) {
  const [nome, setNome] = useState(sugestao.slice(0, 60));
  const [dica, setDica] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aoFechar]);
  return (
    <div className="dialogo-fundo" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <form
        className="dialogo" role="dialog" aria-modal="true" aria-labelledby="comp-titulo"
        onSubmit={(e) => { e.preventDefault(); if (nome.trim().length < 3) { setErro("Dê um nome com pelo menos 3 letras."); return; } aoSalvar(nome.trim(), dica.trim()); }}
      >
        <h2 id="comp-titulo">Compartilhar rota</h2>
        <div className="campo">
          <label htmlFor="comp-nome">Nome da rota</label>
          <input id="comp-nome" value={nome} maxLength={60} onChange={(e) => { setNome(e.target.value); setErro(""); }} aria-invalid={!!erro} />
          {erro && <span className="erro-campo">{erro}</span>}
        </div>
        <div className="campo">
          <label htmlFor="comp-dica">Dica para quem for pedalar</label>
          <textarea id="comp-dica" value={dica} maxLength={280} onChange={(e) => setDica(e.target.value)} placeholder="Ex.: evite o horário de pico, tem subida forte no fim" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
          <button type="button" className="botao fantasma" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="botao">Publicar</button>
        </div>
      </form>
    </div>
  );
}
