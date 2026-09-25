import Link from "next/link";
import AvisoConfiguracion from "@/components/AvisoConfiguracion";
import BotonDescarga from "@/components/BotonDescarga";
import { listarCotizaciones } from "@/services/cotizaciones";
import { formatoFecha, formatoSoles } from "@/lib/utils";
import type { CotizacionResumen } from "@/types/cotizacion";

export const dynamic = "force-dynamic";

export default async function HistorialPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let cotizaciones: CotizacionResumen[] = [];
  let error: string | null = null;
  try {
    cotizaciones = await listarCotizaciones(q);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Historial de cotizaciones</h1>
          <p className="text-sm text-stone-500">Busca, abre, edita, duplica o vuelve a descargar el Excel o el PDF.</p>
        </div>
        <Link href="/" className="btn-primario">
          ＋ Nueva cotización
        </Link>
      </div>

      {error && <AvisoConfiguracion error={error} />}

      <form className="mb-4 flex gap-2" action="/cotizaciones">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por número, cliente, empresa o RUC…"
          className="campo max-w-md"
          aria-label="Buscar cotizaciones"
        />
        <button className="btn-secundario">Buscar</button>
        {q && (
          <Link href="/cotizaciones" className="btn px-3 text-stone-500 hover:text-stone-900">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {cotizaciones.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-stone-500">
            {q ? `No hay cotizaciones que coincidan con “${q}”.` : "Todavía no hay cotizaciones guardadas."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cotizaciones.map((c) => (
                <tr key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-stone-50 md:table-row md:p-0">
                  <td className="font-mono text-xs font-semibold md:px-4 md:py-3">
                    <Link href={`/cotizaciones/${c.id}`} className="hover:underline">
                      {c.numero}
                    </Link>
                  </td>
                  <td className="w-full md:w-auto md:px-4 md:py-3">
                    <div className="font-medium text-stone-900">{c.clienteNombre || c.clienteEmpresa || <span className="text-stone-400">Sin cliente</span>}</div>
                    {c.clienteNombre && c.clienteEmpresa && <div className="text-xs text-stone-500">{c.clienteEmpresa}</div>}
                  </td>
                  <td className="text-stone-600 md:px-4 md:py-3">{formatoFecha(c.fecha)}</td>
                  <td className="ml-auto font-semibold tabular-nums md:px-4 md:py-3 md:text-right">{formatoSoles(c.total)}</td>
                  <td className="w-full md:w-auto md:px-4 md:py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/cotizaciones/${c.id}`} className="btn-secundario px-3 py-1.5 text-xs">
                        Abrir / editar
                      </Link>
                      <Link href={`/?desde=${c.id}`} className="btn-secundario px-3 py-1.5 text-xs">
                        Duplicar
                      </Link>
                      <BotonDescarga id={c.id} formato="excel" />
                      <BotonDescarga id={c.id} formato="pdf" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
