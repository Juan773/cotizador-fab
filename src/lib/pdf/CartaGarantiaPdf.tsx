/**
 * Carta de garantía de servicio. Replica CARTA_GARANTIA_ELIANA_OROS.pdf:
 * mismas imágenes (fondo, cabecera, pie y firma) en las mismas posiciones y
 * el texto en Carlito (equivalente libre de Calibri, con las mismas medidas).
 * Las medidas están en puntos, tomadas del PDF original (A4 = 595 × 842).
 */
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CartaGarantia } from "@/types/cotizacion";
import { CARTA } from "@/lib/cotizacion/constantes";
import { fechaLarga } from "@/lib/utils";

export interface RecursosCarta {
  fuenteRegular: string;
  fuenteNegrita: string;
  fondo: string;
  cabecera: string;
  pie: string;
  firma: string;
}

let fuentesRegistradas = false;

export function registrarFuentesCarta(r: RecursosCarta) {
  if (fuentesRegistradas) return;
  Font.register({
    family: "Carlito",
    fonts: [
      { src: r.fuenteRegular, fontWeight: "normal" },
      { src: r.fuenteNegrita, fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((palabra) => [palabra]);
  fuentesRegistradas = true;
}

const IZQUIERDA = 85; // margen del texto
const ANCHO_TEXTO = 425;
// El original tiene 17.5 pt entre líneas; con Carlito 12.5, react-pdf da 18 pt por cada 1.0 de lineHeight.
const INTERLINEA = 17.5 / 18;

const s = StyleSheet.create({
  pagina: { fontFamily: "Carlito", fontSize: 12.5, color: "#000", position: "relative" },
  fondo: { position: "absolute", left: 72.07, top: 123.5, width: 451.15, height: 638.4 },
  cabecera: { position: "absolute", left: 0, top: 0.9, width: 595.7, height: 100.1 },
  pie: { position: "absolute", left: -10.7, top: 754.2, width: 597.8, height: 85.95 },
  titulo: {
    position: "absolute",
    top: 116,
    left: 0,
    right: 0,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
    textDecoration: "underline",
  },
  cuerpo: { position: "absolute", top: 171, left: IZQUIERDA, width: ANCHO_TEXTO },
  parrafo: { textAlign: "justify", lineHeight: INTERLINEA },
  negrita: { fontWeight: "bold" },
  vineta: { flexDirection: "row", lineHeight: INTERLINEA },
  textoVineta: { flex: 1, fontWeight: "bold", textAlign: "justify" },
  firma: { marginTop: 16, width: 200, marginLeft: 172 - IZQUIERDA, alignItems: "center" },
  nombreFirmante: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 6, lineHeight: 2.04 },
  dniFirmante: { fontFamily: "Helvetica", fontSize: 12, lineHeight: 2.04 },
});

/** Texto de un campo o una raya si está vacío. */
const valor = (t: string) => t.trim() || "____________";

export function CartaGarantiaPdf({ carta, recursos }: { carta: CartaGarantia; recursos: RecursosCarta }) {
  const meses = carta.validezMeses;
  return (
    <Document title={`Carta de garantía - ${carta.nombre}`} author="Muebles Spacio Home">
      <Page size="A4" style={s.pagina}>
        {/* eslint-disable jsx-a11y/alt-text */}
        <Image src={recursos.fondo} style={s.fondo} fixed />
        <Image src={recursos.cabecera} style={s.cabecera} fixed />
        <Image src={recursos.pie} style={s.pie} fixed />
        {/* eslint-enable jsx-a11y/alt-text */}

        <Text style={s.titulo}>CARTA GARANTÍA DE SERVICIO</Text>

        <View style={s.cuerpo}>
          <Text style={s.parrafo}>
            Por este medio la empresa: <Text style={s.negrita}>{CARTA.empresa}</Text> con{" "}
            <Text style={s.negrita}>RUC {CARTA.ruc}</Text> otorga la presente garantía al señor(a):{" "}
            <Text style={s.negrita}>{valor(carta.nombre)}</Text> debidamente identificado con el{" "}
            <Text style={s.negrita}>DNI {valor(carta.dni)}</Text> por {CARTA.trabajo} entregado el{" "}
            <Text style={s.negrita}>{carta.fechaEntrega ? `${fechaLarga(carta.fechaEntrega)}.` : "____________."}</Text>
          </Text>

          <Text style={[s.parrafo, { marginTop: 26 }]}>
            Esta garantía tiene una validez de{" "}
            <Text style={s.negrita}>
              {meses} {meses === 1 ? "mes" : "meses"}.
            </Text>
          </Text>

          <Text style={[s.parrafo, { marginTop: 26 }]}>
            Transcurrido el período de garantía el cliente comprende y acepta que las reparaciones deberán ser costeadas por el
            mismo.
          </Text>

          <Text style={[s.parrafo, { marginTop: 33.6 }]}>
            Para que la garantía sea efectiva, el cliente debe cumplir los siguientes puntos; a fines de mantener la validez de
            la misma, por ello se prohíbe realizar reparaciones por personal ajeno a nuestra empresa, en consecuencia:
          </Text>

          <View style={{ marginTop: 18.5 }}>
            {CARTA.condiciones.map((c) => (
              <View key={c} style={s.vineta} wrap={false}>
                <Text style={{ width: 42.5, paddingLeft: 20.8 }}>•</Text>
                <Text style={s.textoVineta}>{c}</Text>
              </View>
            ))}
          </View>

          <View style={s.firma} wrap={false}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={recursos.firma} style={{ width: 93.1, height: 71.95 }} />
            <View style={{ marginTop: 6.7, width: 144.5, borderTopWidth: 0.75, borderColor: "#8EAADB" }} />
            <Text style={s.nombreFirmante}>{CARTA.firmante[0]}</Text>
            <Text style={[s.nombreFirmante, { marginTop: 0 }]}>{CARTA.firmante[1]}</Text>
            <Text style={s.dniFirmante}>{CARTA.firmante[2]}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
