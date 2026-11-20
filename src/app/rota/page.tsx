import type { Metadata } from "next";
import RotaTela from "@/components/telas/RotaTela";

export const metadata: Metadata = { title: "Rota" };

export default function Page() {
  return <RotaTela />;
}
