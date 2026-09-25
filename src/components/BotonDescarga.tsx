"use client";

import { useState } from "react";
import { obtenerCotizacionAccion } from "@/app/acciones";
import { descargarExcel } from "@/services/excel-navegador";

/** Vuelve a generar y descargar el Excel o el PDF de una cotización guardada. */
export default function BotonDescarga({ id, formato }: { id: string; formato: "excel" | "pdf" }) {
  const [cargando, setCargando] = useState(false);

  async function generar() {
    setCargando(true);
    try {
      const r = await obtenerCotizacionAccion(id);
      if (!r.ok) throw new Error(r.error);
      if (formato === "excel") await descargarExcel(r.datos);
      else await (await import("@/services/pdf-navegador")).descargarPdf(r.datos);
    } catch (e) {
      alert(`No se pudo generar el ${formato === "excel" ? "Excel" : "PDF"}: ${(e as Error).message}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <button type="button" className="btn-secundario px-3 py-1.5 text-xs" onClick={generar} disabled={cargando}>
      {cargando ? "Generando…" : formato === "excel" ? "Excel" : "PDF"}
    </button>
  );
}
