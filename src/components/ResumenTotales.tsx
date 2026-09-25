import type { Totales } from "@/types/cotizacion";
import { formatoSoles } from "@/lib/utils";

interface Props {
  totales: Totales;
  pctAdelanto: number;
  pctSaldo: number;
  precioListaM2: number;
}

function Fila({ texto, valor, fuerte = false }: { texto: string; valor: number; fuerte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${fuerte ? "text-base font-semibold text-stone-900" : "text-sm text-stone-600"}`}>
      <span>{texto}</span>
      <span className="tabular-nums">{formatoSoles(valor)}</span>
    </div>
  );
}

export default function ResumenTotales({ totales: t, pctAdelanto, pctSaldo, precioListaM2 }: Props) {
  const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Fila texto="Monto total" valor={t.subtotal} />
        <Fila texto="IGV (18%)" valor={t.igv} />
      </div>
      <div className="rounded-xl bg-stone-900 px-4 py-3 text-white">
        <div className="text-xs text-stone-400">Total con IGV</div>
        <div className="text-2xl font-semibold tabular-nums">{formatoSoles(t.total)}</div>
      </div>
      <div className="space-y-2 border-t border-stone-200 pt-3">
        <Fila texto={`Cierre de contrato (${pct(pctAdelanto)})`} valor={t.adelanto} />
        <Fila texto={`Antes de entregables (${pct(pctSaldo)})`} valor={t.saldo} />
      </div>
      {t.ahorro > 0.005 && (
        <div className="rounded-lg bg-crema px-3 py-2 text-xs text-stone-700 ring-1 ring-amber-200">
          A precio de lista (S/ {precioListaM2}/m²) serían <b className="tabular-nums">{formatoSoles(t.lista.total)}</b>. Descuento aplicado:{" "}
          <b className="tabular-nums">{formatoSoles(t.ahorro)}</b>
        </div>
      )}
    </div>
  );
}
