"use client";

import type { ItemCotizacion } from "@/types/cotizacion";
import { itemNuevo } from "@/lib/cotizacion/nueva";
import { formatoSoles, nuevaClave } from "@/lib/utils";
import CampoNumero from "./CampoNumero";
import SelectorImagen from "./SelectorImagen";

interface Props {
  items: ItemCotizacion[];
  costos: number[];
  onCambio: (items: ItemCotizacion[]) => void;
}

const AMBIENTES_SUGERIDOS = ["DORMITORIO", "DORMITORIO PRINCIPAL", "SALA COMEDOR / COCINA", "SALA ESTAR", "COCINA", "PASILLO", "LAVANDERIA / BAÑO", "BAÑO", "ESTUDIO", "TERRAZA"];

/** Si la descripción tiene la línea "AREA: <número> m2", se mantiene sincronizada con el área. */
function sincronizarArea(descripcion: string, area: number) {
  return descripcion.replace(/^AREA:[ \t]*[\d.,]*[ \t]*m2[ \t]*$/m, `AREA: ${area || ""} m2`);
}

export default function TablaAmbientes({ items, costos, onCambio }: Props) {
  const actualizar = (i: number, cambios: Partial<ItemCotizacion>) =>
    onCambio(items.map((it, j) => (j === i ? { ...it, ...cambios } : it)));

  const mover = (i: number, dir: -1 | 1) => {
    const copia = [...items];
    [copia[i], copia[i + dir]] = [copia[i + dir], copia[i]];
    onCambio(copia);
  };

  return (
    <div className="space-y-4">
      <datalist id="ambientes-sugeridos">
        {AMBIENTES_SUGERIDOS.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      {items.map((it, i) => (
        <div key={it.key} className="rounded-xl border border-stone-200 bg-stone-50/60">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-crema text-xs font-bold text-stone-800 ring-1 ring-amber-200">
              {i + 1}
            </span>
            <div className="flex items-center">
              <button type="button" className="btn-icono" title="Subir" onClick={() => mover(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button type="button" className="btn-icono" title="Bajar" onClick={() => mover(i, 1)} disabled={i === items.length - 1}>
                ↓
              </button>
              <button
                type="button"
                className="btn-icono"
                title="Duplicar fila"
                onClick={() => onCambio([...items.slice(0, i + 1), { ...it, key: nuevaClave() }, ...items.slice(i + 1)])}
              >
                ⧉
              </button>
              <button
                type="button"
                className="btn-icono hover:bg-red-50 hover:text-red-600"
                title="Eliminar fila"
                onClick={() => onCambio(items.filter((_, j) => j !== i))}
                disabled={items.length === 1}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px_200px]">
            <div className="space-y-3">
              <div>
                <label className="etiqueta" htmlFor={`amb-${it.key}`}>
                  Ambiente
                </label>
                <input
                  id={`amb-${it.key}`}
                  list="ambientes-sugeridos"
                  className="campo font-semibold uppercase"
                  placeholder="DORMITORIO"
                  value={it.ambiente}
                  onChange={(e) => actualizar(i, { ambiente: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="etiqueta" htmlFor={`desc-${it.key}`}>
                  Descripción
                </label>
                <textarea
                  id={`desc-${it.key}`}
                  className="campo min-h-40 leading-relaxed"
                  value={it.descripcion}
                  onChange={(e) => actualizar(i, { descripcion: e.target.value })}
                />
              </div>
            </div>

            <div>
              <span className="etiqueta">Planta de distribución</span>
              <SelectorImagen imagen={it.imagen} onCambio={(imagen) => actualizar(i, { imagen })} />
            </div>

            <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
              <div>
                <label className="etiqueta" htmlFor={`area-${it.key}`}>
                  Área (m²)
                </label>
                <CampoNumero
                  id={`area-${it.key}`}
                  valor={it.area}
                  onCambio={(area) => actualizar(i, { area, descripcion: sincronizarArea(it.descripcion, area) })}
                />
              </div>
              <div>
                <label className="etiqueta" htmlFor={`precio-${it.key}`}>
                  Precio por m² (S/)
                </label>
                <CampoNumero id={`precio-${it.key}`} valor={it.precioM2} onCambio={(precioM2) => actualizar(i, { precioM2 })} />
              </div>
              <div className="col-span-2 rounded-lg bg-white px-3 py-2 ring-1 ring-stone-200 lg:col-span-1">
                <div className="text-xs text-stone-500">Costo individual</div>
                <div className="text-lg font-semibold tabular-nums">{formatoSoles(costos[i] ?? 0)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn w-full border-2 border-dashed border-stone-300 py-3 text-stone-600 hover:border-stone-500 hover:text-stone-900"
        onClick={() => onCambio([...items, itemNuevo(items.at(-1)?.precioM2)])}
      >
        ＋ Agregar ambiente
      </button>
    </div>
  );
}
