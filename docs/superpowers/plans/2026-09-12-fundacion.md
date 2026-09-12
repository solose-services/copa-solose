# Fundación (Copa Solose) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working skeleton of Copa Solose — a Next.js app wired to Supabase (database, auth, storage), with the full database schema, row-level security, admin login, and a deployment pipeline to staging + production on Vercel.

**Architecture:** Next.js App Router (TypeScript) serves both the public site and the `/admin` area from one codebase. Supabase provides Postgres (data), Auth (admin login), and Storage (logos/fotos/PDFs). Two isolated Supabase projects (staging, production) map to Vercel's Preview and Production environments respectively.

**Tech Stack:** Next.js 16.3.5, React 19.2.8, TypeScript 5, Tailwind CSS 4, Vitest 5, `@supabase/supabase-js` 2.116, `@supabase/ssr` 0.12, Supabase CLI 2.117 (installed as a dev dependency, no Docker required), Vercel.

## Global Constraints

- Toda la interfaz de la aplicación usa lenguaje femenino (jugadoras, administradoras).
- Objetivo de costo: $0/mes al volumen actual (16 equipos, ~240 jugadoras); cualquier gasto futuro (dominio propio, tier pagado) se comunica antes de aplicarse.
- Las cuentas de GitHub, Vercel y Supabase pertenecen a Solose y las crea Solose siguiendo `docs/setup/cuentas-y-accesos.md` — nunca se crean en nombre del usuario.
- Dos entornos obligatorios: staging y producción, cada uno con su propio proyecto de Supabase.
- Seguridad de datos: lectura pública abierta en todas las tablas de datos del torneo; escritura (INSERT/UPDATE/DELETE) restringida a filas presentes en `perfiles_admin`, vía RLS.
- El marcador de un partido nunca se captura como número suelto: siempre se deriva de contar los goles registrados.

---

## File Structure

```
copa-solose/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Shell protegido (header + cerrar sesión)
│   │   │   ├── login/page.tsx        # Formulario de acceso
│   │   │   └── sign-out-button.tsx   # Botón de cerrar sesión (client component)
│   │   ├── api/health/route.ts       # Smoke test de conexión a Supabase
│   │   ├── layout.tsx                # Layout raíz (generado por create-next-app)
│   │   └── page.tsx                  # Home temporal
│   ├── lib/
│   │   ├── env.ts                    # Validación de variables de entorno
│   │   ├── auth/
│   │   │   ├── protected-paths.ts    # Qué rutas requieren sesión
│   │   │   └── login-form.ts         # Validación del formulario de login
│   │   └── supabase/
│   │       ├── client.ts             # Cliente de Supabase para el navegador
│   │       └── server.ts             # Cliente de Supabase para Server Components/Route Handlers
│   └── middleware.ts                 # Refresca sesión y protege /admin/*
├── scripts/
│   ├── check-schema-sql.mjs          # Verifica que 0001 declare todas las tablas
│   ├── check-security-sql.mjs        # Verifica RLS + storage en 0002/0003
│   └── verify-schema.mjs             # Verifica contra una base de datos real (post-credenciales)
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 0001_init_schema.sql
│       ├── 0002_rls_policies.sql
│       ├── 0003_storage.sql
│       └── 0004_seed_torneos.sql
└── docs/setup/cuentas-y-accesos.md   # (ya existe) guía de cuentas para Solose
```

---

### Task 1: Scaffold del proyecto Next.js

**Files:**
- Create: todo el proyecto Next.js en la raíz del repo (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `eslint.config.mjs`, `postcss.config.mjs`)

**Interfaces:**
- Produces: script `npm run build`, `npm run dev`, `npm run lint`, alias de import `@/*` → `src/*`.

