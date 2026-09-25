const soles = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Igual al formato de la plantilla: "S/"#,##0.00 */
export function formatoSoles(n: number): string {
  return `S/ ${soles.format(n)}`;
}

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** yyyy-mm-dd -> dd/mm/yyyy */
export function formatoFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function nuevaClave(): string {
  return Math.random().toString(36).slice(2, 10);
}
