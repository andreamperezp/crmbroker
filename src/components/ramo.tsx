import { IconBuildingStore, IconCar, IconHeartHandshake, IconHome, IconUmbrella } from "@tabler/icons-react";
import type { Ramo } from "@/lib/types";

export const ICONO_RAMO: Record<Ramo, typeof IconCar> = {
  Auto: IconCar,
  Hogar: IconHome,
  Vida: IconHeartHandshake,
  Comercio: IconBuildingStore,
  "Accidentes personales": IconUmbrella,
};

export function RamoIcon({ ramo, size = 18 }: { ramo: Ramo; size?: number }) {
  const Icono = ICONO_RAMO[ramo];
  return <Icono size={size} aria-hidden="true" />;
}
