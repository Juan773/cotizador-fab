/**
 * Versión PDF de la cotización: replica el área de impresión de la plantilla (A1:L42),
 * sin las columnas auxiliares N:Y. Se renderiza en el navegador con @react-pdf/renderer.
 */
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Cotizacion, Totales } from "@/types/cotizacion";
import { EMPRESA, TITULO_COTIZACION } from "@/lib/cotizacion/constantes";

// Colores del tema de la plantilla.
const GRIS = "#D0CFCF"; // encabezados (lt2 -10%)
const AZUL = "#DEEBF7"; // AMBIENTES (accent5 +80%)
const VERDE = "#E2EFDA"; // fila del IGV (accent6 +80%)
const CREMA = "#FFF8E5"; // ITEMS
const ROJO = "#FF0000";
const BORDE = "#000000";

// Sin guiones al partir palabras (DORMITORIO, AMBIENTES…).
Font.registerHyphenationCallback((palabra) => [palabra]);

// Columnas B | C | D:G | H:J | K. Parten de la plantilla, pero ITEMS, AMBIENTES y COSTOS
// se ensanchan porque en el Excel el texto se imprime al 34 % y aquí a tamaño legible.
const ANCHOS = [6, 14, 37, 29, 14];
const TOTAL_ANCHOS = ANCHOS.reduce((a, b) => a + b, 0);
const ancho = (i: number) => `${(ANCHOS[i] / TOTAL_ANCHOS) * 100}%`;
const ANCHO_PLANTA_A_K = `${((ANCHOS[3] + ANCHOS[4]) / TOTAL_ANCHOS) * 100}%`;

