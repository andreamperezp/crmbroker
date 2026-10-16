import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { DemoProvider } from "@/lib/store";
import "./globals.css";

const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Brokerflow · CRM para brokers de seguros", template: "%s · Brokerflow" },
  description:
    "Demo de un CRM para brokers de seguros: autogestión para clientes, asesores con prospección asistida por IA, administración de pólizas y siniestros, y cobranzas con mora por etapas.",
  applicationName: "Brokerflow",
};

export const viewport: Viewport = { themeColor: "#f3f5f2" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${instrument.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
