/**
 * Genera la cotización a partir de public/plantilla-cotizacion.xlsx editando
 * directamente el XML de la hoja (sheet1.xml) y de sus dibujos (drawing1.xml).
 *
 * Por qué no ExcelJS: al reescribir el libro descarta los rectángulos
 * redondeados, la imagen EMF de las cuentas bancarias y la configuración de
 * impresora. Aquí todo lo que no se toca queda byte a byte igual a la plantilla
 * (estilos, tema, logo, bordes, colores, anchos, impresión).
 *
 * Funciona igual en el navegador y en Node (solo usa JSZip y strings).
 */
import JSZip from "jszip";
import type { Cotizacion } from "@/types/cotizacion";
import { calcularTotales } from "@/lib/cotizacion/calculos";

const HOJA = "xl/worksheets/sheet1.xml";
const DIBUJO = "xl/drawings/drawing1.xml";
const DIBUJO_RELS = "xl/drawings/_rels/drawing1.xml.rels";

/** Filas de ítems en la plantilla: 20..24 (5 ítems). */
const PRIMERA_FILA_ITEM = 20;
const ULTIMA_FILA_ITEM_PLANTILLA = 24;
const ALTO_FILA_ITEM = 208.5;

/** Recuadro de la planta de distribución: columnas H, I, J. */
const COL_PLANTA = 7; // H (base 0)
const ANCHOS_PLANTA = [30.140625, 54.140625, 33.42578125]; // <cols> de la plantilla
const EMU_POR_PX = 9525;
const EMU_POR_PT = 12700;
const MARGEN_IMAGEN_PX = 10;

