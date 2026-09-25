"use client";

import { useEffect, useRef, useState } from "react";

type Formato = "excel" | "pdf";

interface Solicitud {
  nombre: string;
  formato: Formato;
  resolver: (nombre: string | null) => void;
}

/**
 * Pide el nombre del archivo antes de descargarlo.
 * `pedirNombre` devuelve el nombre elegido (sin extensión) o null si se cancela.
 */
export function useNombreArchivo() {
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);

  const pedirNombre = (nombre: string, formato: Formato) =>
    new Promise<string | null>((resolver) => setSolicitud({ nombre, formato, resolver }));

  const cerrar = (valor: string | null) => {
    solicitud?.resolver(valor);
    setSolicitud(null);
  };

  const dialogo = solicitud ? (
    <DialogoNombreArchivo
      key={solicitud.nombre + solicitud.formato}
      inicial={solicitud.nombre}
      formato={solicitud.formato}
      onCerrar={cerrar}
    />
  ) : null;

  return { pedirNombre, dialogo };
}

function DialogoNombreArchivo({
  inicial,
  formato,
  onCerrar,
}: {
  inicial: string;
  formato: Formato;
  onCerrar: (valor: string | null) => void;
}) {
  const [nombre, setNombre] = useState(inicial);
  const input = useRef<HTMLInputElement>(null);
  const extension = formato === "excel" ? ".xlsx" : ".pdf";

  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;

  useEffect(() => {
    input.current?.select(); // listo para escribir encima del nombre sugerido
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && cerrarRef.current(null);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/40 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar(null)}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nombre-archivo"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          onCerrar(nombre.trim() || inicial);
        }}
      >
        <h2 id="titulo-nombre-archivo" className="text-base font-semibold">
          Descargar {formato === "excel" ? "Excel" : "PDF"}
        </h2>
        <label htmlFor="nombre-archivo" className="etiqueta mt-4">
          Nombre del archivo
        </label>
        <div className="flex items-center rounded-lg border border-stone-300 focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10">
          <input
            ref={input}
            id="nombre-archivo"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <span className="px-3 text-sm text-stone-400">{extension}</span>
        </div>
        <p className="mt-2 text-xs text-stone-500">Se quitan automáticamente los caracteres no válidos ( \ / : * ? &quot; &lt; &gt; | ).</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secundario" onClick={() => onCerrar(null)}>
            Cancelar
          </button>
          <button type="submit" className="btn-primario">
            Descargar
          </button>
        </div>
      </form>
    </div>
  );
}
