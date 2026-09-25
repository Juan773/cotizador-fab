"use client";

import { useEffect, useMemo, useState } from "react";
import type { Condiciones, Cotizacion, DatosCliente } from "@/types/cotizacion";
import { calcularTotales } from "@/lib/cotizacion/calculos";
import { formatoSoles } from "@/lib/utils";
import { guardarCotizacionAccion } from "@/app/acciones";
import { descargarExcel } from "@/services/excel-navegador";
import { nombreBase } from "@/lib/excel/generar-excel";
import { useNombreArchivo } from "./DialogoNombreArchivo";
import TablaAmbientes from "./TablaAmbientes";
import ResumenTotales from "./ResumenTotales";
import CampoNumero from "./CampoNumero";

interface Props {
  inicial: Cotizacion;
  clientes: DatosCliente[];
  /** Mensaje opcional al abrir (p. ej. "Copia de COT-000012"). */
  aviso?: string;
}

type Mensaje = { tipo: "ok" | "error" | "info"; texto: string } | null;

const CAMPOS_CLIENTE: { campo: keyof DatosCliente; texto: string; tipo?: string; ancho?: string }[] = [
  { campo: "nombre", texto: "Nombre" },
  { campo: "empresa", texto: "Empresa" },
  { campo: "documento", texto: "RUC / DNI" },
  { campo: "telefono", texto: "Teléfono", tipo: "tel" },
  { campo: "direccion", texto: "Dirección", ancho: "sm:col-span-2" },
  { campo: "email", texto: "Email", tipo: "email", ancho: "sm:col-span-2" },
];

const CAMPOS_CONDICIONES: { campo: keyof Condiciones; texto: string }[] = [
  { campo: "entrega", texto: "Tiempo de entrega" },
  { campo: "cuota", texto: "Cuota de separación" },
  { campo: "incluye", texto: "Incluye" },
  { campo: "entregable", texto: "El entregable incluye" },
  { campo: "nota", texto: "Nota final (en rojo)" },
];

