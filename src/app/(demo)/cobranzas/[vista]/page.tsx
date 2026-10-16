import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Contacto } from "@/views/cobranzas/contacto";
import { Mora } from "@/views/cobranzas/mora";
import { Planes } from "@/views/cobranzas/planes";
import { Reportes } from "@/views/cobranzas/reportes";
import { Tablero } from "@/views/cobranzas/tablero";

const VISTAS = { tablero: Tablero, mora: Mora, contacto: Contacto, planes: Planes, reportes: Reportes };

export function generateStaticParams() {
  return Object.keys(VISTAS).map((vista) => ({ vista }));
}

export default async function Page({ params }: PageProps<"/cobranzas/[vista]">) {
  const { vista } = await params;
  const Vista = VISTAS[vista as keyof typeof VISTAS];
  if (!Vista) notFound();
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
