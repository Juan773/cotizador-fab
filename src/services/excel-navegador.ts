import { generarExcel, nombreArchivo } from "@/lib/excel/generar-excel";
import type { Cotizacion } from "@/types/cotizacion";

const RUTA_PLANTILLA = "/plantilla-cotizacion.xlsx";
let plantilla: ArrayBuffer | null = null;

/** Genera el Excel en el navegador a partir de la plantilla y lo descarga. */
export async function descargarExcel(cot: Cotizacion): Promise<void> {
  if (!plantilla) {
    const r = await fetch(RUTA_PLANTILLA);
    if (!r.ok) throw new Error("No se pudo cargar la plantilla de Excel.");
    plantilla = await r.arrayBuffer();
  }
  const bytes = await generarExcel(plantilla.slice(0), cot);
  const blob = new Blob([bytes as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo(cot);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
