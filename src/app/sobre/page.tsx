import type { Metadata } from "next";
import Sobre from "@/components/telas/Sobre";

export const metadata: Metadata = { title: "Sobre o projeto" };

export default function Page() {
  return <Sobre />;
}
