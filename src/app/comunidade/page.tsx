import type { Metadata } from "next";
import Comunidade from "@/components/telas/Comunidade";

export const metadata: Metadata = { title: "Comunidade" };

export default function Page() {
  return <Comunidade />;
}