export async function generarExcel(plantilla: ArrayBuffer | Uint8Array, cot: Cotizacion): Promise<Uint8Array> {
  if (cot.items.length === 0) throw new Error("La cotización no tiene ambientes.");

  const zip = await JSZip.loadAsync(plantilla);
  const t = calcularTotales(cot);
  const n = cot.items.length;
  const ultimaFila = PRIMERA_FILA_ITEM + n - 1;
  /** Desplazamiento del pie (fila 25 en adelante) según la cantidad de ítems. */
  const d = ultimaFila - ULTIMA_FILA_ITEM_PLANTILLA;

  // ---------- Hoja ----------
  const hoja = await leer(zip, HOJA);
  const iniData = hoja.indexOf("<sheetData>") + "<sheetData>".length;
  const finData = hoja.indexOf("</sheetData>");
  const filas = new Map<number, string>();
  for (const m of hoja.slice(iniData, finData).matchAll(/<row r="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g)) {
    filas.set(Number(m[1]), m[0]);
  }

  // Encabezado
  // J3/K3 están vacías en la plantilla: se usan para el N° de cotización con el estilo de J4/K4.
  const estiloEtiqueta = estiloDe(filas.get(4)!, "J4");
  const estiloValor = estiloDe(filas.get(4)!, "K4");
  editar(filas, 3, (f) => {
    f = setCelda(f, "J3", "N° Cotización:", estiloEtiqueta);
    return setCelda(f, "K3", cot.numero ?? "BORRADOR", estiloValor);
  });
  editar(filas, 4, (f) => setCelda(f, "K4", serialExcel(cot.fecha)));
  editar(filas, 5, (f) => setCelda(f, "K5", serialExcel(cot.fechaVence)));

  // Cliente y arquitecto/a
  editar(filas, 12, (f) => setCelda(setCelda(f, "D12", cot.cliente.nombre), "H12", cot.arquitecto.nombre));
  editar(filas, 13, (f) => setCelda(setCelda(f, "D13", empresaConDocumento(cot)), "H13", cot.arquitecto.telefono));
  editar(filas, 14, (f) => setCelda(f, "D14", cot.cliente.direccion));
  editar(filas, 15, (f) => setCelda(f, "D15", cot.cliente.telefono));
  editar(filas, 16, (f) => setCelda(f, "D16", cot.cliente.email));

  // Ítems: se clona la fila 20 (prototipo) una vez por ambiente.
  const prototipo = filas.get(PRIMERA_FILA_ITEM)!;
  const filasItems = cot.items.map((it, i) => {
    const r = PRIMERA_FILA_ITEM + i;
    let f = renumerarFila(prototipo, PRIMERA_FILA_ITEM, r);
    f = f.replace(/ ht="[\d.]+"/, ` ht="${altoFilaItem(it.descripcion)}"`);
    f = setCelda(f, `B${r}`, i + 1);
    f = setCelda(f, `C${r}`, it.ambiente);
    f = setCelda(f, `D${r}`, textoDescripcion(it.descripcion));
    f = setCelda(f, `K${r}`, { f: `+N${r}*O${r}`, v: t.costos[i] });
    f = setCelda(f, `N${r}`, it.area);
    f = setCelda(f, `O${r}`, it.precioM2);
    f = setCelda(f, `R${r}`, { f: `+S${r}*T${r}`, v: it.area * cot.precioListaM2 });
    f = setCelda(f, `S${r}`, it.area);
    f = setCelda(f, `T${r}`, cot.precioListaM2);
    f = setCelda(f, `W${r}`, { f: `+X${r}*Y${r}`, v: t.costos[i] });
    f = setCelda(f, `X${r}`, it.area);
    f = setCelda(f, `Y${r}`, it.precioM2);
    return f;
  });

  // Pie (fila 25 en adelante): se desplaza y se actualizan valores.
  const pie: string[] = [];
  for (const [r, f] of [...filas].filter(([r]) => r > ULTIMA_FILA_ITEM_PLANTILLA).sort((a, b) => a[0] - b[0])) {
    let x = renumerarFila(f, r, r + d);
    x = x.replace(/<f>([^<]*)<\/f>/g, (_, fx: string) => `<f>${desplazarFormula(fx, d, ultimaFila)}</f>`);
    pie.push(x);
  }
  const fp = (r: number) => r + d; // fila del pie ya desplazada
  const valoresPie: [string, number][] = [
    [`K${fp(25)}`, t.subtotal],
    [`R${fp(25)}`, t.lista.subtotal],
    [`W${fp(25)}`, t.subtotal],
    [`K${fp(26)}`, t.igv],
    [`R${fp(26)}`, t.lista.igv],
    [`W${fp(26)}`, t.igv],
    [`K${fp(27)}`, t.total],
    [`R${fp(27)}`, t.lista.total],
    [`W${fp(27)}`, t.total],
    [`K${fp(30)}`, t.adelanto],
    [`K${fp(31)}`, t.saldo],
  ];
  const textosPie: [string, ValorCelda][] = [
    [`B${fp(29)}`, textoConEtiqueta(cot.condiciones.entrega)],
    [`B${fp(30)}`, textoConEtiqueta(cot.condiciones.cuota)],
    [`J${fp(30)}`, cot.pctAdelanto],
    [`B${fp(31)}`, textoConEtiqueta(cot.condiciones.incluye)],
    [`J${fp(31)}`, cot.pctSaldo],
    [`B${fp(32)}`, textoConEtiqueta(cot.condiciones.entregable)],
    [`B${fp(33)}`, cot.condiciones.nota],
  ];
  for (let i = 0; i < pie.length; i++) {
    for (const [ref, v] of valoresPie) if (filaDe(ref) === filaDeXml(pie[i])) pie[i] = setValorFormula(pie[i], ref, v);
    for (const [ref, v] of textosPie) if (filaDe(ref) === filaDeXml(pie[i])) pie[i] = setCelda(pie[i], ref, v);
  }

  const encabezado = [...filas].filter(([r]) => r < PRIMERA_FILA_ITEM).sort((a, b) => a[0] - b[0]).map(([, f]) => f);
  let nuevaHoja = hoja.slice(0, iniData) + [...encabezado, ...filasItems, ...pie].join("") + hoja.slice(finData);

  // Celdas combinadas: se quitan las de los ítems originales, se desplazan las del pie y se agrega D:G por ítem.
  nuevaHoja = nuevaHoja.replace(/<mergeCells count="\d+">([\s\S]*?)<\/mergeCells>/, (_, cuerpo: string) => {
    const refs = [...cuerpo.matchAll(/<mergeCell ref="([^"]+)"\/>/g)].map((m) => m[1]);
    const resultado: string[] = [];
    for (const ref of refs) {
      const [a, b] = ref.split(":");
      const r1 = filaDe(a);
      if (r1 >= PRIMERA_FILA_ITEM && r1 <= ULTIMA_FILA_ITEM_PLANTILLA) continue;
      resultado.push(r1 > ULTIMA_FILA_ITEM_PLANTILLA ? `${moverRef(a, d)}:${moverRef(b, d)}` : ref);
    }
    for (let r = PRIMERA_FILA_ITEM; r <= ultimaFila; r++) resultado.push(`D${r}:G${r}`);
    return `<mergeCells count="${resultado.length}">${resultado.map((r) => `<mergeCell ref="${r}"/>`).join("")}</mergeCells>`;
  });
  nuevaHoja = nuevaHoja.replace(/<dimension ref="([A-Z]+\d+):([A-Z]+)(\d+)"\/>/, (_, a, c, r) => `<dimension ref="${a}:${c}${Number(r) + d}"/>`);
  nuevaHoja = nuevaHoja.replace(/<selection [^>]*\/>/, '<selection activeCell="A1" sqref="A1"/>');
  zip.file(HOJA, nuevaHoja);

  // Área de impresión A1:L42 -> se extiende/reduce con el pie.
  const libro = await leer(zip, "xl/workbook.xml");
  zip.file(
    "xl/workbook.xml",
    libro.replace(/(<definedName name="_xlnm\.Print_Area"[^>]*>[^<]*?\$L\$)(\d+)/, (_, a, r) => `${a}${Number(r) + d}`),
  );

  // ---------- Dibujos ----------
  await actualizarDibujos(zip, cot, d);

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export function nombreArchivo(cot: Cotizacion): string {
  const cliente = slug(cot.cliente.empresa || cot.cliente.nombre) || "CLIENTE";
  return `${cot.numero ?? "BORRADOR"}-${cliente}.xlsx`;
}

// ============================================================================
// Dibujos: plantas de distribución y desplazamiento de formas del pie
// ============================================================================

async function actualizarDibujos(zip: JSZip, cot: Cotizacion, d: number) {
  let dibujo = await leer(zip, DIBUJO);
  let rels = await leer(zip, DIBUJO_RELS);
  let tipos = await leer(zip, "[Content_Types].xml");

  dibujo = dibujo.replace(/<xdr:(twoCellAnchor|oneCellAnchor)\b(?:(?!<\/xdr:\1>)[\s\S])*<\/xdr:\1>/g, (ancla) => {
    const filaDesde = Number(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/.exec(ancla)![1]) + 1; // a base 1
    if (filaDesde >= PRIMERA_FILA_ITEM && filaDesde <= ULTIMA_FILA_ITEM_PLANTILLA && ancla.includes("<xdr:pic>")) {
      // Plantas de ejemplo de la plantilla: se eliminan (y su imagen).
      const rid = /r:embed="([^"]+)"/.exec(ancla)?.[1];
      if (rid) {
        const rel = new RegExp(`<Relationship Id="${rid}"[^>]*Target="\\.\\./media/([^"]+)"/>`).exec(rels);
        if (rel) {
          zip.remove(`xl/media/${rel[1]}`);
          rels = rels.replace(rel[0], "");
        }
      }
      return "";
    }
    if (filaDesde > ULTIMA_FILA_ITEM_PLANTILLA) {
      // Formas del pie (recuadro y cuentas bancarias): se desplazan con las filas.
      return ancla.replace(/<xdr:row>(\d+)<\/xdr:row>/g, (_, r) => `<xdr:row>${Number(r) + d}</xdr:row>`);
    }
    return ancla;
  });

  let anclas = "";
  cot.items.forEach((it, i) => {
    if (!it.imagen) return;
    const img = decodificarImagen(it.imagen);
    if (!img) return;
    const nombre = `planta${i + 1}.${img.ext}`;
    const rid = `rIdPlanta${i + 1}`;
    zip.file(`xl/media/${nombre}`, img.bytes);
    rels = rels.replace("</Relationships>", `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${nombre}"/></Relationships>`);
    if (!new RegExp(`<Default Extension="${img.ext}"`, "i").test(tipos)) {
      tipos = tipos.replace("<Default ", `<Default Extension="${img.ext}" ContentType="${img.mime}"/><Default `);
    }
    const fila = PRIMERA_FILA_ITEM + i - 1; // base 0
    anclas += anclaImagen(fila, altoFilaItem(it.descripcion), img.ancho, img.alto, rid, 90000 + i, `Planta ${i + 1}`);
  });
  dibujo = dibujo.replace("</xdr:wsDr>", `${anclas}</xdr:wsDr>`);

  zip.file(DIBUJO, dibujo);
  zip.file(DIBUJO_RELS, rels);
  zip.file("[Content_Types].xml", tipos);
}

