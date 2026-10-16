/** Cotizador de la demo: precios ficticios pero coherentes entre ramos, coberturas y compañías. */
import { ASEGURADORAS } from "./seed";
import type { Ramo } from "./types";

export const COBERTURAS: Record<Ramo, { id: string; label: string; factor: number; desc: string }[]> = {
  Auto: [
    { id: "rc", label: "Responsabilidad civil", factor: 0.45, desc: "Daños a terceros" },
    { id: "tc", label: "Terceros completo", factor: 0.75, desc: "Robo, incendio y granizo" },
    { id: "tr", label: "Todo riesgo", factor: 1, desc: "Incluye daños propios" },
  ],
  Hogar: [
    { id: "basica", label: "Básica", factor: 0.6, desc: "Incendio y robo" },
    { id: "integral", label: "Integral", factor: 1, desc: "Agua, cristales y electrodomésticos" },
  ],
  Vida: [
    { id: "individual", label: "Individual", factor: 0.8, desc: "Un asegurado" },
    { id: "familiar", label: "Familiar", factor: 1.2, desc: "Titular y grupo familiar" },
  ],
  Comercio: [
    { id: "esencial", label: "Esencial", factor: 0.7, desc: "Incendio, robo y RC" },
    { id: "integral", label: "Integral", factor: 1, desc: "Suma cristales, mercadería y equipos" },
  ],
  "Accidentes personales": [
    { id: "laboral", label: "Laboral", factor: 0.8, desc: "Durante la actividad" },
    { id: "24h", label: "24 horas", factor: 1, desc: "En todo momento" },
  ],
};

const BASE: Record<Ramo, number> = { Auto: 52_000, Hogar: 24_000, Vida: 15_500, Comercio: 62_000, "Accidentes personales": 10_500 };

/** Cada compañía tiene su perfil: más barata, mejor servicio, franquicia más baja… */
const PERFILES = [
  { factor: 0.94, extra: "Grúa 300 km y auto sustituto", franquicia: "5 %" },
  { factor: 1.06, extra: "Atención 24 h por WhatsApp", franquicia: "3 %" },
  { factor: 0.89, extra: "Precio más bajo del mercado", franquicia: "8 %" },
  { factor: 1.12, extra: "Cobertura en países limítrofes", franquicia: "2 %" },
  { factor: 0.98, extra: "Descuento por pago anual", franquicia: "5 %" },
];

export interface Oferta {
  aseguradora: string;
  plan: string;
  precio: number;
  extra: string;
  franquicia: string;
  recomendada: boolean;
}

export function ofertas(ramo: Ramo, coberturaId: string, semilla = 0): Oferta[] {
  const cob = COBERTURAS[ramo].find((c) => c.id === coberturaId) ?? COBERTURAS[ramo][0];
  const lista = ASEGURADORAS.map((aseguradora, i) => {
    const p = PERFILES[(i + semilla) % PERFILES.length];
    return {
      aseguradora,
      plan: cob.label,
      precio: Math.round((BASE[ramo] * cob.factor * p.factor) / 100) * 100,
      extra: p.extra,
      franquicia: p.franquicia,
      recomendada: false,
    };
  }).sort((a, b) => a.precio - b.precio);
  // Recomendamos la mejor relación precio/franquicia: la segunda más barata suele ser la de mejor servicio
  lista[Math.min(1, lista.length - 1)].recomendada = true;
  return lista;
}
