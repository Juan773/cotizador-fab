// Procesamiento de imágenes de planta en el navegador: se reducen para que la
// cotización pese poco al guardarse y el Excel siga viéndose nítido.

const LADO_MAXIMO = 1000;

function cargar(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, falla) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => falla(new Error("No se pudo leer la imagen."));
    img.src = src;
  });
}

function aDataUrl(canvas: HTMLCanvasElement, png: boolean) {
  return png ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88);
}

/** Lee un archivo de imagen y lo devuelve como data URL (PNG o JPEG) de hasta 1000 px. */
export async function prepararImagen(archivo: File): Promise<string> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await cargar(url);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext("2d")!;
    // Fondo blanco (como las celdas de la plantilla) para poder pasar a JPEG si hace falta.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Los planos suelen ser dibujos de líneas: PNG se ve más nítido; las fotos pesan menos en JPEG.
    const png = aDataUrl(canvas, true);
    return png.length < 800_000 ? png : aDataUrl(canvas, false);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rota la imagen 90° en sentido horario. */
export async function rotarImagen(dataUrl: string): Promise<string> {
  const img = await cargar(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, 0, 0);
  return aDataUrl(canvas, dataUrl.startsWith("data:image/png"));
}
