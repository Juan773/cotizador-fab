import { generarExcel, nombreBase } from "@/lib/excel/generar-excel";
import type { Cotizacion } from "@/types/cotizacion";
import { descargarBlob, nombreSeguro } from "./descarga";

const RUTA_PLANTILLA = "/plantilla-cotizacion.xlsx";
let plantilla: ArrayBuffer | null = null;

/** Genera el Excel en el navegador a partir de la plantilla y lo descarga con el nombre indicado. */
export async function descargarExcel(cot: Cotizacion, nombre = nombreBase(cot)): Promise<void> {
  if (!plantilla) {
    const r = await fetch(RUTA_PLANTILLA);
    if (!r.ok) throw new Error("No se pudo cargar la plantilla de Excel.");
    plantilla = await r.arrayBuffer();
  }
  const bytes = await generarExcel(plantilla.slice(0), cot);
  const blob = new Blob([bytes as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  descargarBlob(blob, nombreSeguro(nombre, "xlsx", nombreBase(cot)));
}
