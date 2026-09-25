/** Se muestra cuando no se puede conectar con Supabase (p. ej. faltan variables de entorno). */
export default function AvisoConfiguracion({ error }: { error: string }) {
  return (
    <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <b>No se pudo conectar con la base de datos.</b> {error}
      <div className="mt-1 text-xs text-amber-800">
        Revisa <code>SUPABASE_URL</code> y <code>SUPABASE_SECRET_KEY</code> y que hayas ejecutado <code>supabase/schema.sql</code>.
      </div>
    </div>
  );
}
