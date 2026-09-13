// scripts/verify-schema.mjs
// Requiere las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
// del proyecto contra el que se quiera verificar (staging o production).
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes de correr este script."
  );
  process.exit(1);
}

const expectedTables = [
  "torneos", "equipos", "jugadoras", "jornadas", "partidos",
  "alineaciones", "goles", "tarjetas", "suspensiones", "avisos",
  "reglamentos", "perfiles_admin",
];

const supabase = createClient(url, serviceRoleKey);

for (const table of expectedTables) {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    console.error(`No se pudo leer la tabla "${table}": ${error.message}`);
    process.exit(1);
  }
}

console.log(`OK: las ${expectedTables.length} tablas existen y son accesibles en ${url}`);
