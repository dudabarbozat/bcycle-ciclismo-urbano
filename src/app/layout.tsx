import type { Metadata, Viewport } from "next";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { caminho } from "@/lib/base";
import { AvisoProvider } from "@/components/Aviso";

export const metadata: Metadata = {
  title: { default: "BCYCLE", template: "%s · BCYCLE" },
  description:
    "App para ciclistas urbanos: rotas mais seguras, estacionamentos e oficinas no caminho, alertas da comunidade e pegada de carbono. Protótipo de portfólio.",
  manifest: caminho("/manifest.webmanifest"),
  icons: { icon: caminho("/img/favicon.png"), apple: caminho("/img/apple-touch-icon.png") },
  appleWebApp: { capable: true, title: "BCYCLE", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0d1622", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AvisoProvider>{children}</AvisoProvider>
      </body>
    </html>
  );
}
