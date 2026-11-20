import type { Metadata } from "next";
import PerfilTela from "@/components/telas/PerfilTela";

export const metadata: Metadata = { title: "Perfil" };

export default function Page() {
  return <PerfilTela />;
}
