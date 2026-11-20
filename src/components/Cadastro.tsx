"use client";

import { useState } from "react";
import Icone from "./Icone";
import { caminho } from "@/lib/base";
import { atualizar, PLANOS, type Modo, type Plano } from "@/lib/estado";

const MODOS: { id: Modo; rotulo: string; desc: string; icone: string }[] = [
  { id: "urbano", rotulo: "Dia a dia", desc: "trabalho e estudo", icone: "bike" },
  { id: "lazer", rotulo: "Lazer", desc: "passeios", icone: "folha" },
  { id: "estrada", rotulo: "Treino", desc: "ritmo forte", icone: "montanha" },
];

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [modo, setModo] = useState<Modo>("urbano");
  const [plano, setPlano] = useState<Plano>("premium");
  const [erro, setErro] = useState("");

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const n = nome.trim();
    if (n.length < 2) { setErro("Digite como quer ser chamado (pelo menos 2 letras)."); return; }
    atualizar((s) => ({ ...s, perfil: { nome: n.slice(0, 30), modo, plano, criadoEm: new Date().toISOString() } }));
  }

  return (
    <form className="cadastro" onSubmit={entrar} aria-labelledby="cad-titulo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo" src={caminho("/img/logo-branco.png")} alt="BCYCLE" width={1200} height={368} />
      <div style={{ display: "grid", gap: 6 }}>
        <h1 id="cad-titulo" style={{ fontSize: 22 }}>Vamos pedalar?</h1>
        <p className="muted">Conectamos você aos melhores caminhos, pontos de apoio e pessoas. Seus dados ficam só neste navegador.</p>
      </div>

      <div className="campo">
        <label htmlFor="cad-nome">Como quer ser chamado?</label>
        <input
          id="cad-nome" value={nome} autoComplete="given-name" maxLength={30} placeholder="Seu nome"
          onChange={(e) => { setNome(e.target.value); setErro(""); }}
          aria-invalid={!!erro} aria-describedby={erro ? "cad-erro" : undefined}
        />
        {erro && <span id="cad-erro" className="erro-campo">{erro}</span>}
      </div>

      <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="pequeno muted" style={{ marginBottom: 6, fontWeight: 500 }}>Como você pedala?</legend>
        <div className="opcoes">
          {MODOS.map((m) => (
            <button key={m.id} type="button" className="opcao" aria-pressed={modo === m.id} onClick={() => setModo(m.id)}>
              <Icone nome={m.icone} />
              {m.rotulo}
              <small>{m.desc}</small>
            </button>
          ))}
        </div>
        <span className="pequeno muted">Define o tipo de rota que sugerimos primeiro.</span>
      </fieldset>

      <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="pequeno muted" style={{ marginBottom: 6, fontWeight: 500 }}>Plano</legend>
        <div className="planos">
          {(["freemium", "basico", "premium"] as Plano[]).map((p) => (
            <button key={p} type="button" className="plano" aria-pressed={plano === p} onClick={() => setPlano(p)}>
              <span className="cab"><b>{PLANOS[p].nome}</b><span className="pequeno muted">{PLANOS[p].preco}</span></span>
              {p === "premium" && <span className="selo azul" style={{ justifySelf: "start" }}>Recomendado para conhecer o protótipo</span>}
            </button>
          ))}
        </div>
        <span className="pequeno muted">Nenhuma cobrança: os planos só liberam ou bloqueiam funções na demonstração. Dá para trocar depois no Perfil.</span>
      </fieldset>

      <button className="botao largo" type="submit">Começar <Icone nome="seta" /></button>
    </form>
  );
}
