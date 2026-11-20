"use client";

import Link from "next/link";
import AppShell from "../AppShell";
import Icone from "../Icone";
import { caminho } from "@/lib/base";
import { FONTE_FATOR } from "@/lib/carbono";

const NUMEROS = [
  { n: "13.563", t: "roubos e furtos de bicicletas registrados em boletim no estado de SP em 2020" },
  { n: "40 min", t: "em média, uma bike roubada no estado de SP" },
  { n: "61%", t: "dos ciclistas roubados em 2020 não tinham seguro para a bike" },
  { n: "40%", t: "dos roubos aconteceram com a bike presa por corrente, cabo ou cadeado" },
  { n: "70%", t: "dos roubos aconteceram durante a semana" },
  { n: "95%", t: "dos respondentes usam a bike para ir ao trabalho ou estudar" },
];

const EQUIPE = [
  ["Barbara Calmon", "Negócios e produto"],
  ["Daniel Ederli", "Desenvolvimento back-end"],
  ["Eduarda Barboza", "UX/UI"],
  ["Jhennifer Pimentel", "Marketing"],
  ["Jhulianna Santos", "Desenvolvimento back-end"],
];

export default function Sobre() {
  return (
    <AppShell semCadastro>
      <div className="tela">
        <div className="topo">
          <Link className="voltar" href="/" aria-label="Voltar ao início"><Icone nome="voltar" tamanho={20} /></Link>
          <h1>Sobre o BCYCLE</h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={caminho("/img/logo-branco.png")} alt="BCYCLE" width={1200} height={368} style={{ width: 200, height: "auto", justifySelf: "center" }} />
        <p className="muted">
          Projeto de hackathon do Time 8, reconstruído em 2026 como protótipo navegável. A proposta: juntar num só app rotas mais seguras,
          estacionamento confiável, oficinas no caminho e uma rede de ciclistas que avisa uns aos outros.
        </p>

        <section className="secao" aria-labelledby="hist-t">
          <h2 id="hist-t" style={{ fontSize: 18 }}>A história do Marcelo</h2>
          <div className="historia">
            <p>Marcelo tem <b>32 anos</b> e mora em <b>São Paulo</b>. É <b>garçom</b>, vive ocupado e não tem tempo para pesquisar como proteger a bicicleta de <b>roubo e danos</b>.</p>
            <p>Pedala há mais de dois anos, sempre <b>tranca a bike no estande</b> perto do trabalho, com a <b>melhor trava</b> que achou. Mesmo assim, entrou para as estatísticas: <b>76% dos ciclistas</b> já tiveram a bike roubada ou conhecem alguém que passou por isso.</p>
            <p>Ele queria saber onde há <b>estacionamento seguro</b> perto dele e quais <b>oficinas confiáveis</b> ficam na sua rota, porque não tem tempo para manutenção.</p>
          </div>
          <p className="pequeno muted">Persona do pitch original.</p>
        </section>

        <section className="secao" aria-labelledby="prob-t">
          <h2 id="prob-t" style={{ fontSize: 18 }}>O problema em números</h2>
          <div className="grade-numeros">
            {NUMEROS.map((x) => (
              <div key={x.n + x.t} className="cartao" style={{ padding: 14 }}><b>{x.n}</b><small>{x.t}</small></div>
            ))}
          </div>
          <p className="pequeno muted">
            Números como foram apresentados no pitch, a partir de boletins de ocorrência de 2020 e de pesquisas com ciclistas citadas pelo time.
            O pitch também cita que a alta de roubos aumentou em 200% o interesse por seguro de bike.
          </p>
        </section>

        <section className="secao" aria-labelledby="sol-t">
          <h2 id="sol-t" style={{ fontSize: 18 }}>O que este protótipo faz</h2>
          <ul className="passos">
            <li><b>Mapa com dados reais</b> do OpenStreetMap: ciclovias e ciclofaixas, bicicletários com vagas e cobertura, oficinas, estações de bike compartilhada, banheiros e água.</li>
            <li><b>Rota de bicicleta</b> pelo BRouter, em três perfis (mais segura, equilibrada, mais rápida), com altitude, curva a curva e quanto do caminho tem ciclovia ou passa por avenida sem faixa.</li>
            <li><b>Navegação</b> pelo GPS do celular ou simulada, com aviso quando há alerta da comunidade a 150 m.</li>
            <li><b>Comunidade:</b> rotas favoritas, alertas na via (buraco, obra, árvore caída, roubo) e avaliações dos pontos de apoio.</li>
            <li><b>Pegada de carbono</b> com fator oficial de emissão por km de carro.</li>
            <li><b>Emergência:</b> ligações rápidas, envio de localização e roteiro para quando a bike é roubada.</li>
          </ul>
        </section>

        <section className="secao" aria-labelledby="comp-t">
          <h2 id="comp-t" style={{ fontSize: 18 }}>Diferenciais (comparativo do pitch)</h2>
          <table className="tabela">
            <thead><tr><th scope="col">App</th><th scope="col">Rotas e mapas</th><th scope="col">Rede coletiva</th><th scope="col">Pegada de CO₂</th></tr></thead>
            <tbody>
              <tr><th scope="row">Strava</th><td>✓</td><td>✓</td><td>✗</td></tr>
              <tr><th scope="row">Bikemap</th><td>✓</td><td>✓</td><td>✗</td></tr>
              <tr><th scope="row">BCYCLE</th><td>✓</td><td>✓</td><td>✓</td></tr>
            </tbody>
          </table>
          <p className="pequeno muted">Comparativo feito pelo time na época do hackathon. Os concorrentes podem ter mudado desde então.</p>
        </section>

        <section className="secao" aria-labelledby="road-t">
          <h2 id="road-t" style={{ fontSize: 18 }}>Roadmap do pitch</h2>
          <ol className="etapas">
            <li><span className="num">1</span><div><b>MVP</b><p>App com geolocalização, cadastro de usuários gerando leads qualificados para seguradoras e pontos de interesse por ordem de necessidade.</p></div></li>
            <li><span className="num">2</span><div><b>Comunidade e parceiros</b><p>Comunidade integrada, rotas e fotos das condições reais das vias, pontos de apoio parceiros e contratação de seguro.</p></div></li>
            <li><span className="num">3</span><div><b>Dados e IA</b><p>Nuvem e analytics, inteligência artificial para organizar os dados e chatbot para contratação de seguro por ciclistas e estabelecimentos.</p></div></li>
          </ol>
        </section>

        <section className="secao" aria-labelledby="eq-t">
          <h2 id="eq-t" style={{ fontSize: 18 }}>Time 8</h2>
          <div className="equipe">
            {EQUIPE.map(([n, p]) => <div key={n}><b>{n}</b><span>{p}</span></div>)}
          </div>
        </section>

        <section className="secao cartao" aria-labelledby="real-t">
          <h2 id="real-t" style={{ fontSize: 17 }}>O que é real e o que é simulado</h2>
          <ul className="passos">
            <li><b>Real:</b> ciclovias, pontos de apoio, rotas, altitude, busca de endereços e o fator de emissão.</li>
            <li><b>Retrato gravado:</b> os dados de Curitiba e Almirante Tamandaré vêm de uma consulta ao OpenStreetMap de 20/11/2026. Fora dessa região, o app consulta ao vivo.</li>
            <li><b>Lacuna:</b> em Almirante Tamandaré quase nada está mapeado ainda (nenhuma ciclovia e nenhum bicicletário no OpenStreetMap). A comunidade do app existe justamente para preencher esse vazio.</li>
            <li><b>Fictício:</b> pessoas, rotas compartilhadas e alertas de exemplo (os locais são reais). Planos não cobram nada.</li>
            <li><b>Só neste navegador:</b> perfil, pedaladas, avaliações e alertas que você criar.</li>
          </ul>
        </section>

        <section className="secao" aria-labelledby="cred-t">
          <h2 id="cred-t" style={{ fontSize: 17 }}>Créditos</h2>
          <ul className="passos pequeno">
            <li>Mapa e dados: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© colaboradores do OpenStreetMap</a> (ODbL).</li>
            <li>Rotas: <a href="https://brouter.de/" target="_blank" rel="noreferrer">BRouter</a>.</li>
            <li>Busca de endereços: <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon, da Komoot</a>.</li>
            <li>Consulta de pontos ao vivo: servidores públicos do <a href="https://wiki.openstreetmap.org/wiki/Overpass_API" target="_blank" rel="noreferrer">Overpass API</a>.</li>
            <li>Fator de emissão: <a href={FONTE_FATOR} target="_blank" rel="noreferrer">UK DESNZ, conversion factors 2025</a>.</li>
            <li>Logo e identidade: pitch original do Time 8.</li>
          </ul>
          <a className="botao fantasma" href="https://github.com/dudabarbozat/bcycle-ciclismo-urbano" target="_blank" rel="noreferrer"><Icone nome="github" />Ver o código no GitHub</a>
        </section>
      </div>
    </AppShell>
  );
}