- [ ] **Step 1: Ejecutar create-next-app**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --no-agents-md --disable-git
```

Cuando termine, confirma en `package.json` que las dependencias son `next@16.3.5`, `react@19.2.8`, `react-dom@19.2.8`.

- [ ] **Step 2: Verificar que compila**

Run: `npm run build`
Expected: termina con `✓ Compiled successfully` y una tabla de rutas mostrando `/` y `/_not-found`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project"
```

---

### Task 2: Herramientas de prueba + validación de variables de entorno

**Files:**
- Create: `src/lib/env.ts`
- Test: `src/lib/env.test.ts`
- Modify: `package.json` (agregar `vitest` y el script `test`)
- Create: `.env.local.example`

**Interfaces:**
- Consumes: nada (primer módulo de lógica del proyecto).
- Produces: `getSupabaseEnv(): { url: string; anonKey: string }` — usado por las Tasks 3 y 4.

- [ ] **Step 1: Instalar Vitest con una versión de `@types/node` compatible**

```bash
npm install -D vitest@latest @types/node@latest
```

- [ ] **Step 2: Agregar el script de pruebas**

Modifica `package.json`, dentro de `"scripts"`, agrega:

```json
"test": "vitest run"
```

- [ ] **Step 3: Escribir la prueba que falla**

```ts
// src/lib/env.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseEnv } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabaseEnv", () => {
  it("returns url and anonKey when both are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});
```

- [ ] **Step 4: Verificar que falla**

Run: `npx vitest run src/lib/env.test.ts`
Expected: FAIL — `Cannot find module './env'` o similar (el archivo `env.ts` no existe todavía).

- [ ] **Step 5: Implementación mínima**

```ts
// src/lib/env.ts
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL. Revisa .env.local."
    );
  }
  if (!anonKey) {
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.local."
    );
  }

  return { url, anonKey };
}
```

- [ ] **Step 6: Verificar que pasa**

Run: `npm test`
Expected: `Test Files 1 passed (1)`, `Tests 3 passed (3)`.

- [ ] **Step 7: Documentar las variables esperadas**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/env.ts src/lib/env.test.ts .env.local.example
git commit -m "feat: add Supabase env validation with tests"
```

---

### Task 3: Clientes de Supabase (navegador y servidor)

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Test: `src/lib/supabase/client.test.ts`
- Test: `src/lib/supabase/server.test.ts`
- Modify: `package.json` (agregar `@supabase/supabase-js`, `@supabase/ssr`)

**Interfaces:**
- Consumes: `getSupabaseEnv()` de `src/lib/env.ts` (Task 2).
- Produces: `createClient()` en `client.ts` (síncrono, para componentes de cliente) y `createClient()` en `server.ts` (asíncrono, para Server Components y Route Handlers) — usados por las Tasks 4, 8 y 9.

- [ ] **Step 1: Instalar los paquetes de Supabase**

```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest
```

- [ ] **Step 2: Escribir la prueba del cliente de navegador (falla)**

```ts
// src/lib/supabase/client.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ mocked: true })),
}));

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "./client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("createClient (browser)", () => {
  it("calls createBrowserClient with the configured Supabase URL and anon key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key"
    );
  });
});
```

- [ ] **Step 3: Verificar que falla**

Run: `npx vitest run src/lib/supabase/client.test.ts`
Expected: FAIL — `Cannot find module './client'`.

- [ ] **Step 4: Implementación mínima del cliente de navegador**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
```

- [ ] **Step 5: Verificar que pasa**

Run: `npx vitest run src/lib/supabase/client.test.ts`
Expected: `Tests 1 passed (1)`.

- [ ] **Step 6: Escribir la prueba del cliente de servidor (falla)**

```ts
// src/lib/supabase/server.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

const cookieStoreMock = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ mocked: true })),
}));

import { createServerClient } from "@supabase/ssr";
import { createClient } from "./server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("createClient (server)", () => {
  it("calls createServerClient with the configured Supabase URL and anon key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );
  });
});
```

- [ ] **Step 7: Verificar que falla**