/** Imagen centrada y proporcional dentro del recuadro H:J de la fila. */
function anclaImagen(fila0: number, altoPt: number, anchoPx: number, altoPx: number, rid: string, id: number, nombre: string) {
  const colsEmu = ANCHOS_PLANTA.map((w) => anchoColumnaPx(w) * EMU_POR_PX);
  const cajaAncho = colsEmu.reduce((a, b) => a + b, 0);
  const cajaAlto = altoPt * EMU_POR_PT;
  const margen = MARGEN_IMAGEN_PX * EMU_POR_PX;
  const escala = Math.min((cajaAncho - 2 * margen) / (anchoPx * EMU_POR_PX), (cajaAlto - 2 * margen) / (altoPx * EMU_POR_PX));
  const w = Math.round(anchoPx * EMU_POR_PX * escala);
  const h = Math.round(altoPx * EMU_POR_PX * escala);
  const x = Math.round((cajaAncho - w) / 2);
  const y = Math.round((cajaAlto - h) / 2);

  const posCol = (off: number) => {
    let c = 0;
    while (c < colsEmu.length - 1 && off > colsEmu[c]) off -= colsEmu[c++];
    return { col: COL_PLANTA + c, off };
  };
  const desde = posCol(x);
  const hasta = posCol(x + w);
  return (
    `<xdr:twoCellAnchor editAs="oneCell">` +
    `<xdr:from><xdr:col>${desde.col}</xdr:col><xdr:colOff>${desde.off}</xdr:colOff><xdr:row>${fila0}</xdr:row><xdr:rowOff>${y}</xdr:rowOff></xdr:from>` +
    `<xdr:to><xdr:col>${hasta.col}</xdr:col><xdr:colOff>${hasta.off}</xdr:colOff><xdr:row>${fila0}</xdr:row><xdr:rowOff>${y + h}</xdr:rowOff></xdr:to>` +
    `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="${nombre}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>` +
    `<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
    `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic>` +
    `<xdr:clientData/></xdr:twoCellAnchor>`
  );
}

/** Conversión estándar de Excel de ancho de columna (caracteres) a píxeles, Calibri 11. */
function anchoColumnaPx(w: number) {
  return Math.trunc(((256 * w + Math.trunc(128 / 7)) / 256) * 7);
}

function decodificarImagen(dataUrl: string) {
  const m = /^data:(image\/(png|jpeg|jpg));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const bin = atob(m[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const dim = m[2] === "png" ? dimensionesPng(bytes) : dimensionesJpeg(bytes);
  if (!dim) return null;
  return { bytes, ext: m[2] === "png" ? "png" : "jpeg", mime: m[2] === "png" ? "image/png" : "image/jpeg", ...dim };
}

function dimensionesPng(b: Uint8Array) {
  if (b.length < 24) return null;
  const dv = new DataView(b.buffer, b.byteOffset);
  return { ancho: dv.getUint32(16), alto: dv.getUint32(20) };
}

function dimensionesJpeg(b: Uint8Array) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marca = b[i + 1];
    const largo = (b[i + 2] << 8) | b[i + 3];
    if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
      return { alto: (b[i + 5] << 8) | b[i + 6], ancho: (b[i + 7] << 8) | b[i + 8] };
    }
    i += 2 + largo;
  }
  return null;
}

// ============================================================================
// Utilidades de celdas / filas (sheetData)
// ============================================================================

type Tramo = { texto: string; negrita: boolean };
type ValorCelda = string | number | { f: string; v: number } | { tramos: Tramo[] };

/** Igual que la plantilla: la primera línea de la descripción en negrita. */
function textoDescripcion(texto: string): ValorCelda {
  const i = texto.indexOf("\n");
  if (i < 0) return { tramos: [{ texto, negrita: true }] };
  return { tramos: [{ texto: texto.slice(0, i), negrita: true }, { texto: texto.slice(i), negrita: false }] };
}

/** Igual que la plantilla: "ETIQUETA:" en negrita y el resto normal (B29:B32). */
function textoConEtiqueta(texto: string): ValorCelda {
  const i = texto.indexOf(":");
  if (i < 0) return texto;
  return { tramos: [{ texto: texto.slice(0, i + 1), negrita: true }, { texto: texto.slice(i + 1), negrita: false }] };
}

function xmlTramos(tramos: Tramo[]) {
  return tramos
    .filter((t) => t.texto)
    .map(
      (t) =>
        `<r><rPr>${t.negrita ? "<b/>" : ""}<sz val="11"/><color theme="1"/><rFont val="Calibri"/><family val="2"/><scheme val="minor"/></rPr>` +
        `<t xml:space="preserve">${escaparXml(t.texto)}</t></r>`,
    )
    .join("");
}

function editar(filas: Map<number, string>, r: number, fn: (f: string) => string) {
  filas.set(r, fn(filas.get(r)!));
}

function regexCelda(ref: string) {
  return new RegExp(`<c r="${ref}"(?=[ />])[^>]*?(?:/>|>[\\s\\S]*?</c>)`);
}

function estiloDe(fila: string, ref: string): string | undefined {
  return / s="(\d+)"/.exec(regexCelda(ref).exec(fila)?.[0] ?? "")?.[1];
}

/** Escribe el valor de una celda conservando su estilo (s="..."). */
function setCelda(fila: string, ref: string, valor: ValorCelda, estilo?: string): string {
  const actual = regexCelda(ref).exec(fila);
  const s = estilo ?? / s="(\d+)"/.exec(actual?.[0] ?? "")?.[1];
  const attrS = s ? ` s="${s}"` : "";
  let celda: string;
  if (typeof valor === "string") {
    celda = valor
      ? `<c r="${ref}"${attrS} t="inlineStr"><is><t xml:space="preserve">${escaparXml(valor)}</t></is></c>`
      : `<c r="${ref}"${attrS}/>`;
  } else if (typeof valor === "number") {
    celda = `<c r="${ref}"${attrS}><v>${numeroXml(valor)}</v></c>`;
  } else if ("tramos" in valor) {
    celda = `<c r="${ref}"${attrS} t="inlineStr"><is>${xmlTramos(valor.tramos)}</is></c>`;
  } else {
    celda = `<c r="${ref}"${attrS}><f>${valor.f}</f><v>${numeroXml(valor.v)}</v></c>`;
  }
  if (actual) return fila.replace(actual[0], celda);

  // La celda no existe: se inserta respetando el orden de columnas.
  const col = indiceColumna(ref);
  const celdas = [...fila.matchAll(/<c r="([A-Z]+)\d+"/g)];
  const siguiente = celdas.find((m) => indiceColumna(m[1]) > col);
  if (siguiente) return fila.slice(0, siguiente.index) + celda + fila.slice(siguiente.index);
  return fila.replace("</row>", `${celda}</row>`);
}

/** Actualiza solo el valor calculado (<v>) de una celda con fórmula. */
function setValorFormula(fila: string, ref: string, v: number): string {
  return fila.replace(regexCelda(ref), (c) => c.replace(/<v>[^<]*<\/v>/, `<v>${numeroXml(v)}</v>`));
}

function renumerarFila(fila: string, de: number, a: number): string {
  return fila
    .replace(new RegExp(`^<row r="${de}"`), `<row r="${a}"`)
    .replace(new RegExp(`<c r="([A-Z]+)${de}"`, "g"), `<c r="$1${a}"`);
}

/**
 * Ajusta una fórmula del pie al nuevo número de ítems:
 *  - referencias a filas >= 25 se desplazan d filas;
 *  - rangos X20:X24 pasan a X20:X{ultimaFila}.
 */
export function desplazarFormula(f: string, d: number, ultimaFila: number): string {
  return f
    .replace(/(\$?)([A-Z]{1,3})(\$?)(\d+)/g, (m, a, c, b, r) =>
      Number(r) > ULTIMA_FILA_ITEM_PLANTILLA ? `${a}${c}${b}${Number(r) + d}` : m,
    )
    .replace(
      new RegExp(`([A-Z]{1,3})${PRIMERA_FILA_ITEM}:([A-Z]{1,3})${ULTIMA_FILA_ITEM_PLANTILLA}\\b`, "g"),
      `$1${PRIMERA_FILA_ITEM}:$2${ultimaFila}`,
    );
}

function altoFilaItem(descripcion: string) {
  const lineas = descripcion.split("\n").length;
  return Math.max(ALTO_FILA_ITEM, lineas * 16 + 40);
}

function filaDe(ref: string) {
  return Number(/\d+/.exec(ref)![0]);
}

function filaDeXml(fila: string) {
  return Number(/^<row r="(\d+)"/.exec(fila)![1]);
}

function moverRef(ref: string, d: number) {
  return ref.replace(/\d+/, (r) => String(Number(r) + d));
}

function indiceColumna(ref: string) {
  let n = 0;
  for (const ch of /^[A-Z]+/.exec(ref)![0]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function numeroXml(n: number) {
  return Number.isFinite(n) ? String(n) : "0";
}

function escaparXml(s: string) {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** yyyy-mm-dd -> número de serie de Excel (formato dd/mm/yy de la plantilla). */
function serialExcel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
}

function empresaConDocumento(cot: Cotizacion) {
  const { empresa, documento } = cot.cliente;
  if (!documento) return empresa;
  const tipo = /^\d{11}$/.test(documento) ? "RUC" : /^\d{8}$/.test(documento) ? "DNI" : "Doc.";
  return empresa ? `${empresa} - ${tipo}: ${documento}` : `${tipo}: ${documento}`;
}

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function leer(zip: JSZip, ruta: string) {
  const f = zip.file(ruta);
  if (!f) throw new Error(`La plantilla no contiene ${ruta}`);
  return f.async("string");
}
