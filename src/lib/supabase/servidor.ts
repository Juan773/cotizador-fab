import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

/** Cliente de Supabase solo para el servidor (usa la clave secreta; nunca llega al navegador). */
export function supabase(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) {
    throw new Error("Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_SECRET_KEY (ver .env.example).");
  }
  cliente = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}