Run: `npx vitest run src/lib/supabase/server.test.ts`
Expected: FAIL — `Cannot find module './server'`.

- [ ] **Step 8: Implementación mínima del cliente de servidor**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Se puede ignorar si se llama desde un Server Component de solo lectura:
          // el middleware (Task 4) ya se encarga de refrescar la sesión.
        }
      },
    },
  });
}
```

- [ ] **Step 9: Verificar que pasa**

Run: `npm test`
Expected: todos los archivos de prueba pasan.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/lib/supabase
git commit -m "feat: add Supabase browser and server clients"
```

---

### Task 4: Protección de rutas de administración (middleware)

**Files:**
- Create: `src/lib/auth/protected-paths.ts`
- Test: `src/lib/auth/protected-paths.test.ts`
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `getSupabaseEnv()` (Task 2).
- Produces: `shouldProtectPath(pathname: string): boolean` — reutilizable por cualquier lógica futura de rutas protegidas.

- [ ] **Step 1: Escribir la prueba (falla)**

```ts
// src/lib/auth/protected-paths.test.ts
import { describe, expect, it } from "vitest";
import { shouldProtectPath } from "./protected-paths";

describe("shouldProtectPath", () => {
  it("protects /admin routes", () => {
    expect(shouldProtectPath("/admin")).toBe(true);
    expect(shouldProtectPath("/admin/equipos")).toBe(true);
  });

  it("does not protect the login page", () => {
    expect(shouldProtectPath("/admin/login")).toBe(false);
  });

  it("does not protect public routes", () => {
    expect(shouldProtectPath("/")).toBe(false);
    expect(shouldProtectPath("/calendario")).toBe(false);
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run src/lib/auth/protected-paths.test.ts`
Expected: FAIL — `Cannot find module './protected-paths'`.

- [ ] **Step 3: Implementación mínima**

```ts
// src/lib/auth/protected-paths.ts
export function shouldProtectPath(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) return false;
  return pathname !== "/admin/login";
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm test`
Expected: todos los archivos de prueba pasan.

- [ ] **Step 5: Crear el middleware**

```ts
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { shouldProtectPath } from "@/lib/auth/protected-paths";
import { getSupabaseEnv } from "@/lib/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (shouldProtectPath(request.nextUrl.pathname) && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 6: Verificar que el proyecto sigue compilando**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth src/middleware.ts
git commit -m "feat: protect /admin routes with Supabase session middleware"
```

---

### Task 5: Esquema de base de datos

**Files:**
- Create: `supabase/config.toml`, `supabase/.gitignore`
- Create: `supabase/migrations/0001_init_schema.sql`
- Create: `scripts/check-schema-sql.mjs`
- Modify: `package.json` (agregar `supabase` como dev dependency y el script `check:schema`)

**Interfaces:**
- Produces: las 12 tablas que consumen todas las pantallas de las Fases 2-4 (`torneos`, `equipos`, `jugadoras`, `jornadas`, `partidos`, `alineaciones`, `goles`, `tarjetas`, `suspensiones`, `avisos`, `reglamentos`, `perfiles_admin`).

- [ ] **Step 1: Instalar el CLI de Supabase e inicializar**

```bash
npm install -D supabase@latest
npx supabase init --force
```

- [ ] **Step 2: Escribir la migración del esquema**

