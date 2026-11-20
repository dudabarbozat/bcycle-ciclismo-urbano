"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../AppShell";
import Icone from "../Icone";
import Mapa, { type ControleMapa, type Marcador } from "../Mapa";
import { useAviso } from "../Aviso";
import FolhaPonto from "../FolhaPonto";
import FolhaAlerta from "../FolhaAlerta";
import DialogoAlerta from "../DialogoAlerta";
import {
  AREA_MAXIMA, areaDo, buscarAoVivo, carregarRetrato, CATEGORIAS, ORDEM_CATEGORIAS, rotuloDataOSM,
  type Categoria, type Ciclovia, type Ponto, type Recorte,
} from "@/lib/osm";
import { dentroDoRetrato, distancia, formatarDistancia, type LatLon } from "@/lib/geo";
import { pedirGps, useLocalizacao } from "@/lib/localizacao";
import { useEstado, type Alerta } from "@/lib/estado";

type Fonte = { tipo: "retrato" | "aovivo"; data: string };

/* Começa pelo que o pitch prioriza: onde deixar a bike e onde consertar. */
const FILTRO_INICIAL: Categoria[] = ["estacionamento", "oficina", "ar"];

export default function MapaTela() {
  const router = useRouter();
  const avisar = useAviso();
  const estado = useEstado();
  const { posicao, status } = useLocalizacao();
  const controle = useRef<ControleMapa | null>(null);

  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [ciclovias, setCiclovias] = useState<Ciclovia[]>([]);
  const [fonte, setFonte] = useState<Fonte | null>(null);
  const [erroDados, setErroDados] = useState("");
  const [buscando, setBuscando] = useState<string | null>(null);
  const cancelarBusca = useRef<AbortController | null>(null);

  const [filtro, setFiltro] = useState<Set<Categoria>>(new Set(FILTRO_INICIAL));
  const [mostrarCiclovias, setMostrarCiclovias] = useState(true);
  const [mostrarAlertas, setMostrarAlertas] = useState(true);

  const [ativo, setAtivo] = useState<Ponto | null>(null);
  const [alertaAtivo, setAlertaAtivo] = useState<Alerta | null>(null);
  const [lista, setLista] = useState(false);
  const [reportando, setReportando] = useState(false);
  const [dialogoAlerta, setDialogoAlerta] = useState<LatLon | null>(null);

  const [vista, setVista] = useState<{ recorte: Recorte; centro: LatLon; zoom: number } | null>(null);
  const [areaCarregada, setAreaCarregada] = useState<Recorte | null>(null);
  const pedidoInicial = useRef<URLSearchParams | null>(null);

  /* Retrato gravado de Curitiba e Almirante Tamandaré. */
  useEffect(() => {
    carregarRetrato()
      .then((r) => {
        setPontos(r.pontos);
        setCiclovias(r.ciclovias);
        setFonte({ tipo: "retrato", data: r.dataOSM });
      })
      .catch(() => setErroDados("Não foi possível carregar os dados do mapa."));
  }, []);

  /* Parâmetros da URL (?ponto=, ?alerta=, ?apoio=1) depois que os dados chegam. */
  useEffect(() => {
    pedidoInicial.current ??= new URLSearchParams(window.location.search);
    const q = pedidoInicial.current;
    if (!fonte || !q || q.size === 0) return;
    const idPonto = q.get("ponto");
    const idAlerta = q.get("alerta");
    if (idPonto) {
      const p = pontos.find((x) => x.id === idPonto);
      if (p) { setAtivo(p); setFiltro((f) => new Set([...f, p.categoria])); controle.current?.irPara(p, 17); }
    } else if (idAlerta) {
      const a = estado.alertas.find((x) => x.id === idAlerta);
      if (a) { setAlertaAtivo(a); controle.current?.irPara(a, 17); }
    } else if (q.get("apoio")) {
      setLista(true);
    }
    pedidoInicial.current = new URLSearchParams();
  }, [fonte, pontos, estado.alertas]);

  const visiveis = useMemo(() => pontos.filter((p) => filtro.has(p.categoria)), [pontos, filtro]);
  const alertasVisiveis = mostrarAlertas ? estado.alertas : [];

  const referencia = vista?.centro ?? posicao;
  const proximos = useMemo(
    () => visiveis.map((p) => ({ p, d: distancia(referencia, p) })).sort((a, b) => a.d - b.d).slice(0, 25),
    [visiveis, referencia],
  );

  const alternar = (c: Categoria) =>
    setFiltro((f) => {
      const n = new Set(f);
      if (n.has(c)) n.delete(c); else n.add(c);
      return n;
    });

  /* "Buscar nesta área" aparece quando a vista sai da região já carregada. */
  const foraDosDados = useMemo(() => {
    if (!vista || !fonte) return false;
    const c = vista.centro;
    if (fonte.tipo === "retrato") return !dentroDoRetrato(c);
    const r = areaCarregada;
    return !r || c.lat < r.sul || c.lat > r.norte || c.lon < r.oeste || c.lon > r.leste;
  }, [vista, fonte, areaCarregada]);

  const buscarArea = useCallback(async () => {
    const r = controle.current?.recorte();
    if (!r) return;
    if (areaDo(r) > AREA_MAXIMA) { avisar("Aproxime o mapa para buscar (área máxima de uns 6 km)."); return; }
    cancelarBusca.current?.abort();
    const ctrl = new AbortController();
    cancelarBusca.current = ctrl;
    setErroDados("");
    setBuscando("Consultando o OpenStreetMap…");
    try {
      const res = await buscarAoVivo(r, (n, t) => setBuscando(`Consultando o OpenStreetMap (servidor ${n} de ${t})…`), ctrl.signal);
      setPontos(res.pontos);
      setCiclovias(res.ciclovias);
      setFonte({ tipo: "aovivo", data: res.dataOSM });
      setAreaCarregada(r);
      setAtivo(null);
      avisar(`${res.pontos.length} pontos e ${res.ciclovias.length} trechos de ciclovia nesta área.`);
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setErroDados("Os servidores públicos do OpenStreetMap não responderam a tempo. Eles costumam ficar sobrecarregados; tente de novo em alguns segundos.");
    } finally {
      if (cancelarBusca.current === ctrl) { cancelarBusca.current = null; setBuscando(null); }
    }
  }, [avisar]);

  useEffect(() => () => cancelarBusca.current?.abort(), []);

  async function localizar() {
    try {
      const p = await pedirGps();
      controle.current?.irPara(p, 16);
    } catch (e) {
      avisar((e as Error).message + " Usando o ponto de exemplo.");
      controle.current?.irPara(posicao, 16);
    }
  }

  const marcadores: Marcador[] = useMemo(() => (posicao.real ? [{ id: "eu", tipo: "eu", ...posicao }] : []), [posicao]);

  function abrirPonto(p: Ponto) {
    setAlertaAtivo(null);
    setLista(false);
    setAtivo(p);
  }
  function abrirAlerta(a: Alerta) {
    setAtivo(null);
    setLista(false);
    setAlertaAtivo(a);
  }
  function irRota(p: LatLon & { nome: string }) {
    router.push(`/rota/?para=${p.lat.toFixed(6)},${p.lon.toFixed(6)}&nome=${encodeURIComponent(p.nome)}`);
  }

  const painelAberto = !!ativo || !!alertaAtivo || lista;
  const rotuloFonte =
    fonte?.tipo === "aovivo"
      ? `OpenStreetMap ao vivo · ${rotuloDataOSM(fonte.data)}`
      : fonte
        ? `Curitiba e Tamandaré · OpenStreetMap de ${rotuloDataOSM(fonte.data)}`
        : "Carregando dados…";

  return (
    <AppShell cheio>
      <h1 className="sr">Mapa de ciclovias e pontos de apoio</h1>
      <div className="mapa-tela">
        <Mapa
          centro={posicao}
          zoom={15}
          rotulo="Mapa com ciclovias, pontos de apoio e alertas"
          ciclovias={mostrarCiclovias ? ciclovias : []}
          pontos={visiveis}
          pontoAtivo={ativo?.id}
          alertas={alertasVisiveis}
          marcadores={marcadores}
          aoClicarPonto={abrirPonto}
          aoClicarAlerta={abrirAlerta}
          aoMover={(recorte, centro, zoom) => setVista({ recorte, centro, zoom })}
          aoPronto={(c) => { controle.current = c; }}
        />

        {reportando && (
          <svg className="mira" viewBox="0 0 34 34" aria-hidden>
            <circle cx="17" cy="17" r="11" fill="none" stroke="#ffc93d" strokeWidth="3" />
            <path d="M17 0v10M17 24v10M0 17h10M24 17h10" stroke="#ffc93d" strokeWidth="3" />
          </svg>
        )}

        <div className="mapa-sobre">
          <div className="barra-busca">
            <Link className="campo-busca" href="/rota/"><Icone nome="busca" tamanho={20} />Para onde vamos pedalar?</Link>
            <button type="button" className="botao-redondo" aria-label="Lista de pontos de apoio" aria-pressed={lista} onClick={() => { setAtivo(null); setAlertaAtivo(null); setLista((v) => !v); }}>
              <Icone nome="camadas" />
            </button>
          </div>
          <div className="chips" role="group" aria-label="Filtrar pontos de apoio">
            {ORDEM_CATEGORIAS.map((c) => (
              <button
                key={c} type="button" className="chip" aria-pressed={filtro.has(c)}
                onClick={() => alternar(c)}
              >
                <span className="bolinha" style={{ background: CATEGORIAS[c].cor }} />
                {CATEGORIAS[c].plural}
              </button>
            ))}
            <button type="button" className="chip" aria-pressed={mostrarCiclovias} onClick={() => setMostrarCiclovias((v) => !v)}>
              <span className="bolinha" style={{ background: "#3d7bff", borderRadius: 2, height: 4 }} />Ciclovias
            </button>
            <button type="button" className="chip" aria-pressed={mostrarAlertas} onClick={() => setMostrarAlertas((v) => !v)}>⚠️ Alertas</button>
          </div>
          {!painelAberto && (
            <div className="status-mapa" role="status">
              {buscando ? <><span className="girando" />{buscando}</> : rotuloFonte}
            </div>
          )}
          {erroDados && !painelAberto && (
            <div className="aviso erro"><Icone nome="alerta" /><span style={{ flex: 1 }}>{erroDados}</span><button className="link" onClick={() => setErroDados("")}>Fechar</button></div>
          )}
        </div>

        {!painelAberto && (
          <div className="mapa-lado" style={{ bottom: `calc(var(--nav) + ${foraDosDados || reportando ? 76 : 16}px)` }}>
            <button
              type="button" className="botao-redondo" aria-pressed={reportando}
              aria-label={reportando ? "Cancelar alerta" : "Reportar alerta na via"}
              title="Reportar alerta na via" onClick={() => setReportando((v) => !v)}
            >
              <Icone nome="alerta" />
            </button>
            <button type="button" className="botao-redondo" aria-label="Ir para minha localização" title="Minha localização" onClick={localizar}>
              {status === "pedindo" ? <span className="girando" /> : <Icone nome="alvo" />}
            </button>
          </div>
        )}

        {!painelAberto && (reportando || foraDosDados) && (
          <div className="mapa-rodape" style={{ bottom: "calc(var(--nav) + 14px)" }}>
            {reportando ? (
              <button type="button" className="botao largo" onClick={() => { const c = controle.current?.centro(); if (c) setDialogoAlerta(c); }}>
                Reportar alerta na mira
              </button>
            ) : buscando ? (
              <button type="button" className="botao fantasma largo" onClick={() => cancelarBusca.current?.abort()}>Cancelar busca</button>
            ) : (
              <button type="button" className="botao largo" onClick={buscarArea}><Icone nome="busca" />Buscar nesta área</button>
            )}
          </div>
        )}

        {lista && (
          <div className="folha" role="dialog" aria-label="Pontos de apoio próximos">
            <div className="alca" />
            <div className="folha-cab">
              <div>
                <h2>Pontos de apoio</h2>
                <p className="pequeno" style={{ opacity: 0.85 }}>Mais perto do centro do mapa · {visiveis.length} no total</p>
              </div>
              <button className="fechar" onClick={() => setLista(false)} aria-label="Fechar lista"><Icone nome="x" tamanho={18} /></button>
            </div>
            <div className="folha-corpo" style={{ padding: "4px 14px" }}>
              {proximos.length === 0 && <div className="vazio">{filtro.size === 0 ? "Escolha ao menos um tipo de ponto nos filtros." : "Nenhum ponto com esses filtros nesta área."}</div>}
              {proximos.map(({ p, d }) => (
                <button key={p.id} className="item-lista" onClick={() => { abrirPonto(p); controle.current?.irPara(p, 17); }}>
                  <span className="marca" style={{ background: CATEGORIAS[p.categoria].cor }} aria-hidden>{CATEGORIAS[p.categoria].letra}</span>
                  <span className="corpo">
                    <b>{p.nome}</b>
                    <small>{CATEGORIAS[p.categoria].rotulo} · {formatarDistancia(d)}</small>
                  </span>
                  <Icone nome="seta" tamanho={18} />
                </button>
              ))}
            </div>
          </div>
        )}

        {ativo && <FolhaPonto ponto={ativo} origem={posicao} aoFechar={() => setAtivo(null)} aoRota={() => irRota(ativo)} />}
        {alertaAtivo && (
          <FolhaAlerta
            alerta={estado.alertas.find((a) => a.id === alertaAtivo.id) ?? alertaAtivo}
            origem={posicao}
            aoFechar={() => setAlertaAtivo(null)}
          />
        )}
        {dialogoAlerta && (
          <DialogoAlerta
            ponto={dialogoAlerta}
            aoFechar={(salvo) => { setDialogoAlerta(null); if (salvo) { setReportando(false); setMostrarAlertas(true); } }}
          />
        )}
      </div>
    </AppShell>
  );
}
