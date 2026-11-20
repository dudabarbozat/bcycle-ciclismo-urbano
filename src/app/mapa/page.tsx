import type { Metadata } from "next";
import MapaTela from "@/components/telas/MapaTela";

export const metadata: Metadata = { title: "Mapa" };

export default function Page() {
  return <MapaTela />;
}
