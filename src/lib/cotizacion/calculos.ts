import type { Cotizacion, Totales } from "@/types/cotizacion";
import { IGV } from "./constantes";

/**
 * Replica exactamente las fórmulas de la plantilla:
 *   K(i) = N(i)*O(i)          costo = área × precio/m²
 *   K25  = SUM(K20:K24)       MONTO TOTAL
 *   K26  = K25*0.18           IGV
 *   K27  = K25+K26            total
 *   K30  = K27*J30            adelanto (cierre de contrato)
 *   K31  = J31*K27            saldo (antes de los entregables)
 *   R(i) = S(i)*T(i) ...      mismo cálculo a precio de lista (columnas auxiliares)
 * Sin redondeos intermedios, igual que Excel; se redondea solo al mostrar/guardar.
 */
export function calcularTotales(c: Pick<Cotizacion, "items" | "precioListaM2" | "pctAdelanto" | "pctSaldo">): Totales {
  const costos = c.items.map((it) => it.area * it.precioM2);
  const subtotal = costos.reduce((a, b) => a + b, 0);
  const igv = subtotal * IGV;
  const total = subtotal + igv;

  const subLista = c.items.reduce((a, it) => a + it.area * c.precioListaM2, 0);
  const igvLista = subLista * IGV;
  const totalLista = subLista + igvLista;

  return {
    costos,
    subtotal,
    igv,
    total,
    adelanto: total * c.pctAdelanto,
    saldo: c.pctSaldo * total,
    lista: { subtotal: subLista, igv: igvLista, total: totalLista },
    ahorro: totalLista - total,
  };
}

export function redondear2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
