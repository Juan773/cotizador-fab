"use client";

import { useRef, useState } from "react";
import { prepararImagen, rotarImagen } from "@/lib/imagen";

interface Props {
  imagen: string | null;
  onCambio: (dataUrl: string | null) => void;
}

/** Imagen de "PLANTA DE DISTRIBUCIÓN" de un ambiente: subir, rotar 90° o quitar. */
export default function SelectorImagen({ imagen, onCambio }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);

  async function procesar(fn: () => Promise<string>) {
    setCargando(true);
    try {
      onCambio(await fn());
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) procesar(() => prepararImagen(f));
        }}
      />
      {imagen ? (
        <>
          <div className="flex min-h-36 flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagen} alt="Planta de distribución" className="max-h-44 max-w-full object-contain" />
          </div>
          <div className="flex gap-1">
            <button type="button" className="btn-secundario flex-1 px-2 py-1 text-xs" onClick={() => input.current?.click()} disabled={cargando}>
              Cambiar
            </button>
            <button type="button" className="btn-secundario px-2 py-1 text-xs" title="Rotar 90°" onClick={() => procesar(() => rotarImagen(imagen))} disabled={cargando}>
              ↻ Rotar
            </button>
            <button type="button" className="btn-secundario px-2 py-1 text-xs text-red-600" title="Quitar imagen" onClick={() => onCambio(null)} disabled={cargando}>
              Quitar
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={cargando}
          className="flex min-h-36 flex-1 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 text-sm text-stone-500 transition hover:border-stone-500 hover:text-stone-800"
        >
          <span className="text-2xl leading-none">＋</span>
          {cargando ? "Procesando…" : "Subir planta"}
          <span className="text-xs text-stone-400">PNG o JPG (opcional)</span>
        </button>
      )}
    </div>
  );
}