```sql
-- supabase/migrations/0001_init_schema.sql
create extension if not exists pgcrypto;

create table torneos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  temporada text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table equipos (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  nombre text not null,
  logo_url text,
  orden_desempate_manual int,
  created_at timestamptz not null default now()
);

create table jugadoras (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references equipos (id) on delete cascade,
  nombre text not null,
  foto_url text,
  numero_camiseta int,
  created_at timestamptz not null default now(),
  unique (equipo_id, numero_camiseta)
);

create table jornadas (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  etiqueta text not null,
  tipo text not null check (tipo in ('regular', 'liguilla')),
  orden int not null,
  created_at timestamptz not null default now(),
  unique (torneo_id, orden)
);

create table partidos (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references jornadas (id) on delete cascade,
  equipo_local_id uuid not null references equipos (id),
  equipo_visitante_id uuid not null references equipos (id),
  fecha date,
  hora time,
  mvp_jugadora_id uuid references jugadoras (id),
  incidencias text,
  created_at timestamptz not null default now(),
  check (equipo_local_id <> equipo_visitante_id)
);

create table alineaciones (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos (id) on delete cascade,
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  equipo_id uuid not null references equipos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (partido_id, jugadora_id)
);

create table goles (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos (id) on delete cascade,
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  minuto int not null check (minuto >= 0),
  created_at timestamptz not null default now()
);

create table tarjetas (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos (id) on delete cascade,
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  tipo text not null check (tipo in ('amarilla', 'roja')),
  minuto int not null check (minuto >= 0),
  created_at timestamptz not null default now()
);

create table suspensiones (
  id uuid primary key default gen_random_uuid(),
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  tarjeta_id uuid references tarjetas (id) on delete set null,
  jornada_desde_id uuid not null references jornadas (id),
  jornada_hasta_id uuid not null references jornadas (id),
  motivo text,
  created_at timestamptz not null default now()
);

create table avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cuerpo text not null,
  imagen_url text,
  fecha_publicacion timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table reglamentos (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null unique references torneos (id) on delete cascade,
  pdf_url text not null,
  actualizado_en timestamptz not null default now()
);

create table perfiles_admin (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Escribir el script de verificación estática (sin necesitar una base de datos real)**

```js
// scripts/check-schema-sql.mjs
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
```

- [ ] **Step 4: Agregar el script a `package.json`**

```json
"check:schema": "node scripts/check-schema-sql.mjs"
```

- [ ] **Step 5: Ejecutar la verificación**

Run: `npm run check:schema`
Expected: `OK: las 12 tablas esperadas están en supabase/migrations/0001_init_schema.sql`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json supabase scripts/check-schema-sql.mjs
git commit -m "feat: add initial database schema migration"
```

---

### Task 6: Seguridad — RLS y almacenamiento

**Files:**
- Create: `supabase/migrations/0002_rls_policies.sql`
- Create: `supabase/migrations/0003_storage.sql`
- Create: `supabase/migrations/0004_seed_torneos.sql`
- Create: `scripts/check-security-sql.mjs`
- Modify: `package.json` (agregar el script `check:security`)

**Interfaces:**
- Consumes: las 12 tablas de la Task 5.
- Produces: función `is_admin()` reutilizada por cualquier política futura; bucket de almacenamiento `media`.

- [ ] **Step 1: Escribir la migración de RLS**

