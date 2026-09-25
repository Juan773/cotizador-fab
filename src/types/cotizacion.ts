/** Un ambiente cotizado (una fila de la tabla ITEMS del Excel). */
export interface ItemCotizacion {
  /** Clave local para React; no se guarda. */
  key: string;
  /** Columna C: AMBIENTES. */
  ambiente: string;
  /** Columnas D:G: DESCRIPCIÓN (texto multilínea). */
  descripcion: string;
  /** Columna N (auxiliar): área en m². */
  area: number;
  /** Columna O (auxiliar): precio por m² aplicado. */
  precioM2: number;
  /** Columnas H:J: PLANTA DE DISTRIBUCIÓN (imagen como data URL). */
  imagen: string | null;
}

export interface DatosCliente {
  nombre: string;
  empresa: string;
  documento: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface Condiciones {
  /** B29 */
  entrega: string;
  /** B30 */
  cuota: string;
  /** B31 */
  incluye: string;
  /** B32 */
  entregable: string;
  /** B33 (en rojo) */
  nota: string;
}

export interface Cotizacion {
  id: string | null;
  /** COT-000001; se asigna al guardar por primera vez. */
  numero: string | null;
  /** K4, formato ISO yyyy-mm-dd. */
  fecha: string;
  /** K5 "F. Vence", formato ISO yyyy-mm-dd. */
  fechaVence: string;
  cliente: DatosCliente;
  arquitecto: { nombre: string; telefono: string };
  /** Columna T (auxiliar): precio de lista por m² (sin descuento). */
  precioListaM2: number;
  /** J30 */
  pctAdelanto: number;
  /** J31 */
  pctSaldo: number;
  condiciones: Condiciones;
  items: ItemCotizacion[];
}

export interface Totales {
  /** K20:K24 */
  costos: number[];
  /** K25: MONTO TOTAL */
  subtotal: number;
  /** K26 */
  igv: number;
  /** K27 */
  total: number;
  /** K30 */
  adelanto: number;
  /** K31 */
  saldo: number;
  /** R25..R27: mismo cálculo a precio de lista. */
  lista: { subtotal: number; igv: number; total: number };
  /** Diferencia entre precio de lista y precio aplicado (R27 - K27). */
  ahorro: number;
}

export interface CotizacionResumen {
  id: string;
  numero: string;
  fecha: string;
  clienteNombre: string;
  clienteEmpresa: string;
  total: number;
}

/** Parámetros de la carta de garantía de servicio. */
export interface CartaGarantia {
  nombre: string;
  dni: string;
  /** Fecha de entrega, formato ISO yyyy-mm-dd. */
  fechaEntrega: string;
  validezMeses: number;
}
