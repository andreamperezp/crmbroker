import { IconTile, type Tone } from "./ui";
import type { Ramo, TipoGestion } from "@/lib/types";

/** Ícono Material Symbols de cada ramo (según el design system) */
export const ICONO_RAMO: Record<Ramo, string> = {
  Auto: "directions_car",
  Hogar: "home",
  Vida: "favorite",
  Comercio: "storefront",
  "Accidentes personales": "health_and_safety",
};

export const ICONO_GESTION: Record<TipoGestion, string> = {
  Emisión: "post_add",
  Endoso: "edit_document",
  Siniestro: "car_crash",
  Renovación: "autorenew",
  Baja: "cancel",
};

export function RamoTile({ ramo, size = 40, tone = "primary" }: { ramo: Ramo; size?: number; tone?: Tone }) {
  return <IconTile name={ICONO_RAMO[ramo]} size={size} tone={tone} />;
}