```sql
-- supabase/migrations/0002_rls_policies.sql
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfiles_admin where id = auth.uid()
  );
$$;

alter table torneos enable row level security;
alter table equipos enable row level security;
alter table jugadoras enable row level security;
alter table jornadas enable row level security;
alter table partidos enable row level security;
alter table alineaciones enable row level security;
alter table goles enable row level security;
alter table tarjetas enable row level security;
alter table suspensiones enable row level security;
alter table avisos enable row level security;
alter table reglamentos enable row level security;
alter table perfiles_admin enable row level security;

create policy "lectura publica torneos" on torneos for select using (true);
create policy "escritura admin torneos" on torneos for all using (is_admin()) with check (is_admin());

create policy "lectura publica equipos" on equipos for select using (true);
create policy "escritura admin equipos" on equipos for all using (is_admin()) with check (is_admin());

create policy "lectura publica jugadoras" on jugadoras for select using (true);
create policy "escritura admin jugadoras" on jugadoras for all using (is_admin()) with check (is_admin());

create policy "lectura publica jornadas" on jornadas for select using (true);
create policy "escritura admin jornadas" on jornadas for all using (is_admin()) with check (is_admin());

create policy "lectura publica partidos" on partidos for select using (true);
create policy "escritura admin partidos" on partidos for all using (is_admin()) with check (is_admin());

create policy "lectura publica alineaciones" on alineaciones for select using (true);
create policy "escritura admin alineaciones" on alineaciones for all using (is_admin()) with check (is_admin());

create policy "lectura publica goles" on goles for select using (true);
create policy "escritura admin goles" on goles for all using (is_admin()) with check (is_admin());

create policy "lectura publica tarjetas" on tarjetas for select using (true);
create policy "escritura admin tarjetas" on tarjetas for all using (is_admin()) with check (is_admin());

create policy "lectura publica suspensiones" on suspensiones for select using (true);
create policy "escritura admin suspensiones" on suspensiones for all using (is_admin()) with check (is_admin());

create policy "lectura publica avisos" on avisos for select using (true);
create policy "escritura admin avisos" on avisos for all using (is_admin()) with check (is_admin());

create policy "lectura publica reglamentos" on reglamentos for select using (true);
create policy "escritura admin reglamentos" on reglamentos for all using (is_admin()) with check (is_admin());

create policy "admin lee su propio perfil" on perfiles_admin for select using (auth.uid() = id);
```

- [ ] **Step 2: Escribir la migración de almacenamiento**

```sql
-- supabase/migrations/0003_storage.sql
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "lectura publica media" on storage.objects
  for select using (bucket_id = 'media');

create policy "escritura admin media" on storage.objects
  for insert with check (bucket_id = 'media' and is_admin());

create policy "actualizacion admin media" on storage.objects
  for update using (bucket_id = 'media' and is_admin());

create policy "borrado admin media" on storage.objects
  for delete using (bucket_id = 'media' and is_admin());
```

- [ ] **Step 3: Escribir la migración de datos iniciales**

```sql
-- supabase/migrations/0004_seed_torneos.sql
insert into torneos (nombre, categoria, temporada, activo)
select 'Torneo Femenil', 'femenil', '2026', true
where not exists (
  select 1 from torneos where categoria = 'femenil' and temporada = '2026'
);

insert into torneos (nombre, categoria, temporada, activo)
select 'Torneo Mixto', 'mixto', '2026', true
where not exists (
  select 1 from torneos where categoria = 'mixto' and temporada = '2026'
);
```

- [ ] **Step 4: Escribir el script de verificación estática**

```js
// scripts/check-security-sql.mjs
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
```

- [ ] **Step 5: Agregar el script a `package.json`**

```json
"check:security": "node scripts/check-security-sql.mjs"
```

- [ ] **Step 6: Ejecutar la verificación**

Run: `npm run check:security`
Expected: `OK: RLS habilitado en todas las tablas y bucket de storage configurado`

- [ ] **Step 7: Commit**

```bash
git add package.json supabase/migrations scripts/check-security-sql.mjs
git commit -m "feat: add RLS policies, storage bucket, and seed data"
```

---

### Task 7: 🔒 Punto de control — aplicar el esquema a Supabase real

**Requiere:** las credenciales de `docs/setup/cuentas-y-accesos.md` (URL, anon key y service role key de `copasolose-staging` y `copasolose-production`). No continuar hasta tenerlas.

**Files:**
- Create: `scripts/verify-schema.mjs`
- Modify: `package.json` (agregar el script `verify:schema`)

**Interfaces:**
- Consumes: `@supabase/supabase-js` (ya instalado en Task 3).
- Produces: confirmación de que las 12 tablas existen y son accesibles en cada proyecto real.

- [ ] **Step 1: Escribir el script de verificación contra una base de datos real**

```js
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
```

- [ ] **Step 2: Agregar el script a `package.json`**

```json
"verify:schema": "node scripts/verify-schema.mjs"
```

- [ ] **Step 3: Conectar y aplicar migraciones en staging**

