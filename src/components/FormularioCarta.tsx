"use client";

import { useState } from "react";
import type { CartaGarantia } from "@/types/cotizacion";
import { CARTA } from "@/lib/cotizacion/constantes";
import { fechaLarga, hoyISO } from "@/lib/utils";
import { descargarCarta, nombreCarta } from "@/services/carta-navegador";
import { useNombreArchivo } from "./DialogoNombreArchivo";
import CampoNumero from "./CampoNumero";

export default function FormularioCarta() {
  const [carta, setCarta] = useState<CartaGarantia>({
    nombre: "",
    dni: "",
    fechaEntrega: hoyISO(),
    validezMeses: CARTA.validezDefecto,
  });
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pedirNombre, dialogo } = useNombreArchivo();

  const cambiar = (c: Partial<CartaGarantia>) => setCarta((a) => ({ ...a, ...c }));

  async function descargar() {
    setError(null);
    const nombre = await pedirNombre(nombreCarta(carta), "pdf");
    if (nombre === null) return;
    setGenerando(true);
    try {
      await descargarCarta(carta, nombre);
    } catch (e) {
      setError(`No se pudo generar la carta: ${(e as Error).message}`);
    } finally {
      setGenerando(false);
    }
  }

  const meses = carta.validezMeses;
  const n = (t: string) => <b className="text-stone-900">{t.trim() || "________"}</b>;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      {dialogo}
      <section className="tarjeta h-fit space-y-4">
        <h2 className="titulo-seccion !mb-0">Datos de la carta</h2>
        <div>
          <label className="etiqueta" htmlFor="carta-nombre">
            Nombre del cliente
          </label>
          <input
            id="carta-nombre"
            className="campo"
            placeholder="Diocesana Eliana Oros"
            value={carta.nombre}
            onChange={(e) => cambiar({ nombre: e.target.value })}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="carta-dni">
            DNI
          </label>
          <input
            id="carta-dni"
            className="campo"
            inputMode="numeric"
            placeholder="04648728"
            value={carta.dni}
            onChange={(e) => cambiar({ dni: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="etiqueta" htmlFor="carta-fecha">
              Fecha de entrega
            </label>
            <input
              id="carta-fecha"
              type="date"
              className="campo"
              value={carta.fechaEntrega}
              onChange={(e) => cambiar({ fechaEntrega: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="carta-meses">
              Validez (meses)
            </label>
            <CampoNumero
              id="carta-meses"
              valor={carta.validezMeses}
              onCambio={(v) => cambiar({ validezMeses: Math.max(0, Math.round(v)) })}
            />
          </div>
        </div>
        <button type="button" className="btn-primario w-full" onClick={descargar} disabled={generando}>
          {generando ? "Generando…" : "Descargar PDF"}
        </button>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">Vista previa del texto</h2>
        <div className="mx-auto max-w-2xl space-y-5 text-[15px] leading-relaxed text-stone-700">
          <p className="text-center text-lg font-bold text-stone-900 underline underline-offset-4">CARTA GARANTÍA DE SERVICIO</p>
          <p className="text-justify">
            Por este medio la empresa: {n(CARTA.empresa)} con {n(`RUC ${CARTA.ruc}`)} otorga la presente garantía al señor(a):{" "}
            {n(carta.nombre)} debidamente identificado con el <b className="text-stone-900">DNI</b> {n(carta.dni)} por {CARTA.trabajo}{" "}
            entregado el {n(carta.fechaEntrega ? `${fechaLarga(carta.fechaEntrega)}.` : "")}
          </p>
          <p>
            Esta garantía tiene una validez de {n(`${meses} ${meses === 1 ? "mes" : "meses"}.`)}
          </p>
          <p className="text-sm text-stone-500">
            El resto del texto (condiciones y firma) es fijo, igual que en la carta original.
          </p>
        </div>
      </section>
    </div>
  );
}
