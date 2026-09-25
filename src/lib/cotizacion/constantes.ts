// Valores tomados literalmente de la plantilla "00_COTIZACION OFICIAL".

/** K26 = +K25*0.18 */
export const IGV = 0.18;

/** O20:O24 */
export const PRECIO_M2_DEFECTO = 75;

/** T20:T24 (escenario a precio de lista) */
export const PRECIO_LISTA_M2_DEFECTO = 80;

/** J30 / J31 */
export const PCT_ADELANTO_DEFECTO = 0.8;
export const PCT_SALDO_DEFECTO = 0.2;

/** H12 / H13 */
export const ARQUITECTO_DEFECTO = { nombre: "Fabiana Alvarez", telefono: "948 323 458" };

/** B29:B33 */
export const CONDICIONES_DEFECTO = {
  entrega:
    "TIEMPO DE ENTREGA: 2 A 3 SEMANAS HÁBILES A PARTIR DEL CIERRE DE CONTRATO (DEPENDE DE LA MAGNITUD DEL PROYECTO).",
  cuota:
    "CUOTA DE SEPARACIÓN: 80% DE ADELANTO POR CIERRE DE CONTRATO Y 20% ANTES DE ENVIARSE LOS ENTREGABLES.",
  incluye:
    "INCLUYE: REUNIONES VIRTUALES + ENTREGABLE CON RENDERS EN PDF AL CULMINAR LA ETAPA DE DISEÑO (ANTES DE ELLO SE DEBE PAGAR EL MONTO RESTANTE).",
  entregable:
    "*EL ENTREGABLE INCLUYE: Plantas de distribucion / Portafolio de Diseño (Renders) / Cotizacion por fabricacion",
  nota: "*SI EL CLIENTE DESEA EJECUTAR LA FABRICACION DE LOS MUEBLES CON NOSOTROS, EL COSTO DE DISEÑO SERA DESCONTADO EN SU TOTALIDAD.",
};

/** Descripción típica de D20:D24 (se completa el área). */
export function descripcionDefecto(area: number | string = ""): string {
  return [
    "DISEÑO DE INTERIORES",
    `AREA: ${area} m2`,
    "Incluye:",
    ". Planta de distribución con medidas.",
    ". Información de accesorios o complementos",
    ". Portafolio de Diseño (Renders).",
  ].join("\n");
}

/** J2 */
export const TITULO_COTIZACION = "COTIZACIÓN DE DISEÑO INTEGRAL";

/** E3:E6 (cabecera de la empresa) */
export const EMPRESA = {
  lineas: [
    "MUEBLES SPACIO HOME E.I.R.L - RUC: 20608536192",
    "TEL:  962 346 642  -  959 798 880",
    "DIRECION:  CALLE MARIANO ODICIO 153 - SURQUILLO",
    "EMAIL: mueblespaciohome@gmail.com - admspaciohomee@gmail.com",
  ],
  /** Texto de la imagen EMF de la plantilla (B35:E41). */
  cuentas: [
    ["BBVA CUENTA DE AHORRO:", "0011 0234 0100036226"],
    ["BBVA CCI:", "011 234 000100036226 27"],
    ["INTERBANK CUENTA CORRIENTE:", "2003003689296"],
    ["INTERBANK CCI:", "00320000300368929633"],
    ["INTERBANK DÓLARES", "2003003689309"],
    ["INTERBANK DÓLARES CCI", "00320000300368930934"],
  ],
};

/** Textos fijos de la carta de garantía (CARTA_GARANTIA_*.pdf). */
export const CARTA = {
  empresa: "MUEBLES SPACIO HOME E.I.R.L",
  ruc: "20608536192",
  trabajo: "la fabricación e instalación de muebles en melamina y complementos",
  validezDefecto: 12,
  condiciones: [
    "La garantía no aplica si un tercero no autorizado repara el producto.",
    "La garantía no aplica cuando se comprueba que el daño fue ocasionado por descuido o mala manipulación del cliente y/o terceros no autorizados por Spacio Home.",
    "La garantía no aplica si el cliente no realiza el pago correspondiente al 100% del contrato.",
    "La garantía solo aplica a los muebles elaborados por la empresa y entregados en la fecha indicada líneas arriba.",
  ],
  firmante: ["JOHNNY HUACHUA", "PINTADO DNI:", "10232596"],
};
