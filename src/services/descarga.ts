/** Quita caracteres no permitidos en nombres de archivo y agrega la extensión. */
export function nombreSeguro(nombre: string, extension: "xlsx" | "pdf", porDefecto: string): string {
  const limpio = nombre
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "")
    .replace(/\.(xlsx|pdf)$/i, "")
    .trim()
    .slice(0, 150);
  return `${limpio || porDefecto}.${extension}`;
}

/** Descarga un archivo generado en el navegador. */
export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
