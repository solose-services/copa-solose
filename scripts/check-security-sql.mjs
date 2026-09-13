import { readFileSync } from "node:fs";

const rlsSql = readFileSync("supabase/migrations/0002_rls_policies.sql", "utf8");
const storageSql = readFileSync("supabase/migrations/0003_storage.sql", "utf8");

const publicDataTables = [
  "torneos", "equipos", "jugadoras", "jornadas", "partidos",
  "alineaciones", "goles", "tarjetas", "suspensiones", "avisos",
  "reglamentos",
];

const tablesRequiringRls = [...publicDataTables, "perfiles_admin"];

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

const missingSelectPolicy = publicDataTables.filter(
  (table) =>
    !new RegExp(`create policy[^;]*on ${table} for select using \\(true\\)`).test(rlsSql)
);

if (missingSelectPolicy.length > 0) {
  console.error(`Falta política de lectura pública para: ${missingSelectPolicy.join(", ")}`);
  process.exit(1);
}

const missingAdminPolicy = publicDataTables.filter(
  (table) =>
    !new RegExp(`create policy[^;]*on ${table} for all using \\(is_admin\\(\\)\\)`).test(rlsSql)
);

if (missingAdminPolicy.length > 0) {
  console.error(`Falta política de escritura admin para: ${missingAdminPolicy.join(", ")}`);
  process.exit(1);
}

if (!/create policy[^;]*on perfiles_admin for select using \(auth\.uid\(\) = id\)/.test(rlsSql)) {
  console.error("Falta la política de autolectura de perfiles_admin (auth.uid() = id)");
  process.exit(1);
}

if (!/insert into storage\.buckets/.test(storageSql)) {
  console.error("Falta la creación del bucket 'media' en 0003_storage.sql");
  process.exit(1);
}

console.log(
  "OK: RLS habilitado con políticas de lectura pública y escritura admin en todas las tablas, y bucket de storage configurado"
);
