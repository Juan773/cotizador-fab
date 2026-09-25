"use server";

import { revalidatePath } from "next/cache";
import { guardarCotizacion, obtenerCotizacion } from "@/services/cotizaciones";
import type { Cotizacion } from "@/types/cotizacion";

type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

function validar(c: Cotizacion): string | null {
  if (!c.cliente.nombre.trim() && !c.cliente.empresa.trim()) return "Ingresa el nombre o la empresa del cliente.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha) || !/^\d{4}-\d{2}-\d{2}$/.test(c.fechaVence)) return "Revisa las fechas.";
  if (c.items.length === 0) return "Agrega al menos un ambiente.";
  const numeros = [c.precioListaM2, c.pctAdelanto, c.pctSaldo, ...c.items.flatMap((it) => [it.area, it.precioM2])];
  if (numeros.some((n) => !Number.isFinite(n) || n < 0)) return "Hay cantidades o precios inválidos.";
  if (c.items.some((it) => !it.ambiente.trim())) return "Cada ambiente necesita un nombre.";
  return null;
}

export async function guardarCotizacionAccion(c: Cotizacion): Promise<Resultado<{ id: string; numero: string }>> {
  const error = validar(c);
  if (error) return { ok: false, error };
  try {
    const datos = await guardarCotizacion(c);
    revalidatePath("/cotizaciones");
    return { ok: true, datos };
  } catch (e) {
    return { ok: false, error: `No se pudo guardar: ${(e as Error).message}` };
  }
}

export async function obtenerCotizacionAccion(id: string): Promise<Resultado<Cotizacion>> {
  try {
    const c = await obtenerCotizacion(id);
    return c ? { ok: true, datos: c } : { ok: false, error: "La cotización no existe." };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