```bash
npx supabase login
npx supabase link --project-ref <REF_DE_COPASOLOSE_STAGING>
npx supabase db push
```

Expected: el CLI lista las 4 migraciones y confirma que se aplicaron sin errores.

- [ ] **Step 4: Verificar staging**

```bash
SUPABASE_URL=<URL_DE_STAGING> SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_DE_STAGING> npm run verify:schema
```

Expected: `OK: las 12 tablas existen y son accesibles en <URL_DE_STAGING>`

- [ ] **Step 5: Conectar y aplicar migraciones en producción**

```bash
npx supabase link --project-ref <REF_DE_COPASOLOSE_PRODUCTION>
npx supabase db push
```

- [ ] **Step 6: Verificar producción**

```bash
SUPABASE_URL=<URL_DE_PRODUCTION> SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_DE_PRODUCTION> npm run verify:schema
```

Expected: `OK: las 12 tablas existen y son accesibles en <URL_DE_PRODUCTION>`

- [ ] **Step 7: Crear la primera cuenta de administradora**

En el panel de Supabase de **cada** proyecto (staging y producción): Authentication → Add user (correo + contraseña) para cada una de las 2-4 administradoras. Luego, en el SQL Editor de cada proyecto:

```sql
insert into perfiles_admin (id, nombre)
values ('<uuid-del-usuario-creado>', 'Nombre de la administradora');
```

- [ ] **Step 8: Commit**

```bash
git add package.json scripts/verify-schema.mjs
git commit -m "feat: add live schema verification script"
```

---

### Task 8: Login de administración

**Files:**
- Create: `src/lib/auth/login-form.ts`
- Test: `src/lib/auth/login-form.test.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/sign-out-button.tsx`
- Create: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `createClient()` de `src/lib/supabase/client.ts` (Task 3) y de `src/lib/supabase/server.ts` (Task 3).
- Produces: `validateLoginForm(values): LoginFormErrors` — reutilizable si se agregan más formularios de auth en el futuro.

- [ ] **Step 1: Escribir la prueba de validación (falla)**

```ts
// src/lib/auth/login-form.test.ts
import { describe, expect, it } from "vitest";
import { validateLoginForm } from "./login-form";

describe("validateLoginForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateLoginForm({ email: "admin@solose.mx", password: "unaClave123" })
    ).toEqual({});
  });

  it("requires a non-empty email", () => {
    expect(
      validateLoginForm({ email: "", password: "unaClave123" }).email
    ).toBe("El correo es obligatorio.");
  });

  it("rejects an invalid email format", () => {
    expect(
      validateLoginForm({ email: "no-es-correo", password: "x" }).email
    ).toBe("Escribe un correo válido.");
  });

  it("requires a non-empty password", () => {
    expect(
      validateLoginForm({ email: "admin@solose.mx", password: "" }).password
    ).toBe("La contraseña es obligatoria.");
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run src/lib/auth/login-form.test.ts`
Expected: FAIL — `Cannot find module './login-form'`.

- [ ] **Step 3: Implementación mínima**

```ts
// src/lib/auth/login-form.ts
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "El correo es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Escribe un correo válido.";
  }

  if (!values.password) {
    errors.password = "La contraseña es obligatoria.";
  }

  return errors;
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm test`
Expected: todos los archivos de prueba pasan.

- [ ] **Step 5: Crear la página de login**

```tsx
// src/app/admin/login/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateLoginForm, type LoginFormErrors } from "@/lib/auth/login-form";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorGeneral(null);

    const validationErrors = validateLoginForm({ email, password });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);

    if (error) {
      setErrorGeneral("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Acceso de administración</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <label className="flex flex-col gap-1">
          <span>Correo</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border px-3 py-2"
          />
          {errors.email && <span className="text-sm text-red-600">{errors.email}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border px-3 py-2"
          />
          {errors.password && (
            <span className="text-sm text-red-600">{errors.password}</span>
          )}
        </label>
        {errorGeneral && <p className="text-sm text-red-600">{errorGeneral}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Crear el botón de cerrar sesión**

```tsx
// src/app/admin/sign-out-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="text-sm underline">
      Cerrar sesión
    </button>
  );
}
```

- [ ] **Step 7: Crear el layout protegido**

```tsx
// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold">Copa Solose — Administración</span>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

