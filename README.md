# Cotizador Spacio Home

Herramienta web para crear, guardar y generar en Excel las cotizaciones de diseño integral, usando como plantilla el Excel original (`COTIZACIÓN DE DISEÑO_LUCERO GODOY - copia.xlsx`).

Flujo: **Crear cotización → Guardar → Generar Excel o PDF → Consultar historial** (abrir, editar, duplicar y volver a descargar). Antes de cada descarga se puede cambiar el nombre del archivo.

Además, **Carta de garantía** (`/carta-garantia`) genera la carta garantía de servicio en PDF. Los campos configurables son nombre, DNI, fecha de entrega y validez en meses (12 por defecto). Replica `CARTA_GARANTIA_ELIANA_OROS.pdf` con sus imágenes (`public/carta/`) y la fuente Carlito, equivalente libre de Calibri.

## Tecnologías

- Next.js 15 (App Router) + React + TypeScript + Tailwind CSS
- Neon (Postgres serverless) para el historial, con acceso solo desde el servidor (driver `postgres`)
- JSZip para generar el Excel editando directamente el XML de la plantilla
- @react-pdf/renderer para el PDF: mismo diseño que el área de impresión (A1:L42), sin las columnas auxiliares N:Y. Se genera en el navegador

## Reglas de cálculo (idénticas a la plantilla)

| Celda | Fórmula | Significado |
|---|---|---|
| K20… | `N × O` | Costo del ambiente = área (m²) × precio por m² |
| K25 | `SUM(K20:K…)` | Monto total |
| K26 | `K25 × 0.18` | IGV 18 % |
| K27 | `K25 + K26` | Total con IGV |
| K30 | `K27 × J30` | Cierre de contrato (80 % por defecto) |
| K31 | `J31 × K27` | Antes de los entregables (20 % por defecto) |
| R… | `S × T` | Mismo cálculo a precio de lista (S/ 80/m²), en columnas auxiliares no impresas |

## Puesta en marcha

1. **Neon:** crea una base de datos (desde Vercel → *Storage* → Neon, o en neon.tech) y ejecuta `db/schema.sql` en su *SQL Editor*.
2. **Variables de entorno:** copia `.env.example` a `.env.local` y completa `DATABASE_URL` con la cadena de conexión *pooled* de Neon. Nunca se envía al navegador.
3. Ejecuta:
   ```bash
   npm install
   npm run dev
   ```

## Despliegue en Vercel

1. Sube el proyecto a un repositorio de GitHub e impórtalo en Vercel (framework: Next.js, sin configuración extra).
2. En *Storage → Create Database → Neon*, conecta la base al proyecto (agrega `DATABASE_URL` sola) y ejecuta `db/schema.sql` en el SQL Editor de Neon. Si la base la creaste en neon.tech, agrega `DATABASE_URL` en *Settings → Environment Variables*.
3. Despliega. El build es `npm run build`.

## Estructura

```
src/
  app/                    páginas (nueva, historial, editar) y acciones del servidor
  components/             editor, tabla de ambientes, resumen, selector de imagen…
  lib/cotizacion/         constantes de la plantilla, cálculos, cotización nueva
  lib/excel/              generador del Excel a partir de la plantilla
  lib/pdf/                PDF de la cotización y carta de garantía
  lib/db.ts               conexión a Postgres/Neon (solo servidor)
  services/               acceso a datos (SQL) y descarga del Excel (navegador)
  types/                  tipos
public/plantilla-cotizacion.xlsx   plantilla derivada del Excel original
scripts/                  preparar la plantilla y probar el generador
db/schema.sql             tablas
```

## Plantilla de Excel

`public/plantilla-cotizacion.xlsx` se genera a partir del Excel original con:

```bash
npm run plantilla
```

Este paso no modifica el original. Solo elimina:

- 36 722 formas invisibles que inflaban el archivo;
- los planos y los datos personales del cliente de ejemplo;
- la caché de cálculo.

El diseño se conserva intacto. Si cambias el Excel original (textos fijos, logo, cuentas bancarias, colores), vuelve a ejecutar el comando.

Para probar el generador contra los valores del original:

```bash
npm run probar:excel
```

Los archivos resultantes se guardan en `salida-pruebas/`.

**Por qué no ExcelJS:** al reescribir el archivo descarta los rectángulos redondeados, la imagen EMF de las cuentas bancarias y la configuración de impresora de la plantilla. El generador propio modifica solo las celdas, filas, celdas combinadas, área de impresión e imágenes necesarias; todo lo demás queda igual que en la plantilla.
