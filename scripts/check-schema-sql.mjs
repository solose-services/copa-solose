import { readFileSync } from "node:fs";

const path = "supabase/migrations/0001_init_schema.sql";
const sql = readFileSync(path, "utf8");

const expectedTables = [
  "torneos", "equipos", "jugadoras", "jornadas", "partidos",
  "alineaciones", "goles", "tarjetas", "suspensiones", "avisos",
  "reglamentos", "perfiles_admin",
];

const missing = expectedTables.filter(
  (table) => !new RegExp(`create table ${table}\\b`).test(sql)
);

if (missing.length > 0) {
  console.error(`Faltan tablas en ${path}: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`OK: las ${expectedTables.length} tablas esperadas están en ${path}`);
