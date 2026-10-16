import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cotizador } from "@/views/asesor/cotizador";
import { Ficha } from "@/views/asesor/ficha";
import { Pipeline } from "@/views/asesor/pipeline";
import { Postventa } from "@/views/asesor/postventa";
import { Prospeccion } from "@/views/asesor/prospeccion";
import { Renovaciones } from "@/views/asesor/renovaciones";

const VISTAS = { pipeline: Pipeline, prospeccion: Prospeccion, cliente: Ficha, cotizador: Cotizador, postventa: Postventa, renovaciones: Renovaciones };

export function generateStaticParams() {
  return Object.keys(VISTAS).map((vista) => ({ vista }));
}

export default async function Page({ params }: PageProps<"/asesor/[vista]">) {
  const { vista } = await params;
  const Vista = VISTAS[vista as keyof typeof VISTAS];
  if (!Vista) notFound();
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
