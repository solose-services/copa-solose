import { readFileSync } from "node:fs";

const rlsSql = readFileSync("supabase/migrations/0002_rls_policies.sql", "utf8");
const storageSql = readFileSync("supabase/migrations/0003_storage.sql", "utf8");

const tablesRequiringRls = [
  "torneos", "equipos", "jugadoras", "jornadas", "partidos",
  "alineaciones", "goles", "tarjetas", "suspensiones", "avisos",
  "reglamentos", "perfiles_admin",
];

const missingRls = tablesRequiringRls.filter(
  (table) => !new RegExp(`alter table ${table} enable row level security`).test(rlsSql)
);

if (missingRls.length > 0) {
  console.error(`Faltan "enable row level security" para: ${missingRls.join(", ")}`);
  process.exit(1);
}

if (!/create or replace function is_admin/.test(rlsSql)) {
  console.error("Falta la función is_admin() en 0002_rls_policies.sql");
  process.exit(1);
}

if (!/insert into storage\.buckets/.test(storageSql)) {
  console.error("Falta la creación del bucket 'media' en 0003_storage.sql");
  process.exit(1);
}

console.log("OK: RLS habilitado en todas las tablas y bucket de storage configurado");