export default function EditorCotizacion({ inicial, clientes, aviso }: Props) {
  const [cot, setCot] = useState<Cotizacion>(inicial);
  const [sucio, setSucio] = useState(!inicial.id);
  const [ocupado, setOcupado] = useState<"guardar" | "excel" | "pdf" | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje>(aviso ? { tipo: "info", texto: aviso } : null);

  const totales = useMemo(() => calcularTotales(cot), [cot]);
  const { pedirNombre, dialogo } = useNombreArchivo();

  useEffect(() => {
    if (!sucio) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sucio]);

  function cambiar(cambios: Partial<Cotizacion>) {
    setCot((c) => ({ ...c, ...cambios }));
    setSucio(true);
  }

  function cambiarCliente(campo: keyof DatosCliente, valor: string) {
    let cliente = { ...cot.cliente, [campo]: valor };
    // Autocompletar con un cliente anterior al elegir su nombre (solo llena campos vacíos).
    if (campo === "nombre") {
      const previo = clientes.find((c) => c.nombre.toLowerCase() === valor.trim().toLowerCase());
      if (previo) {
        cliente = Object.fromEntries(
          Object.entries(cliente).map(([k, v]) => [k, v || previo[k as keyof DatosCliente]]),
        ) as unknown as DatosCliente;
      }
    }
    cambiar({ cliente });
  }

  async function guardar(): Promise<Cotizacion | null> {
    setOcupado("guardar");
    setMensaje(null);
    try {
      const r = await guardarCotizacionAccion(cot);
      if (!r.ok) {
        setMensaje({ tipo: "error", texto: r.error });
        return null;
      }
      const guardada = { ...cot, ...r.datos };
      setCot((c) => ({ ...c, ...r.datos }));
      setSucio(false);
      if (!cot.id) window.history.replaceState(null, "", `/cotizaciones/${r.datos.id}`);
      setMensaje({ tipo: "ok", texto: `Cotización ${r.datos.numero} guardada.` });
      return guardada;
    } catch (e) {
      setMensaje({ tipo: "error", texto: `No se pudo guardar: ${(e as Error).message}` });
      return null;
    } finally {
      setOcupado(null);
    }
  }

  async function descargar(formato: "excel" | "pdf") {
    // El número de cotización se asigna al guardar, por eso primero se guardan los cambios.
    const c = sucio || !cot.id ? await guardar() : cot;
    if (!c) return;
    const nombreArchivo = await pedirNombre(nombreBase(c), formato);
    if (nombreArchivo === null) return; // cancelado
    const nombre = formato === "excel" ? "Excel" : "PDF";
    setOcupado(formato);
    try {
      if (formato === "excel") await descargarExcel(c, nombreArchivo);
      else await (await import("@/services/pdf-navegador")).descargarPdf(c, nombreArchivo);
      setMensaje({ tipo: "ok", texto: `${nombre} de ${c.numero} generado.` });
    } catch (e) {
      setMensaje({ tipo: "error", texto: `No se pudo generar el ${nombre}: ${(e as Error).message}` });
    } finally {
      setOcupado(null);
    }
  }

  const botones = (
    <>
      <button type="button" className="btn-secundario flex-1" onClick={guardar} disabled={ocupado !== null}>
        {ocupado === "guardar" ? "Guardando…" : <Etiqueta corta="Guardar" larga="Guardar cotización" />}
      </button>
      <button type="button" className="btn-primario flex-1" onClick={() => descargar("excel")} disabled={ocupado !== null}>
        {ocupado === "excel" ? "Generando…" : <Etiqueta corta="Excel" larga="Generar Excel" />}
      </button>
      <button type="button" className="btn-primario flex-1" onClick={() => descargar("pdf")} disabled={ocupado !== null}>
        {ocupado === "pdf" ? "Generando…" : <Etiqueta corta="PDF" larga="Descargar PDF" />}
      </button>
    </>
  );

  return (
    <div className="pb-28 lg:pb-0">
      {dialogo}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cot.numero ? `Cotización ${cot.numero}` : "Nueva cotización"}</h1>
          <p className="text-sm text-stone-500">Cotización de diseño integral</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            sucio ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {sucio ? "Cambios sin guardar" : "Guardada"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="tarjeta">
            <h2 className="titulo-seccion">Información de la cotización</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="etiqueta">Número</span>
                <div className={`campo bg-stone-50 ${cot.numero ? "font-semibold text-stone-900" : "text-stone-400"}`}>{cot.numero ?? "Se asigna al guardar"}</div>
              </div>
              <div>
                <label className="etiqueta" htmlFor="fecha">
                  Fecha de cotización
                </label>
                <input id="fecha" type="date" className="campo" value={cot.fecha} onChange={(e) => cambiar({ fecha: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="vence">
                  F. Vence (vigencia)
                </label>
                <input id="vence" type="date" className="campo" value={cot.fechaVence} onChange={(e) => cambiar({ fechaVence: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="arq">
                  Arquitecto/a
                </label>
                <input
                  id="arq"
                  className="campo"
                  value={cot.arquitecto.nombre}
                  onChange={(e) => cambiar({ arquitecto: { ...cot.arquitecto, nombre: e.target.value } })}
                />
              </div>
              <div>
                <label className="etiqueta" htmlFor="arq-tel">
                  Teléfono arquitecto/a
                </label>
                <input
                  id="arq-tel"
                  type="tel"
                  className="campo"
                  value={cot.arquitecto.telefono}
                  onChange={(e) => cambiar({ arquitecto: { ...cot.arquitecto, telefono: e.target.value } })}
                />
              </div>
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="titulo-seccion">Cliente</h2>
            <datalist id="clientes-anteriores">
              {clientes.map((c) => (
                <option key={`${c.nombre}|${c.empresa}`} value={c.nombre}>
                  {c.empresa}
                </option>
              ))}
            </datalist>
            <div className="grid gap-4 sm:grid-cols-2">
              {CAMPOS_CLIENTE.map(({ campo, texto, tipo, ancho }) => (
                <div key={campo} className={ancho}>
                  <label className="etiqueta" htmlFor={`cli-${campo}`}>
                    {texto}
                  </label>
                  <input
                    id={`cli-${campo}`}
                    type={tipo ?? "text"}
                    list={campo === "nombre" ? "clientes-anteriores" : undefined}
                    autoComplete="off"
                    className="campo"
                    value={cot.cliente[campo]}
                    onChange={(e) => cambiarCliente(campo, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="titulo-seccion">Ambientes</h2>
            <TablaAmbientes items={cot.items} costos={totales.costos} onCambio={(items) => cambiar({ items })} />
          </section>

          <section className="tarjeta">
            <h2 className="titulo-seccion">Consideraciones</h2>
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="etiqueta" htmlFor="pct-adelanto">
                  % cierre de contrato
                </label>
                <CampoNumero id="pct-adelanto" factor={100} valor={cot.pctAdelanto} onCambio={(pctAdelanto) => cambiar({ pctAdelanto })} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="pct-saldo">
                  % antes de entregables
                </label>
                <CampoNumero id="pct-saldo" factor={100} valor={cot.pctSaldo} onCambio={(pctSaldo) => cambiar({ pctSaldo })} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="lista">
                  Precio de lista por m² (referencia)
                </label>
                <CampoNumero id="lista" valor={cot.precioListaM2} onCambio={(precioListaM2) => cambiar({ precioListaM2 })} />
              </div>
            </div>
            {Math.abs(cot.pctAdelanto + cot.pctSaldo - 1) > 1e-6 && (
              <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                Los porcentajes de pago suman {Math.round((cot.pctAdelanto + cot.pctSaldo) * 1000) / 10}% (no 100%).
              </p>
            )}
            <div className="space-y-3">
              {CAMPOS_CONDICIONES.map(({ campo, texto }) => (
                <div key={campo}>
                  <label className="etiqueta" htmlFor={`cond-${campo}`}>
                    {texto}
                  </label>
                  <textarea
                    id={`cond-${campo}`}
                    rows={2}
                    className={`campo ${campo === "nota" ? "text-red-700" : ""}`}
                    value={cot.condiciones[campo]}
                    onChange={(e) => cambiar({ condiciones: { ...cot.condiciones, [campo]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <section className="tarjeta space-y-5">
            <h2 className="titulo-seccion !mb-0">Resumen</h2>
            <ResumenTotales totales={totales} pctAdelanto={cot.pctAdelanto} pctSaldo={cot.pctSaldo} precioListaM2={cot.precioListaM2} />
            <div className="hidden flex-col gap-2 lg:flex">{botones}</div>
            {mensaje && <Aviso mensaje={mensaje} />}
          </section>
        </aside>
      </div>

      {/* Barra inferior en móvil */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {mensaje && (
          <div className="mb-2">
            <Aviso mensaje={mensaje} />
          </div>
        )}
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-stone-500">Total con IGV</span>
          <span className="text-lg font-semibold tabular-nums">{formatoSoles(totales.total)}</span>
        </div>
        <div className="flex gap-2">{botones}</div>
      </div>
    </div>
  );
}

/** Texto corto en la barra móvil y completo en escritorio. */
function Etiqueta({ corta, larga }: { corta: string; larga: string }) {
  return (
    <>
      <span className="lg:hidden">{corta}</span>
      <span className="hidden lg:inline">{larga}</span>
    </>
  );
}

function Aviso({ mensaje }: { mensaje: NonNullable<Mensaje> }) {
  const estilos = {
    ok: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    error: "bg-red-50 text-red-800 ring-red-200",
    info: "bg-sky-50 text-sky-800 ring-sky-200",
  };
  return (
    <p role="status" className={`rounded-lg px-3 py-2 text-sm ring-1 ${estilos[mensaje.tipo]}`}>
      {mensaje.texto}
    </p>
  );
}
