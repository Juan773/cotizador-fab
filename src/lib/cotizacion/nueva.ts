import type { Cotizacion, ItemCotizacion } from "@/types/cotizacion";
import { hoyISO, nuevaClave } from "@/lib/utils";
import {
  ARQUITECTO_DEFECTO,
  CONDICIONES_DEFECTO,
  PCT_ADELANTO_DEFECTO,
  PCT_SALDO_DEFECTO,
  PRECIO_LISTA_M2_DEFECTO,
  PRECIO_M2_DEFECTO,
  descripcionDefecto,
} from "./constantes";

export function itemNuevo(precioM2 = PRECIO_M2_DEFECTO): ItemCotizacion {
  return { key: nuevaClave(), ambiente: "", descripcion: descripcionDefecto(), area: 0, precioM2, imagen: null };
}

export function cotizacionNueva(): Cotizacion {
  const hoy = hoyISO();
  return {
    id: null,
    numero: null,
    fecha: hoy,
    fechaVence: hoy, // en la plantilla ambas fechas coinciden por defecto
    cliente: { nombre: "", empresa: "", documento: "", direccion: "", telefono: "", email: "" },
    arquitecto: { ...ARQUITECTO_DEFECTO },
    precioListaM2: PRECIO_LISTA_M2_DEFECTO,
    pctAdelanto: PCT_ADELANTO_DEFECTO,
    pctSaldo: PCT_SALDO_DEFECTO,
    condiciones: { ...CONDICIONES_DEFECTO },
    items: [itemNuevo()],
  };
}

/** Copia para "Duplicar": sin id ni número y con la fecha de hoy. */
export function duplicar(c: Cotizacion): Cotizacion {
  const hoy = hoyISO();
  return { ...c, id: null, numero: null, fecha: hoy, fechaVence: hoy, items: c.items.map((it) => ({ ...it, key: nuevaClave() })) };
}
