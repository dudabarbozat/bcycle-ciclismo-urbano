import type { Metadata } from "next";
import Emergencia from "@/components/telas/Emergencia";

export const metadata: Metadata = { title: "Emergência" };

export default function Page() {
  return <Emergencia />;
}
