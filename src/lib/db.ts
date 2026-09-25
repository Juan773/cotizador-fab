import "server-only";
import postgres from "postgres";

let cliente: postgres.Sql | null = null;

/** Conexión a Postgres (Neon) solo en el servidor. La cadena de conexión nunca llega al navegador. */
export function sql(): postgres.Sql {
  if (cliente) return cliente;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable de entorno DATABASE_URL (ver .env.example).");
  cliente = postgres(url, {
    // Compatible con el pooler de Neon (PgBouncer en modo transacción) y con funciones serverless.
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });
  return cliente;
}
