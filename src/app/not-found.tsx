import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
        <h1 style={{ fontSize: 26 }}>Caminho sem saída</h1>
        <p style={{ color: "var(--texto-2)" }}>Esta página não existe.</p>
        <Link className="botao" href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}
