import EditorCotizacion from "@/components/EditorCotizacion";
import AvisoConfiguracion from "@/components/AvisoConfiguracion";
import { cotizacionNueva, duplicar } from "@/lib/cotizacion/nueva";
import { clientesAnteriores, obtenerCotizacion } from "@/services/cotizaciones";
import type { Cotizacion, DatosCliente } from "@/types/cotizacion";

export const dynamic = "force-dynamic";

/** Nueva cotización. Con ?desde=<id> se abre una copia de una cotización existente ("Duplicar"). */
export default async function NuevaCotizacionPage({ searchParams }: { searchParams: Promise<{ desde?: string }> }) {
  const { desde } = await searchParams;
  let inicial: Cotizacion = cotizacionNueva();
  let clientes: DatosCliente[] = [];
  let aviso: string | undefined;
  let error: string | null = null;

  try {
    clientes = await clientesAnteriores();
    if (desde) {
      const origen = await obtenerCotizacion(desde);
      if (origen) {
        inicial = duplicar(origen);
        aviso = `Copia de ${origen.numero}. Se guardará con un número nuevo.`;
      }
    }
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      {error && <AvisoConfiguracion error={error} />}
      <EditorCotizacion key={desde ?? "nueva"} inicial={inicial} clientes={clientes} aviso={aviso} />
    </>
  );
}
