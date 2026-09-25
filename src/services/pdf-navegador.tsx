import { calcularTotales } from "@/lib/cotizacion/calculos";
import { nombreBase } from "@/lib/excel/generar-excel";
import { descargarBlob, nombreSeguro } from "./descarga";
import type { Cotizacion } from "@/types/cotizacion";

let logo: string | null = null;

async function cargarLogo(): Promise<string> {
  if (logo) return logo;
  const blob = await (await fetch("/logo.png")).blob();
  logo = await new Promise<string>((ok) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as string);
    r.readAsDataURL(blob);
  });
  return logo;
}

/** Genera el PDF de la cotización en el navegador (sin columnas auxiliares) y lo descarga con el nombre indicado. */
export async function descargarPdf(cot: Cotizacion, nombre = nombreBase(cot)): Promise<void> {
  // Se carga solo al pedir un PDF para no engordar la página.
  const [{ pdf }, { CotizacionPdf }, imagenLogo] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/pdf/CotizacionPdf"),
    cargarLogo(),
  ]);
  const blob = await pdf(<CotizacionPdf cot={cot} totales={calcularTotales(cot)} logo={imagenLogo} />).toBlob();
  descargarBlob(blob, nombreSeguro(nombre, "pdf", nombreBase(cot)));
}
