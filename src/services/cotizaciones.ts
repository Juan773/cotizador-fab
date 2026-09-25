import "server-only";
import { supabase } from "@/lib/supabase/servidor";
import { calcularTotales, redondear2 } from "@/lib/cotizacion/calculos";
import { nuevaClave } from "@/lib/utils";
import type { Cotizacion, CotizacionResumen, DatosCliente } from "@/types/cotizacion";

// ---------------------------------------------------------------------------
// Mapeo fila de BD <-> Cotizacion
// ---------------------------------------------------------------------------

interface FilaItem {
  orden: number;
  ambiente: string;
  descripcion: string;
  area: number | string;
  precio_m2: number | string;
  imagen: string | null;
}

interface FilaCotizacion {
  id: string;
  numero: string;
  fecha: string;
  fecha_vence: string;
  cliente_nombre: string;
  cliente_empresa: string;
  cliente_documento: string;
  cliente_direccion: string;
  cliente_telefono: string;
  cliente_email: string;
  arquitecto_nombre: string;
  arquitecto_telefono: string;
  precio_lista_m2: number | string;
  pct_adelanto: number | string;
  pct_saldo: number | string;
  cond_entrega: string;
  cond_cuota: string;
  cond_incluye: string;
  cond_entregable: string;
  cond_nota: string;
  total: number | string;
  cotizacion_items?: FilaItem[];
}

function aCotizacion(f: FilaCotizacion): Cotizacion {
  return {
    id: f.id,
    numero: f.numero,
    fecha: f.fecha,
    fechaVence: f.fecha_vence,
    cliente: {
      nombre: f.cliente_nombre,
      empresa: f.cliente_empresa,
      documento: f.cliente_documento,
      direccion: f.cliente_direccion,
      telefono: f.cliente_telefono,
      email: f.cliente_email,
    },
    arquitecto: { nombre: f.arquitecto_nombre, telefono: f.arquitecto_telefono },
    precioListaM2: Number(f.precio_lista_m2),
    pctAdelanto: Number(f.pct_adelanto),
    pctSaldo: Number(f.pct_saldo),
    condiciones: {
      entrega: f.cond_entrega,
      cuota: f.cond_cuota,
      incluye: f.cond_incluye,
      entregable: f.cond_entregable,
      nota: f.cond_nota,
    },
    items: [...(f.cotizacion_items ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((it) => ({
        key: nuevaClave(),
        ambiente: it.ambiente,
        descripcion: it.descripcion,
        area: Number(it.area),
        precioM2: Number(it.precio_m2),
        imagen: it.imagen,
      })),
  };
}

function aFila(c: Cotizacion) {
  const t = calcularTotales(c);
  return {
    fecha: c.fecha,
    fecha_vence: c.fechaVence,
    cliente_nombre: c.cliente.nombre.trim(),
    cliente_empresa: c.cliente.empresa.trim(),
    cliente_documento: c.cliente.documento.trim(),
    cliente_direccion: c.cliente.direccion.trim(),
    cliente_telefono: c.cliente.telefono.trim(),
    cliente_email: c.cliente.email.trim(),
    arquitecto_nombre: c.arquitecto.nombre.trim(),
    arquitecto_telefono: c.arquitecto.telefono.trim(),
    precio_lista_m2: c.precioListaM2,
    pct_adelanto: c.pctAdelanto,
    pct_saldo: c.pctSaldo,
    cond_entrega: c.condiciones.entrega,
    cond_cuota: c.condiciones.cuota,
    cond_incluye: c.condiciones.incluye,
    cond_entregable: c.condiciones.entregable,
    cond_nota: c.condiciones.nota,
    subtotal: redondear2(t.subtotal),
    igv: redondear2(t.igv),
    total: redondear2(t.total),
    monto_adelanto: redondear2(t.adelanto),
    monto_saldo: redondear2(t.saldo),
  };
}

// ---------------------------------------------------------------------------
// Operaciones
// ---------------------------------------------------------------------------

export async function listarCotizaciones(busqueda = ""): Promise<CotizacionResumen[]> {
  let q = supabase()
    .from("cotizaciones")
    .select("id, numero, fecha, cliente_nombre, cliente_empresa, total")
    .order("created_at", { ascending: false })
    .limit(200);

  // Se quitan caracteres con significado especial en los filtros de PostgREST.
  const texto = busqueda.replace(/[,()*%\\]/g, " ").trim();
  if (texto) {
    q = q.or(`numero.ilike.*${texto}*,cliente_nombre.ilike.*${texto}*,cliente_empresa.ilike.*${texto}*,cliente_documento.ilike.*${texto}*`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data.map((f) => ({
    id: f.id,
    numero: f.numero,
    fecha: f.fecha,
    clienteNombre: f.cliente_nombre,
    clienteEmpresa: f.cliente_empresa,
    total: Number(f.total),
  }));
}

export async function obtenerCotizacion(id: string): Promise<Cotizacion | null> {
  const { data, error } = await supabase()
    .from("cotizaciones")
    .select("*, cotizacion_items(orden, ambiente, descripcion, area, precio_m2, imagen)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aCotizacion(data as FilaCotizacion) : null;
}

/** Crea o actualiza la cotización (cabecera + ambientes). Los totales se recalculan aquí. */
export async function guardarCotizacion(c: Cotizacion): Promise<{ id: string; numero: string }> {
  const db = supabase();
  const fila = aFila(c);

  let id: string;
  let numero: string;
  if (c.id) {
    const { data, error } = await db
      .from("cotizaciones")
      .update({ ...fila, updated_at: new Date().toISOString() })
      .eq("id", c.id)
      .select("id, numero")
      .single();
    if (error) throw new Error(error.message);
    ({ id, numero } = data);
    const borrado = await db.from("cotizacion_items").delete().eq("cotizacion_id", id);
    if (borrado.error) throw new Error(borrado.error.message);
  } else {
    const { data, error } = await db.from("cotizaciones").insert(fila).select("id, numero").single();
    if (error) throw new Error(error.message);
    ({ id, numero } = data);
  }

  const items = c.items.map((it, i) => ({
    cotizacion_id: id,
    orden: i + 1,
    ambiente: it.ambiente.trim(),
    descripcion: it.descripcion,
    area: it.area,
    precio_m2: it.precioM2,
    costo: redondear2(it.area * it.precioM2),
    imagen: it.imagen,
  }));
  const { error } = await db.from("cotizacion_items").insert(items);
  if (error) throw new Error(error.message);

  return { id, numero };
}

/** Clientes de cotizaciones anteriores, para autocompletar (sin tabla aparte). */
export async function clientesAnteriores(): Promise<DatosCliente[]> {
  const { data, error } = await supabase()
    .from("cotizaciones")
    .select("cliente_nombre, cliente_empresa, cliente_documento, cliente_direccion, cliente_telefono, cliente_email")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  const vistos = new Set<string>();
  const clientes: DatosCliente[] = [];
  for (const f of data) {
    const clave = `${f.cliente_nombre}|${f.cliente_empresa}`.toLowerCase();
    if (!f.cliente_nombre || vistos.has(clave)) continue;
    vistos.add(clave);
    clientes.push({
      nombre: f.cliente_nombre,
      empresa: f.cliente_empresa,
      documento: f.cliente_documento,
      direccion: f.cliente_direccion,
      telefono: f.cliente_telefono,
      email: f.cliente_email,
    });
  }
  return clientes;
}
