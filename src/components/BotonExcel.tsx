"use client";

import { useState } from "react";
import { obtenerCotizacionAccion } from "@/app/acciones";
import { descargarExcel } from "@/services/excel-navegador";

/** Vuelve a generar y descargar el Excel de una cotización guardada. */
export default function BotonExcel({ id }: { id: string }) {
  const [cargando, setCargando] = useState(false);

  async function generar() {
    setCargando(true);
    try {
      const r = await obtenerCotizacionAccion(id);
      if (!r.ok) throw new Error(r.error);
      await descargarExcel(r.datos);
    } catch (e) {
      alert(`No se pudo generar el Excel: ${(e as Error).message}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <button type="button" className="btn-secundario px-3 py-1.5 text-xs" onClick={generar} disabled={cargando}>
      {cargando ? "Generando…" : "Excel"}
    </button>
  );
}
