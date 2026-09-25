// Prueba del generador: reproduce la cotización del Excel original y casos con más/menos ítems.
// Uso: npx tsx scripts/probar-excel.mts [carpetaSalida]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import JSZip from "jszip";
import { generarExcel, nombreArchivo } from "../src/lib/excel/generar-excel";
import { calcularTotales } from "../src/lib/cotizacion/calculos";
import { CONDICIONES_DEFECTO, descripcionDefecto } from "../src/lib/cotizacion/constantes";
import type { Cotizacion } from "../src/types/cotizacion";

const salida = process.argv[2] ?? "salida-pruebas";
await mkdir(salida, { recursive: true });

const plantilla = await readFile("public/plantilla-cotizacion.xlsx");
const original = await JSZip.loadAsync(await readFile("COTIZACIÓN DE DISEÑO_LUCERO GODOY - copia.xlsx"));
const png = async (n: number) =>
  `data:image/png;base64,${Buffer.from(await original.file(`xl/media/image${n}.png`)!.async("uint8array")).toString("base64")}`;

const base: Cotizacion = {
  id: null,
  numero: "COT-000001",
  fecha: "2026-08-11",
  fechaVence: "2026-08-11",
  cliente: { nombre: "Lucero Godoy", empresa: "", documento: "", direccion: "⁠Calle Hermanos Quinteros 248, Surco", telefono: " 966 306 150", email: "" },
  arquitecto: { nombre: "Fabiana Alvarez", telefono: " 948 323 458" },
  precioListaM2: 80,
  pctAdelanto: 0.8,
  pctSaldo: 0.2,
  condiciones: CONDICIONES_DEFECTO,
  items: [
    { key: "1", ambiente: "DORMITORIO", descripcion: descripcionDefecto("11.98 "), area: 11.98, precioM2: 75, imagen: await png(7) },
    { key: "2", ambiente: "SALA COMEDOR / COCINA ", descripcion: descripcionDefecto("20 m2    / 6.17"), area: 25, precioM2: 75, imagen: await png(6) },
    { key: "3", ambiente: "SALA ESTAR ", descripcion: descripcionDefecto("7.22 "), area: 7.22, precioM2: 75, imagen: await png(5) },
    { key: "4", ambiente: "PASILLO", descripcion: descripcionDefecto("13"), area: 13, precioM2: 75, imagen: await png(4) },
    { key: "5", ambiente: "LAVANDERIA / BAÑO", descripcion: descripcionDefecto("9.78"), area: 4.9, precioM2: 75, imagen: await png(3) },
  ],
};

const t = calcularTotales(base);
const esperado = { subtotal: 4657.5, igv: 838.35, total: 5495.85, adelanto: 4396.68, saldo: 1099.17, listaSubtotal: 4968 };
const r2 = (n: number) => Math.round(n * 100) / 100;
const obtenido = { subtotal: r2(t.subtotal), igv: r2(t.igv), total: r2(t.total), adelanto: r2(t.adelanto), saldo: r2(t.saldo), listaSubtotal: r2(t.lista.subtotal) };
const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
console.log(ok ? "✔ Cálculos idénticos al Excel original" : "✘ Diferencias en cálculos", obtenido);
if (!ok) process.exitCode = 1;

const casos: [string, Cotizacion][] = [
  ["5-items", base],
  ["2-items", { ...base, numero: "COT-000002", cliente: { ...base.cliente, empresa: "Empresa ABC S.A.C.", documento: "20123456789" }, items: base.items.slice(0, 2) }],
  ["8-items", { ...base, numero: "COT-000003", items: [...base.items, ...base.items.slice(0, 3).map((it, i) => ({ ...it, key: `x${i}`, imagen: i === 1 ? null : it.imagen }))] }],
];
for (const [nombre, cot] of casos) {
  const bytes = await generarExcel(plantilla, cot);
  const ruta = `${salida}/${nombre}__${nombreArchivo(cot)}`;
  await writeFile(ruta, bytes);
  console.log(`✔ ${ruta} (${(bytes.length / 1024).toFixed(0)} KB)`);
}
