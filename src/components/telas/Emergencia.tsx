"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../AppShell";
import Icone from "../Icone";
import { useAviso } from "../Aviso";
import { carregarRetrato, CATEGORIAS, type Ponto } from "@/lib/osm";
import { distancia, formatarDistancia, linkMapa } from "@/lib/geo";
import { pedirGps, useLocalizacao } from "@/lib/localizacao";
import { useEstado } from "@/lib/estado";

export default function Emergencia() {
  const avisar = useAviso();
  const estado = useEstado();
  const { posicao, status } = useLocalizacao();
  const [pontos, setPontos] = useState<Ponto[]>([]);
  useEffect(() => { carregarRetrato().then((r) => setPontos(r.pontos)).catch(() => {}); }, []);

  const oficinas = useMemo(
    () => pontos.filter((p) => p.categoria === "oficina").map((p) => ({ p, d: distancia(posicao, p) })).sort((a, b) => a.d - b.d).slice(0, 3),
    [pontos, posicao],
  );

  async function enviarLocalizacao() {
    let pos = posicao;
    if (!pos.real) {
      try { pos = await pedirGps(); } catch { avisar("Sem GPS: vou enviar o ponto de exemplo."); }
    }
    const url = linkMapa(pos);
    const texto = `Preciso de ajuda. Estou de bicicleta aqui: ${url}`;
    try {
      if (navigator.share) await navigator.share({ title: "Minha localização", text: texto, url });
      else { await navigator.clipboard.writeText(texto); avisar("Mensagem com sua localização copiada."); }
    } catch { /* cancelado */ }
  }

  const bike = estado.bike;
  const temBike = bike.marca || bike.modelo || bike.serie;
  const textoBike = [
    bike.marca && `Marca: ${bike.marca}`, bike.modelo && `Modelo: ${bike.modelo}`, bike.cor && `Cor: ${bike.cor}`,
    bike.serie && `Nº de série: ${bike.serie}`, bike.obs && `Detalhes: ${bike.obs}`,
  ].filter(Boolean).join("\n");

  return (
    <AppShell>
      <div className="tela">
        <div className="topo">
          <Link className="voltar" href="/" aria-label="Voltar ao início"><Icone nome="voltar" tamanho={20} /></Link>
          <h1>Emergência</h1>
        </div>

        <section className="secao" aria-labelledby="ligar-t">
          <h2 id="ligar-t" className="sr">Ligar</h2>
          <div className="ligar">
            <a href="tel:192"><b>192</b><small>SAMU<br />acidente, ferimento</small></a>
            <a href="tel:190"><b>190</b><small>Polícia<br />roubo, agressão</small></a>
            <a href="tel:193"><b>193</b><small>Bombeiros<br />resgate</small></a>
          </div>
          <button className="botao perigo largo" onClick={enviarLocalizacao}>
            <Icone nome="compartilhar" />{status === "pedindo" ? "Obtendo localização…" : "Enviar minha localização"}
          </button>
          <p className="pequeno muted">Abre o compartilhamento do celular com um link do mapa. Sem GPS, usa o ponto de exemplo.</p>
        </section>

        <section className="secao cartao" aria-labelledby="roubo-t">
          <h2 id="roubo-t" style={{ fontSize: 17 }}>Minha bike foi roubada</h2>
          <ol className="passos">
            <li><b>Fique em segurança.</b> Não reaja e não persiga ninguém.</li>
            <li><b>Ligue 190</b> se o roubo acabou de acontecer.</li>
            <li><b>Registre o boletim de ocorrência</b> na delegacia ou pela delegacia eletrônica do seu estado, com marca, modelo, cor e número de série.</li>
            <li><b>Avise a comunidade</b> com um alerta de roubo no mapa, para outros ciclistas ficarem atentos ao local.</li>
            <li><b>Acione o seguro</b>, se tiver, com o número do boletim.</li>
          </ol>
          {temBike ? (
            <div className="cartao" style={{ background: "var(--fundo-2)", display: "grid", gap: 8 }}>
              <b className="pequeno">Dados da sua bike para o boletim</b>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13.5 }} className="muted">{textoBike}</pre>
              <button className="botao fantasma pequeno" onClick={() => navigator.clipboard?.writeText(textoBike).then(() => avisar("Dados da bike copiados.")).catch(() => {})}>Copiar dados</button>
            </div>
          ) : (
            <Link className="botao secundario" href="/perfil/">Cadastrar os dados da minha bike</Link>
          )}
          <Link className="botao fantasma" href="/mapa/"><Icone nome="alerta" />Reportar no mapa</Link>
        </section>

        <section className="secao" aria-labelledby="oficina-t">
          <h2 id="oficina-t" style={{ fontSize: 17 }}>Pneu furou ou quebrou algo?</h2>
          {oficinas.length === 0 ? (
            <p className="pequeno muted">Sem oficinas na região carregada. Procure no mapa com “Buscar nesta área”.</p>
          ) : (
            <div className="cartao" style={{ padding: "2px 14px" }}>
              {oficinas.map(({ p, d }) => (
                <Link key={p.id} className="item-lista" href={`/mapa/?ponto=${encodeURIComponent(p.id)}`}>
                  <span className="marca" style={{ background: CATEGORIAS.oficina.cor }} aria-hidden>{CATEGORIAS.oficina.letra}</span>
                  <span className="corpo"><b>{p.nome}</b><small>{formatarDistancia(d)}{p.tags.phone ? ` · ${p.tags.phone}` : ""}</small></span>
                  <Icone nome="seta" tamanho={18} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
