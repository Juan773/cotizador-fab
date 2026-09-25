import type { CartaGarantia } from "@/types/cotizacion";
import { descargarBlob, nombreSeguro } from "./descarga";

/** Nombre sugerido como el original: CARTA_GARANTIA_ELIANA_OROS */
export function nombreCarta(carta: CartaGarantia): string {
  const nombre = carta.nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return nombre ? `CARTA_GARANTIA_${nombre}` : "CARTA_GARANTIA";
}

/** Genera la carta de garantía en el navegador y la descarga. */
export async function descargarCarta(carta: CartaGarantia, nombre = nombreCarta(carta)): Promise<void> {
  const [{ pdf }, { CartaGarantiaPdf, registrarFuentesCarta }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/pdf/CartaGarantiaPdf"),
  ]);
  const base = `${window.location.origin}/carta/`;
  const recursos = {
    fuenteRegular: `${base}Carlito-Regular.ttf`,
    fuenteNegrita: `${base}Carlito-Bold.ttf`,
    fondo: `${base}fondo.jpg`,
    cabecera: `${base}cabecera.png`,
    pie: `${base}pie.png`,
    firma: `${base}firma.png`,
  };
  registrarFuentesCarta(recursos);
  const blob = await pdf(<CartaGarantiaPdf carta={carta} recursos={recursos} />).toBlob();
  descargarBlob(blob, nombreSeguro(nombre, "pdf", nombreCarta(carta)));
}
