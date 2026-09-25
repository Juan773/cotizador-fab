// Genera public/plantilla-cotizacion.xlsx a partir del Excel original.
// El original NO se modifica. Solo se eliminan elementos que no se ven:
//  - 36.722 "AutoShape" invisibles (sin relleno ni borde) pegados desde una web,
//    que inflaban drawing1.xml a 37 MB.
//  - calcChain.xml (caché de cálculo; Excel lo reconstruye) + recálculo al abrir.
// Uso: node scripts/preparar-plantilla.mjs
import { readFile, writeFile } from "node:fs/promises";
import JSZip from "jszip";

const ORIGEN = "COTIZACIÓN DE DISEÑO_LUCERO GODOY - copia.xlsx";
const DESTINO = "public/plantilla-cotizacion.xlsx";

const zip = await JSZip.loadAsync(await readFile(ORIGEN));

const drawingPath = "xl/drawings/drawing1.xml";
const drawing = await zip.file(drawingPath).async("string");
let eliminadas = 0;
const limpio = drawing.replace(
  /<xdr:(twoCellAnchor|oneCellAnchor|absoluteAnchor)\b(?:(?!<\/xdr:\1>)[\s\S])*<\/xdr:\1>/g,
  (anchor) => {
    if (/<xdr:cNvPr [^>]*name="AutoShape \d+"/.test(anchor) && /<a:noFill\/>/.test(anchor)) {
      eliminadas++;
      return "";
    }
    return anchor;
  },
);
// Planos de ejemplo del cliente original (filas 20-24): se quitan de la plantilla pública.
let rels = await zip.file("xl/drawings/_rels/drawing1.xml.rels").async("string");
let planosQuitados = 0;
const sinPlanos = limpio.replace(/<xdr:twoCellAnchor\b(?:(?!<\/xdr:twoCellAnchor>)[\s\S])*<\/xdr:twoCellAnchor>/g, (anchor) => {
  const fila = Number(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/.exec(anchor)[1]) + 1;
  const rid = /r:embed="([^"]+)"/.exec(anchor)?.[1];
  if (!rid || fila < 20 || fila > 24) return anchor;
  const rel = new RegExp(`<Relationship Id="${rid}"[^>]*Target="\\.\\./media/([^"]+)"/>`).exec(rels);
  if (rel) {
    zip.remove(`xl/media/${rel[1]}`);
    rels = rels.replace(rel[0], "");
  }
  planosQuitados++;
  return "";
});
zip.file(drawingPath, sinPlanos);
zip.file("xl/drawings/_rels/drawing1.xml.rels", rels);

// Datos personales del cliente original: se vacían (esas celdas siempre se sobrescriben al generar).
const PRIVADOS = ["Lucero Godoy", "⁠Calle Hermanos Quinteros 248, Surco", " 966 306 150"];
let ss = await zip.file("xl/sharedStrings.xml").async("string");
ss = ss.replace(/<si>(?:(?!<\/si>)[\s\S])*<\/si>/g, (si) => (PRIVADOS.some((t) => si.includes(t)) ? "<si><t></t></si>" : si));
if (PRIVADOS.some((t) => ss.includes(t))) throw new Error("No se pudieron vaciar los datos del cliente original.");
zip.file("xl/sharedStrings.xml", ss);

zip.remove("xl/calcChain.xml");
const ct = await zip.file("[Content_Types].xml").async("string");
zip.file("[Content_Types].xml", ct.replace(/<Override PartName="\/xl\/calcChain\.xml"[^>]*\/>/, ""));
const relsLibro = await zip.file("xl/_rels/workbook.xml.rels").async("string");
zip.file("xl/_rels/workbook.xml.rels", relsLibro.replace(/<Relationship [^>]*Target="calcChain\.xml"\/>/, ""));
const wb = await zip.file("xl/workbook.xml").async("string");
zip.file(
  "xl/workbook.xml",
  wb
    .replace(/<calcPr ([^>]*?)\/>/, '<calcPr $1 fullCalcOnLoad="1"/>')
    // Ruta local del autor (incluía el nombre del cliente).
    .replace(/<mc:AlternateContent\b(?:(?!<\/mc:AlternateContent>)[\s\S])*x15ac:absPath(?:(?!<\/mc:AlternateContent>)[\s\S])*<\/mc:AlternateContent>/, ""),
);

const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
await writeFile(DESTINO, out);
console.log(`AutoShapes invisibles eliminadas: ${eliminadas}`);
console.log(`Planos de ejemplo eliminados: ${planosQuitados}`);
console.log(`drawing1.xml: ${(drawing.length / 1e6).toFixed(1)} MB -> ${(limpio.length / 1e3).toFixed(1)} KB`);
console.log(`${DESTINO}: ${(out.length / 1024).toFixed(0)} KB`);
