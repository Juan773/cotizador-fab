import "server-only";
import { sql } from "@/lib/db";
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

const COLUMNAS_CLIENTE = "cliente_nombre, cliente_empresa, cliente_documento, cliente_direccion, cliente_telefono, cliente_email";

export async function listarCotizaciones(busqueda = ""): Promise<CotizacionResumen[]> {
  const db = sql();
  const texto = busqueda.trim();
  // Se escapan los comodines de LIKE para buscar el texto tal cual.
  const patron = `%${texto.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const filas = await db`
    select id, numero, fecha::text as fecha, cliente_nombre, cliente_empresa, total
    from cotizaciones
    ${texto ? db`where numero ilike ${patron} or cliente_nombre ilike ${patron}
                  or cliente_empresa ilike ${patron} or cliente_documento ilike ${patron}` : db``}
    order by created_at desc
    limit 200`;
  return filas.map((f) => ({
    id: f.id,
    numero: f.numero,
    fecha: f.fecha,
    clienteNombre: f.cliente_nombre,
    clienteEmpresa: f.cliente_empresa,
    total: Number(f.total),
  }));
}

export async function obtenerCotizacion(id: string): Promise<Cotizacion | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = sql();
  const [fila] = await db`
    select *, fecha::text as fecha, fecha_vence::text as fecha_vence
    from cotizaciones where id = ${id}`;
  if (!fila) return null;
  const items = await db`
    select orden, ambiente, descripcion, area, precio_m2, imagen
    from cotizacion_items where cotizacion_id = ${id} order by orden`;
  return aCotizacion({ ...fila, cotizacion_items: items } as unknown as FilaCotizacion);
}

/** Crea o actualiza la cotización (cabecera + ambientes) en una sola transacción. Los totales se recalculan aquí. */
export async function guardarCotizacion(c: Cotizacion): Promise<{ id: string; numero: string }> {
  const fila = aFila(c);
  return sql().begin(async (tx) => {
    const [r] = c.id
      ? await tx`update cotizaciones set ${tx(fila)}, updated_at = now() where id = ${c.id} returning id, numero`
      : await tx`insert into cotizaciones ${tx(fila)} returning id, numero`;
    if (!r) throw new Error("La cotización ya no existe.");

    const items = c.items.map((it, i) => ({
      cotizacion_id: r.id as string,
      orden: i + 1,
      ambiente: it.ambiente.trim(),
      descripcion: it.descripcion,
      area: it.area,
      precio_m2: it.precioM2,
      costo: redondear2(it.area * it.precioM2),
      imagen: it.imagen,
    }));
    await tx`delete from cotizacion_items where cotizacion_id = ${r.id}`;
    await tx`insert into cotizacion_items ${tx(items)}`;
    return { id: r.id as string, numero: r.numero as string };
  });
}

/** Clientes de cotizaciones anteriores, para autocompletar (sin tabla aparte). */
export async function clientesAnteriores(): Promise<DatosCliente[]> {
  const db = sql();
  const filas = await db`
    select ${db.unsafe(COLUMNAS_CLIENTE)} from cotizaciones order by created_at desc limit 300`;
  const vistos = new Set<string>();
  const clientes: DatosCliente[] = [];
  for (const f of filas) {
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