Nota: el layout no vuelve a comprobar la sesión — el middleware (Task 4) ya redirige a `/admin/login` a quien no tenga sesión antes de que este layout se renderice, salvo en `/admin/login` mismo (excluida a propósito).

- [ ] **Step 8: Crear una página de inicio mínima para `/admin`**

```tsx
// src/app/admin/page.tsx
export default function AdminHomePage() {
  return <p>Bienvenida al panel de administración de Copa Solose.</p>;
}
```

- [ ] **Step 9: Verificar que compila**

Run: `npm run build`
Expected: `✓ Compiled successfully`, con `/admin`, `/admin/login` listadas entre las rutas.

- [ ] **Step 10: Commit**

```bash
git add src/lib/auth/login-form.ts src/lib/auth/login-form.test.ts src/app/admin
git commit -m "feat: add admin login flow"
```

---

### Task 9: 🔒 Despliegue en Vercel (staging + producción)

**Requiere:** Task 7 completada (esquema aplicado) y la cuenta de Vercel de `docs/setup/cuentas-y-accesos.md` con el repositorio de GitHub ya importado.

**Files:**
- Create: `src/app/api/health/route.ts`

**Interfaces:**
- Consumes: `createClient()` de `src/lib/supabase/server.ts` (Task 3).

- [ ] **Step 1: Crear el endpoint de salud**

```ts
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("torneos").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run build`
Expected: `/api/health` aparece listada entre las rutas.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/health
git commit -m "feat: add Supabase connectivity health check"
```

- [ ] **Step 4: Conectar el repositorio con GitHub y subir el código**

Si el repositorio local todavía no apunta al repositorio de GitHub que creó Solose
(`docs/setup/cuentas-y-accesos.md`, paso 1):

```bash
git remote add origin <URL_DEL_REPOSITORIO_DE_GITHUB>
```

Luego sube el código:

```bash
git push -u origin main
```

- [ ] **Step 5: Importar el proyecto en Vercel**

En el dashboard de Vercel: **Add New… → Project**, selecciona el repositorio `copa-solose`. El framework se detecta solo como Next.js — no cambies nada más en esta pantalla todavía.

- [ ] **Step 6: Configurar variables de entorno de Producción**

Antes de desplegar, en **Environment Variables**, con el scope **Production** marcado, agrega (usando los valores de `copasolose-production`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 7: Configurar variables de entorno de Preview**

Cambia el scope a **Preview** y agrega las mismas 2 variables, pero con los valores de `copasolose-staging`. Esto hace que cada vista previa (staging) hable con la base de datos de pruebas, y producción con la real.

- [ ] **Step 8: Desplegar**

Haz clic en **Deploy** y espera a que termine.

- [ ] **Step 9: Verificar producción**

Abre `https://<tu-dominio-de-produccion>.vercel.app/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 10: Verificar staging**

Crea una rama, haz un cambio trivial (por ejemplo un comentario), súbela, y abre la URL de vista previa que Vercel genera automáticamente en `/api/health`.
Expected: `{"status":"ok"}`, confirmando que la vista previa usa el proyecto de staging.

- [ ] **Step 11: Fusionar y limpiar la rama de prueba**

```bash
git checkout main
git branch -D <rama-de-prueba>
```

---

## Al terminar

Con esto, Copa Solose tiene: proyecto Next.js funcionando, las 12 tablas del modelo de datos con RLS, login de administración, y despliegue automático a staging/producción. El siguiente plan (**Administración — datos base**) construye sobre esta base para dar de alta torneos, equipos y jugadoras desde `/admin`.
