import { calcularTotales } from "@/lib/cotizacion/calculos";
import { nombreArchivo } from "@/lib/excel/generar-excel";
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

/** Genera el PDF de la cotización en el navegador (sin columnas auxiliares) y lo descarga. */
export async function descargarPdf(cot: Cotizacion): Promise<void> {
  // Se carga solo al pedir un PDF para no engordar la página.
  const [{ pdf }, { CotizacionPdf }, imagenLogo] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/pdf/CotizacionPdf"),
    cargarLogo(),
  ]);
  const blob = await pdf(<CotizacionPdf cot={cot} totales={calcularTotales(cot)} logo={imagenLogo} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo(cot).replace(/\.xlsx$/, ".pdf");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
