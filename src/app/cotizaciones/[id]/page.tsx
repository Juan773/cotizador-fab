import { notFound } from "next/navigation";
import EditorCotizacion from "@/components/EditorCotizacion";
import AvisoConfiguracion from "@/components/AvisoConfiguracion";
import { clientesAnteriores, obtenerCotizacion } from "@/services/cotizaciones";

export const dynamic = "force-dynamic";

export default async function EditarCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  let datos;
  try {
    datos = await Promise.all([obtenerCotizacion(id), clientesAnteriores()]);
  } catch (e) {
    return <AvisoConfiguracion error={(e as Error).message} />;
  }
  const [cotizacion, clientes] = datos;
  if (!cotizacion) notFound();
  return <EditorCotizacion key={id} inicial={cotizacion} clientes={clientes} />;
}
