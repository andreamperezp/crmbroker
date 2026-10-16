import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { DemoProvider } from "@/lib/store";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Brokerflow · CRM para brokers de seguros", template: "%s · Brokerflow" },
  description:
    "Demo de un CRM para brokers de seguros: autogestión para clientes, asesores con prospección asistida por IA, administración de pólizas y siniestros, y cobranzas con mora por etapas.",
  applicationName: "Brokerflow",
};

export const viewport: Viewport = { themeColor: "#f5f6fa" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={figtree.variable}>
      <head>
        {/* Íconos del design system (Material Symbols Rounded) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&display=block"
        />
      </head>
      <body className="min-h-dvh">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
