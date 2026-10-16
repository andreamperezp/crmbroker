import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Documentacion } from "@/views/admin/documentacion";
import { Emision } from "@/views/admin/emision";
import { Endosos } from "@/views/admin/endosos";
import { Siniestros } from "@/views/admin/siniestros";
import { Tramites } from "@/views/admin/tramites";

const VISTAS = { tramites: Tramites, emision: Emision, siniestros: Siniestros, endosos: Endosos, documentacion: Documentacion };

export function generateStaticParams() {
  return Object.keys(VISTAS).map((vista) => ({ vista }));
}

export default async function Page({ params }: PageProps<"/administracion/[vista]">) {
  const { vista } = await params;
  const Vista = VISTAS[vista as keyof typeof VISTAS];
  if (!Vista) notFound();
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
