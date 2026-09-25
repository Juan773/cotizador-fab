"use client";

import { useState } from "react";
import { obtenerCotizacionAccion } from "@/app/acciones";
import { nombreBase } from "@/lib/excel/generar-excel";
import { descargarExcel } from "@/services/excel-navegador";
import { useNombreArchivo } from "./DialogoNombreArchivo";

/** Vuelve a generar y descargar el Excel o el PDF de una cotización guardada. */
export default function BotonDescarga({ id, formato }: { id: string; formato: "excel" | "pdf" }) {
  const [cargando, setCargando] = useState(false);
  const { pedirNombre, dialogo } = useNombreArchivo();

  async function generar() {
    setCargando(true);
    try {
      const r = await obtenerCotizacionAccion(id);
      if (!r.ok) throw new Error(r.error);
      setCargando(false);
      const nombre = await pedirNombre(nombreBase(r.datos), formato);
      if (nombre === null) return; // cancelado
      setCargando(true);
      if (formato === "excel") await descargarExcel(r.datos, nombre);
      else await (await import("@/services/pdf-navegador")).descargarPdf(r.datos, nombre);
    } catch (e) {
      alert(`No se pudo generar el ${formato === "excel" ? "Excel" : "PDF"}: ${(e as Error).message}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      {dialogo}
      <button type="button" className="btn-secundario px-3 py-1.5 text-xs" onClick={generar} disabled={cargando}>
        {cargando ? "Generando…" : formato === "excel" ? "Excel" : "PDF"}
      </button>
    </>
  );
}