const s = StyleSheet.create({
  pagina: { paddingVertical: 22, paddingHorizontal: 24, fontFamily: "Helvetica", fontSize: 7.5, color: "#000" },
  negrita: { fontFamily: "Helvetica-Bold" },
  fila: { flexDirection: "row" },

  // Cabecera
  cabecera: { flexDirection: "row", alignItems: "stretch", marginBottom: 10 },
  logo: { width: 118, height: 46, objectFit: "contain" },
  cajaEmpresa: {
    flex: 1,
    marginHorizontal: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#555",
    borderRadius: 8,
    justifyContent: "center",
    paddingVertical: 4,
  },
  lineaEmpresa: { fontFamily: "Helvetica-Bold", fontSize: 6.6, textAlign: "center", marginVertical: 0.6 },
  bloqueTitulo: { width: 170 },
  titulo: {
    backgroundColor: GRIS,
    borderWidth: 1,
    borderColor: BORDE,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "center",
    paddingVertical: 3,
    marginBottom: 4,
  },
  datoTitulo: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, marginVertical: 1 },

  // Cliente / arquitecto
  etiquetas: { flexDirection: "row", marginBottom: 3 },
  etiquetaSeccion: {
    backgroundColor: GRIS,
    borderWidth: 1,
    borderColor: BORDE,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    textAlign: "center",
    paddingVertical: 1.5,
  },
  cajaCliente: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
    width: "70%",
  },
  dato: { flexDirection: "row", marginVertical: 1 },
  datoEtiqueta: { fontFamily: "Helvetica-Bold", width: 52 },

  // Tabla
  th: {
    backgroundColor: GRIS,
    borderColor: BORDE,
    borderTopWidth: 1.5,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    textAlign: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  filaItem: { flexDirection: "row", minHeight: 70 },
  td: { borderColor: BORDE, borderBottomWidth: 1, borderRightWidth: 1, justifyContent: "center", padding: 3 },
  celdaItem: { backgroundColor: CREMA, fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center" },
  celdaAmbiente: { backgroundColor: AZUL, fontFamily: "Helvetica-Bold", fontSize: 7.5, textAlign: "center" },
  planta: { maxWidth: "100%", maxHeight: 63, objectFit: "contain" },

  // Totales
  filaTotal: { flexDirection: "row", justifyContent: "flex-end" },
  totalEtiqueta: {
    borderColor: BORDE,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    paddingVertical: 2,
  },
  totalValor: {
    borderColor: BORDE,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    paddingVertical: 2,
    paddingRight: 3,
  },

  // Consideraciones
  consideraciones: { marginTop: 6, flexDirection: "row", justifyContent: "space-between" },
  tituloCons: { fontFamily: "Helvetica-Bold", fontSize: 9, textDecoration: "underline", marginBottom: 3 },
  lineaCons: { fontSize: 7, marginVertical: 1.2 },
  tablaPagos: { width: "40%", marginTop: 16 },
  filaPago: { flexDirection: "row", borderWidth: 0.8, borderColor: BORDE, marginTop: -0.8 },
  pagoCelda: { fontFamily: "Helvetica-Bold", fontSize: 6.5, paddingVertical: 1.5, paddingHorizontal: 2 },

  // Cuentas
  cajaCuentas: {
    marginTop: 8,
    width: "42%",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#555",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  lineaCuenta: { fontSize: 7, marginVertical: 0.6 },
});

/** Helvetica estándar solo cubre Latin-1: se quitan caracteres invisibles o fuera de rango. */
function limpio(t: string) {
  return t.replace(/[^\n\u0020-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u20AC]/g, "");
}

const soles = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** "S/"#,##0.00 como en K25 */
const sol = (n: number) => `S/${soles.format(n)}`;
/** "S/"\ #,##0.00 como en K26, K27, K30, K31 */
const solEsp = (n: number) => `S/ ${soles.format(n)}`;
/** Formato General de Excel para K20:K24 (898.5, 1875…). */
const general = (n: number) => String(Math.round(n * 100) / 100);

function fechaCorta(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`; // dd/mm/yy como la plantilla
}

function documentoCliente(c: Cotizacion) {
  const { empresa, documento } = c.cliente;
  if (!documento) return empresa;
  const tipo = /^\d{11}$/.test(documento) ? "RUC" : /^\d{8}$/.test(documento) ? "DNI" : "Doc.";
  return empresa ? `${empresa} - ${tipo}: ${documento}` : `${tipo}: ${documento}`;
}

/** "ETIQUETA:" en negrita y el resto normal, como B29:B32. */
function TextoConEtiqueta({ texto, color }: { texto: string; color?: string }) {
  const i = texto.indexOf(":");
  if (i < 0) return <Text style={[s.lineaCons, s.negrita, color ? { color } : {}]}>{limpio(texto)}</Text>;
  return (
    <Text style={[s.lineaCons, color ? { color } : {}]}>
      <Text style={s.negrita}>{limpio(texto.slice(0, i + 1))}</Text>
      {limpio(texto.slice(i + 1))}
    </Text>
  );
}

export function CotizacionPdf({ cot, totales: t, logo }: { cot: Cotizacion; totales: Totales; logo: string }) {
  const c = cot.cliente;
  return (
    <Document title={`${cot.numero ?? "Cotización"} - ${c.empresa || c.nombre}`} author="Muebles Spacio Home">
      <Page size="A4" style={s.pagina}>
        {/* Cabecera: logo, datos de la empresa y título */}
        <View style={s.cabecera}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logo} style={s.logo} />
          <View style={s.cajaEmpresa}>
            {EMPRESA.lineas.map((l) => (
              <Text key={l} style={s.lineaEmpresa}>
                {l}
              </Text>
            ))}
          </View>
          <View style={s.bloqueTitulo}>
            <Text style={s.titulo}>{TITULO_COTIZACION}</Text>
            <View style={s.datoTitulo}>
              <Text style={s.negrita}>N° Cotización:</Text>
              <Text>{cot.numero ?? "BORRADOR"}</Text>
            </View>
            <View style={s.datoTitulo}>
              <Text style={s.negrita}>Fecha de cotización:</Text>
              <Text>{fechaCorta(cot.fecha)}</Text>
            </View>
            <View style={s.datoTitulo}>
              <Text style={s.negrita}>F. Vence:</Text>
              <Text>{fechaCorta(cot.fechaVence)}</Text>
            </View>
          </View>
        </View>

        {/* Datos del cliente y arquitecto/a */}
        <View style={s.etiquetas}>
          <Text style={[s.etiquetaSeccion, { width: "22%", marginLeft: "3%" }]}>Datos del Cliente</Text>
          <Text style={[s.etiquetaSeccion, { width: "14%", marginLeft: "25%" }]}>Arquitecto/a</Text>
        </View>
        <View style={s.cajaCliente}>
          <View style={{ flex: 1.3 }}>
            {[
              ["Nombre :", c.nombre],
              ["Empresa :", documentoCliente(cot)],
              ["Direccion :", c.direccion],
              ["Teléfono :", c.telefono],
              ["Email :", c.email],
            ].map(([e, v]) => (
              <View key={e} style={s.dato}>
                <Text style={s.datoEtiqueta}>{e}</Text>
                <Text style={{ flex: 1 }}>{limpio(v)}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.dato}>
              <Text style={s.datoEtiqueta}>Arquitecta :</Text>
              <Text>{limpio(cot.arquitecto.nombre)}</Text>
            </View>
            <View style={s.dato}>
              <Text style={s.datoEtiqueta}>Teléfono :</Text>
              <Text>{limpio(cot.arquitecto.telefono)}</Text>
            </View>
          </View>
        </View>

        {/* Tabla de ambientes */}
        <View style={s.fila} fixed={false}>
          {["ITEMS", "AMBIENTES", "DESCRIPCIÓN", "PLANTA DE DISTRIBUCIÓN", "COSTOS INDIVIDUALES"].map((h, i) => (
            <Text key={h} style={[s.th, { width: ancho(i) }, i === 0 ? { borderLeftWidth: 1.5 } : {}, i === 4 ? { borderRightWidth: 1.5 } : {}]}>
              {h}
            </Text>
          ))}
        </View>
        {cot.items.map((it, i) => {
          const [primera, ...resto] = limpio(it.descripcion).split("\n");
          const ultima = i === cot.items.length - 1;
          const fondo = ultima ? { borderBottomWidth: 1.5 } : {};
          return (
            <View key={it.key} style={s.filaItem} wrap={false}>
              <View style={[s.td, s.celdaItem, { width: ancho(0), borderLeftWidth: 1.5 }, fondo]}>
                <Text>{i + 1}</Text>
              </View>
              <View style={[s.td, s.celdaAmbiente, { width: ancho(1) }, fondo]}>
                <Text>{limpio(it.ambiente)}</Text>
              </View>
              <View style={[s.td, { width: ancho(2) }, fondo]}>
                <Text style={s.negrita}>{primera}</Text>
                {resto.length > 0 && <Text>{resto.join("\n")}</Text>}
              </View>
              <View style={[s.td, { width: ancho(3), alignItems: "center" }, fondo]}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                {it.imagen && <Image src={it.imagen} style={s.planta} />}
              </View>
              <View style={[s.td, { width: ancho(4), borderRightWidth: 1.5, alignItems: "center" }, fondo]}>
                <Text>{general(t.costos[i])}</Text>
              </View>
            </View>
          );
        })}

        {/* Totales (H25:K27) */}
        <View wrap={false}>
          <View style={s.filaTotal}>
            <Text style={[s.totalEtiqueta, { width: ancho(3) }]}>MONTO TOTAL</Text>
            <Text style={[s.totalValor, { width: ancho(4) }]}>{sol(t.subtotal)}</Text>
          </View>
          <View style={s.filaTotal}>
            <Text style={[s.totalEtiqueta, { width: ancho(3), backgroundColor: VERDE, color: ROJO }]}>
              MONTO TOTAL FINAL CON DESCUENTO APLICADO + IGV
            </Text>
            <Text style={[s.totalValor, { width: ancho(4), backgroundColor: VERDE, color: ROJO }]}>{solEsp(t.igv)}</Text>
          </View>
          <View style={s.filaTotal}>
            <View style={{ width: ANCHO_PLANTA_A_K, flexDirection: "row", justifyContent: "flex-end" }}>
              <Text style={[s.totalValor, { width: `${(ANCHOS[4] / (ANCHOS[3] + ANCHOS[4])) * 100}%`, color: ROJO }]}>
                {solEsp(t.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Consideraciones y forma de pago */}
        <View style={s.consideraciones} wrap={false}>
          <View style={{ width: "58%" }}>
            <Text style={s.tituloCons}>CONSIDERACIONES:</Text>
            <TextoConEtiqueta texto={cot.condiciones.entrega} />
            <TextoConEtiqueta texto={cot.condiciones.cuota} />
            <TextoConEtiqueta texto={cot.condiciones.incluye} />
            <TextoConEtiqueta texto={cot.condiciones.entregable} />
            <Text style={[s.lineaCons, s.negrita, { color: ROJO }]}>{limpio(cot.condiciones.nota)}</Text>
          </View>
          <View style={s.tablaPagos}>
            {[
              ["CIERRE DE CONTRATO", cot.pctAdelanto, t.adelanto],
              ["ANTES DE ENVIARSE LOS ENTREGABLES FINALES", cot.pctSaldo, t.saldo],
            ].map(([etiqueta, pct, monto]) => (
              <View key={etiqueta as string} style={s.filaPago}>
                <Text style={[s.pagoCelda, { width: "56%", borderRightWidth: 0.8 }]}>{etiqueta as string}</Text>
                <Text style={[s.pagoCelda, { width: "16%", textAlign: "center", borderRightWidth: 0.8 }]}>
                  {Math.round((pct as number) * 100)}%
                </Text>
                <Text style={[s.pagoCelda, { width: "28%", textAlign: "right" }]}>{solEsp(monto as number)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cuentas bancarias */}
        <View style={s.cajaCuentas} wrap={false}>
          {EMPRESA.cuentas.map(([banco, numero]) => (
            <Text key={banco} style={s.lineaCuenta}>
              <Text style={s.negrita}>{banco}</Text> {numero}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
