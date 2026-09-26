/**
 * Tras un nuevo despliegue, una pestaña abierta desde antes intenta cargar
 * partes del código (chunks) que ya no existen. Se detecta para pedir recargar.
 */
export function esVersionDesactualizada(e: unknown): boolean {
  const error = e as { name?: string; message?: string } | undefined;
  return (
    error?.name === "ChunkLoadError" ||
    /Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(error?.message ?? "")
  );
}

export const MENSAJE_VERSION = "Se publicó una versión nueva del cotizador. Recarga la página y vuelve a intentarlo.";

/** Ejecuta una tarea cuando el navegador está libre (para precargar módulos sin frenar la página). */
export function cuandoEsteLibre(tarea: () => void) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) window.requestIdleCallback(tarea, { timeout: 3000 });
  else setTimeout(tarea, 1500);
}
