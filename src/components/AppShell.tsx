"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SaidaAviso } from "./Aviso";
import Cadastro from "./Cadastro";
import Icone from "./Icone";
import { caminho } from "@/lib/base";
import { useEstado, useMontado } from "@/lib/estado";

const ABAS = [
  { href: "/", rotulo: "Início", icone: "bussola" },
  { href: "/mapa/", rotulo: "Mapa", icone: "mapa" },
  { href: "/comunidade/", rotulo: "Comunidade", icone: "pessoas" },
  { href: "/perfil/", rotulo: "Perfil", icone: "usuario" },
];

const limpar = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

export default function AppShell({ children, cheio = false, semCadastro = false }: { children: React.ReactNode; cheio?: boolean; semCadastro?: boolean }) {
  const rota = limpar(usePathname() ?? "/");
  const estado = useEstado();
  const montado = useMontado();
  const precisaCadastro = montado && !estado.perfil && !semCadastro;

  return (
    <div className="palco">
      <aside className="lateral" aria-label="Sobre o protótipo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src={caminho("/img/logo-branco.png")} alt="BCYCLE" width={1200} height={368} />
        <p>App para ciclistas urbanos: rotas mais seguras, estacionamentos e oficinas no caminho, alertas da comunidade e a pegada de carbono que você deixou de emitir.</p>
        <ul className="lista">
          <li><Icone nome="mapa" tamanho={20} /><span><b>Dados reais</b> do OpenStreetMap: ciclovias, bicicletários, oficinas e estações de bike compartilhada.</span></li>
          <li><Icone nome="rota" tamanho={20} /><span><b>Rotas de bicicleta</b> pelo BRouter, com altitude, curva a curva e análise de segurança.</span></li>
          <li><Icone nome="pessoas" tamanho={20} /><span><b>Comunidade</b> e dados pessoais ficam só neste navegador.</span></li>
        </ul>
        <div className="links">
          <Link className="botao secundario pequeno" href="/sobre/">Sobre o projeto</Link>
          <a className="botao fantasma pequeno" href="https://github.com/dudabarbozat/bcycle-ciclismo-urbano" target="_blank" rel="noreferrer"><Icone nome="github" tamanho={18} />Código</a>
        </div>
        <p className="pequeno muted">Protótipo de portfólio. Pitch de hackathon reconstruído em 2026.</p>
      </aside>

      <div className="app">
        <main className={`app-conteudo${cheio ? " cheio" : ""}`} id="conteudo">{children}</main>
          <nav className="nav" aria-label="Navegação principal">
            {ABAS.map((a) => {
              const ativo = limpar(a.href) === rota || (a.href === "/mapa/" && rota === "/rota") || (a.href === "/perfil/" && rota === "/emergencia");
              return (
                <Link key={a.href} href={a.href} aria-current={ativo ? "page" : undefined}>
                  <Icone nome={a.icone} />
                  <span>{a.rotulo}</span>
                </Link>
              );
            })}
          </nav>
        {precisaCadastro && <Cadastro />}
        <SaidaAviso />
      </div>
    </div>
  );
}
