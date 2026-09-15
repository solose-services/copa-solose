# Fase 5b — Sitio público Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar la identidad visual de Solosé (tokens, tipografía, componentes de Fase 5a) a las 10 rutas públicas de Copa Solose, y mostrar por primera vez el logo de equipo / foto de jugadora junto a cada nombre.

**Architecture:** Cada página pública ya funciona correctamente (queries a Supabase, lógica de negocio) — este plan NO cambia esa lógica, solo (a) las clases Tailwind/CSS de cada elemento, (b) agrega `logo_url`/`foto_url` a los `select()` que ya traen equipos/jugadoras, y (c) conecta esos valores a `NombreEquipo`/`NombreJugadora`/`Avatar`. `NombreEquipo` y `NombreJugadora` ganan un prop opcional para no romper ningún call site que no se toque en este plan.

**Tech Stack:** Next.js 16 App Router (Server Components), Tailwind CSS v4, los tokens/componentes de Fase 5a (`font-tit`, `font-cuerpo`, `font-mono`, `bg-crema`, `text-azul`, `text-vino`, `text-tinta`/`tinta-2`/`tinta-3`, `border-linea`/`linea-2`, `Logo`, `Avatar`).

## Global Constraints

- Fase 5a ya está en `master`: tokens, tipografía, `lucide-react`, `Logo`, `Avatar` (`src/components/ui/avatar.tsx`, props `{ src: string | null; nombre: string; size?: number }`, default `size=24`).
- Patrón de encabezado de sección (spec, sección 8): `<div className="flex items-baseline gap-2 border-b-2 border-azul pb-2"><h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">TÍTULO</h2></div>`. Se usa para el título principal de cada página (como `h1`) y para cualquier sub-sección (`h2`) — verbatim, cambiando solo el texto y la etiqueta (`h1`/`h2`).
- Patrón de mensaje de error (spec, sección 8, `.msj.error`): `<p className="rounded-sm border-l-2 px-3 py-2.5 text-sm" style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}>TEXTO</p>`. Se usa como inline style (no utilidad Tailwind) porque el modificador de opacidad arbitraria de Tailwind no representa `rgba(90,42,34,.09)` con exactitud — replicar el CSS del doc de identidad tal cual.
- Estados vacíos ("no hay X todavía") NO llevan caja — solo `<p className="text-sm text-tinta-3">texto</p>`, igual que ya lo hacía Principal antes de este plan.
- Tablas: encabezados `<th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">`, filas `<tr className="border-b border-linea-2">`, celdas `<td className="p-2 text-sm">`. Sin sombras, sin fondos alternados — reglas finas de 1px, como pide la identidad.
- Listas simples (no tabla): `<li>` sin caja ni borde redondeado, separadas por `border-b border-linea-2` (excepto el último elemento). Nada de `rounded border p-3` (ese patrón de "tarjeta con borde" se elimina en todas partes salvo donde el spec lo pide explícitamente, como los botones de torneo en Principal).
- Datos (fechas, conteos, jornadas, minutos) van en `font-mono`, tamaño `.6–.72rem`, mayúsculas con `tracking-wider` cuando son etiquetas; rótulos de sección van en `font-tit` mayúsculas.
- `Avatar` se usa con `size={20}` junto a nombres en listas/tablas, y `size={64}` para la foto/logo grande de una ficha (equipo o jugadora).
- Ningún archivo `actions.ts` ni ninguna ruta bajo `src/app/admin/**` se toca en este plan — eso es Fase 5c.
- Ninguna consulta a Supabase cambia su lógica de filtrado/orden — solo se agregan columnas (`logo_url`, `foto_url`) a `select()` donde haga falta.
- No hay lógica nueva testeable con Vitest en este plan (son páginas de Server Components sin tests unitarios, consistente con el resto del proyecto) — cada tarea verifica con `npm run build` y `npm test -- --run`, que debe seguir en **17 archivos / 75 tests** (el baseline confirmado de `master` antes de este plan) después de cada tarea.
- Spec completo: `docs/superpowers/specs/2026-09-14-fase5-identidad-visual-design.md`.

---

### Task 1: `NombreEquipo` / `NombreJugadora` ganan avatar opcional

**Files:**
- Modify: `src/components/public/nombre-equipo.tsx` (reemplazo completo)
- Modify: `src/components/public/nombre-jugadora.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Avatar` de `src/components/ui/avatar.tsx` (Fase 5a).
- Produces: `NombreEquipo({ id, nombre, logoUrl? }: { id: string; nombre: string; logoUrl?: string | null })` y `NombreJugadora({ id, nombre, fotoUrl? }: { id: string; nombre: string; fotoUrl?: string | null })`. Ambos props son opcionales (default `null`), así que **ningún call site existente se rompe** — sin el prop, `Avatar` simplemente muestra el círculo con la inicial de respaldo (mejora visual automática, sin trabajo adicional). Tareas 4–10 de este plan pasan el prop real donde ya tengan el dato.

- [ ] **Step 1: Reemplazar `src/components/public/nombre-equipo.tsx`**

```tsx
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function NombreEquipo({
  id,
  nombre,
  logoUrl = null,
}: {
  id: string;
  nombre: string;
  logoUrl?: string | null;
}) {
  return (
    <Link href={`/equipos/${id}`} className="inline-flex items-center gap-1.5 underline">
      <Avatar src={logoUrl} nombre={nombre} size={20} />
      {nombre}
    </Link>
  );
}
```

- [ ] **Step 2: Reemplazar `src/components/public/nombre-jugadora.tsx`**

```tsx
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function NombreJugadora({
  id,
  nombre,
  fotoUrl = null,
}: {
  id: string;
  nombre: string;
  fotoUrl?: string | null;
}) {
  return (
    <Link href={`/jugadoras/${id}`} className="inline-flex items-center gap-1.5 underline">
      <Avatar src={fotoUrl} nombre={nombre} size={20} />
      {nombre}
    </Link>
  );
}
```

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sin errores.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)` (sin cambio — estos componentes no tienen tests propios).

- [ ] **Step 4: Commit**

```bash
git add src/components/public/nombre-equipo.tsx src/components/public/nombre-jugadora.tsx
git commit -m "feat: add optional avatar to NombreEquipo and NombreJugadora

Both gain an optional logoUrl/fotoUrl prop rendered via <Avatar>.
Backward compatible — any call site that doesn't pass it still works,
now showing the initial-fallback circle instead of nothing."
```

---

### Task 2: Encabezado y navegación del torneo

**Files:**
- Create: `src/components/public/torneo-nav.tsx`
- Modify: `src/app/torneos/[torneoId]/layout.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Logo` de `src/components/ui/logo.tsx` (Fase 5a).
- Produces: `TorneoNav({ torneoId }: { torneoId: string })` — Client Component (usa `usePathname`) que resalta el enlace activo. No lo consume ninguna otra tarea de este plan.

- [ ] **Step 1: Crear `src/components/public/torneo-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function EnlaceNav({
  href,
  etiqueta,
  activo,
}: {
  href: string;
  etiqueta: string;
  activo: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        activo
          ? "border-b-2 border-azul pb-1 font-mono text-[.68rem] uppercase tracking-wider text-azul"
          : "border-b-2 border-transparent pb-1 font-mono text-[.68rem] uppercase tracking-wider text-tinta-3 hover:text-tinta-2"
      }
    >
      {etiqueta}
    </Link>
  );
}

export function TorneoNav({ torneoId }: { torneoId: string }) {
  const pathname = usePathname();

  const principales = [
    { href: `/torneos/${torneoId}/calendario`, etiqueta: "Calendario" },
    { href: `/torneos/${torneoId}/posiciones`, etiqueta: "Posiciones" },
    { href: `/torneos/${torneoId}/goleadoras`, etiqueta: "Goleadoras" },
  ];

  const secundarios = [
    { href: `/torneos/${torneoId}/suspendidas`, etiqueta: "Suspendidas" },
    { href: `/torneos/${torneoId}/reglamento`, etiqueta: "Reglamento" },
  ];

  return (
    <>
      <nav className="flex gap-5 overflow-x-auto">
        {principales.map((enlace) => (
          <EnlaceNav key={enlace.href} {...enlace} activo={pathname === enlace.href} />
        ))}
      </nav>
      <nav className="flex gap-5 overflow-x-auto">
        {secundarios.map((enlace) => (
          <EnlaceNav key={enlace.href} {...enlace} activo={pathname === enlace.href} />
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Reemplazar `src/app/torneos/[torneoId]/layout.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { TorneoNav } from "@/components/public/torneo-nav";

export default async function TorneoLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("nombre")
    .eq("id", torneoId)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-[1160px] flex-col">
      <header
        className="sticky top-0 z-10 flex flex-col gap-3 border-b border-linea px-4 pb-3"
        style={{
          paddingTop: "calc(.55rem + env(safe-area-inset-top))",
          background: "rgba(244,237,224,.94)",
          backdropFilter: "saturate(1.4) blur(8px)",
        }}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-3 underline"
          >
            Cambiar torneo
          </Link>
        </div>
        <p className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-3">
          {torneo?.nombre ?? "Torneo"}
        </p>
        <TorneoNav torneoId={torneoId} />
      </header>
      <main className="flex flex-col gap-6 p-4">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 4: Commit**

```bash
git add src/components/public/torneo-nav.tsx src/app/torneos/\[torneoId\]/layout.tsx
git commit -m "feat: style torneo header/nav with Solosé identity

Sticky header with Logo, safe-area padding, and a client-side nav
component that underlines the active tab via usePathname()."
```

---

### Task 3: Página Principal

**Files:**
- Modify: `src/app/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Logo` (ya importado desde el fix previo).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";

export default async function PrincipalPage() {
  const supabase = await createClient();

  const { data: avisos, error: avisosError } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, fecha_publicacion")
    .order("fecha_publicacion", { ascending: false })
    .limit(10);

  const { data: torneos, error: torneosError } = await supabase
    .from("torneos")
    .select("id, nombre, categoria")
    .eq("activo", true)
    .order("nombre");

  return (
    <main className="mx-auto flex max-w-[1160px] flex-col gap-8 p-6">
      <h1>
        <Logo />
      </h1>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Avisos</h2>
        </div>
        {avisosError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudieron cargar los avisos. Intenta de nuevo.
          </p>
        ) : (avisos ?? []).length === 0 ? (
          <p className="text-sm text-tinta-3">No hay avisos por el momento.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(avisos ?? []).map((aviso) => (
              <li
                key={aviso.id}
                className="rounded-sm border-l-2 border-azul px-3 py-2.5"
                style={{ background: "rgba(27,63,209,.07)" }}
              >
                <p className="font-medium">{aviso.titulo}</p>
                <p className="text-sm text-tinta-2">{aviso.cuerpo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
            Elige un torneo
          </h2>
        </div>
        {torneosError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudieron cargar los torneos. Intenta de nuevo.
          </p>
        ) : (torneos ?? []).length === 0 ? (
          <p className="text-sm text-tinta-3">Todavía no hay torneos activos.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {(torneos ?? []).map((torneo) => (
              <Link
                key={torneo.id}
                href={`/torneos/${torneo.id}/calendario`}
                className="rounded-sm border border-linea bg-papel p-6 text-center font-medium text-tinta hover:border-azul hover:text-azul"
              >
                {torneo.nombre}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: apply Solosé identity to Principal page"
```

---

### Task 4: Calendario

**Files:**
- Modify: `src/app/torneos/[torneoId]/calendario/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Avatar` (Fase 5a). No usa `NombreEquipo` — los nombres de equipo van dentro del mismo `<Link>` que envuelve todo el renglón del partido (no se puede anidar un `<Link>` dentro de otro), así que se usa `<Avatar>` suelto junto al nombre en texto plano, como ya estaba.
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/torneos/[torneoId]/calendario/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarMarcador } from "@/lib/marcador";
import { Avatar } from "@/components/ui/avatar";

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta, orden")
    .eq("torneo_id", torneoId)
    .order("orden");

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId);

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase.from("jugadoras").select("id, equipo_id").in("equipo_id", equipoIds)
      : { data: [] as { id: string; equipo_id: string }[], error: null };

  const idsPorEquipo = new Map<string, Set<string>>();
  for (const jugadora of jugadoras ?? []) {
    const set = idsPorEquipo.get(jugadora.equipo_id) ?? new Set<string>();
    set.add(jugadora.id);
    idsPorEquipo.set(jugadora.equipo_id, set);
  }

  const jornadaIds = (jornadas ?? []).map((jornada) => jornada.id);

  const { data: partidos, error: partidosError } =
    jornadaIds.length > 0
      ? await supabase
          .from("partidos")
          .select("id, jornada_id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIds)
      : {
          data: [] as {
            id: string;
            jornada_id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        };

  const partidoIds = (partidos ?? []).map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const golesPorPartido = new Map<string, { jugadoraId: string }[]>();
  for (const gol of goles ?? []) {
    const lista = golesPorPartido.get(gol.partido_id) ?? [];
    lista.push({ jugadoraId: gol.jugadora_id });
    golesPorPartido.set(gol.partido_id, lista);
  }

  const partidosPorJornada = new Map<string, typeof partidos>();
  for (const partido of partidos ?? []) {
    const lista = partidosPorJornada.get(partido.jornada_id) ?? [];
    lista.push(partido);
    partidosPorJornada.set(partido.jornada_id, lista);
  }

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const hayError = Boolean(
    jornadasError || equiposError || jugadorasError || partidosError || golesError
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Calendario</h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el calendario. Intenta de nuevo.
        </p>
      ) : (
        (jornadas ?? []).map((jornada) => (
          <section key={jornada.id} className="flex flex-col gap-2">
            <p className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
              {jornada.etiqueta}
            </p>
            <ul className="flex flex-col gap-2">
              {(partidosPorJornada.get(jornada.id) ?? []).map((partido) => {
                const yaJugado = Boolean(partido.fecha && partido.fecha <= hoy);
                const { golesLocal, golesVisitante } = contarMarcador(
                  golesPorPartido.get(partido.id) ?? [],
                  idsPorEquipo.get(partido.equipo_local_id) ?? new Set(),
                  idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set()
                );
                const local = equipoInfoPorId.get(partido.equipo_local_id);
                const visitante = equipoInfoPorId.get(partido.equipo_visitante_id);

                return (
                  <li key={partido.id} className="border-b border-linea-2 pb-2 last:border-b-0">
                    <Link
                      href={`/partidos/${partido.id}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Avatar src={local?.logoUrl ?? null} nombre={local?.nombre ?? "Equipo"} size={20} />
                        {local?.nombre ?? "Equipo"}
                        {yaJugado ? (
                          <span className="font-mono">
                            {golesLocal} — {golesVisitante}
                          </span>
                        ) : (
                          <span className="font-mono text-tinta-3">vs</span>
                        )}
                        <Avatar
                          src={visitante?.logoUrl ?? null}
                          nombre={visitante?.nombre ?? "Equipo"}
                          size={20}
                        />
                        {visitante?.nombre ?? "Equipo"}
                      </span>
                      <span className="font-mono text-[.6rem] text-tinta-3">
                        {partido.fecha ?? "Sin fecha"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/torneos/\[torneoId\]/calendario/page.tsx
git commit -m "feat: apply Solosé identity and team avatars to Calendario"
```

---

### Task 5: Detalle de partido

**Files:**
- Modify: `src/app/partidos/[partidoId]/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `NombreEquipo`/`NombreJugadora` con sus props nuevos `logoUrl`/`fotoUrl` (Task 1).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/partidos/[partidoId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { contarMarcador } from "@/lib/marcador";

export default async function DetallePartidoPage({
  params,
}: {
  params: Promise<{ partidoId: string }>;
}) {
  const { partidoId } = await params;
  const supabase = await createClient();

  const { data: partido, error: partidoError } = await supabase
    .from("partidos")
    .select(
      "id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora, mvp_jugadora_id, incidencias"
    )
    .eq("id", partidoId)
    .maybeSingle();

  if (!partido && !partidoError) {
    notFound();
  }

  if (partidoError || !partido) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el detalle del partido. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const { data: jornada, error: jornadaError } = await supabase
    .from("jornadas")
    .select("etiqueta")
    .eq("id", partido.jornada_id)
    .maybeSingle();

  const { data: equipoLocal, error: equipoLocalError } = await supabase
    .from("equipos")
    .select("nombre, logo_url")
    .eq("id", partido.equipo_local_id)
    .maybeSingle();

  const { data: equipoVisitante, error: equipoVisitanteError } = await supabase
    .from("equipos")
    .select("nombre, logo_url")
    .eq("id", partido.equipo_visitante_id)
    .maybeSingle();

  const { data: jugadorasLocal, error: jugadorasLocalError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url")
    .eq("equipo_id", partido.equipo_local_id);

  const { data: jugadorasVisitante, error: jugadorasVisitanteError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url")
    .eq("equipo_id", partido.equipo_visitante_id);

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const jugadoraPorId = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      { nombre: jugadora.nombre, fotoUrl: jugadora.foto_url },
    ])
  );

  const { data: alineaciones, error: alineacionesError } = await supabase
    .from("alineaciones")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const { data: goles, error: golesError } = await supabase
    .from("goles")
    .select("jugadora_id, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const { data: tarjetas, error: tarjetasError } = await supabase
    .from("tarjetas")
    .select("jugadora_id, tipo, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const hayError = Boolean(
    jornadaError ||
      equipoLocalError ||
      equipoVisitanteError ||
      jugadorasLocalError ||
      jugadorasVisitanteError ||
      alineacionesError ||
      golesError ||
      tarjetasError
  );

  const { golesLocal, golesVisitante } = contarMarcador(
    (goles ?? []).map((gol) => ({ jugadoraId: gol.jugadora_id })),
    idsLocal,
    idsVisitante
  );

  const jugadorasQueJugaronLocal = (jugadorasLocal ?? []).filter((jugadora) =>
    (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
  );
  const jugadorasQueJugaronVisitante = (jugadorasVisitante ?? []).filter((jugadora) =>
    (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el detalle del partido. Intenta de nuevo.
        </p>
      ) : (
        <>
          <h1 className="flex flex-wrap items-center gap-2 font-tit text-xl uppercase tracking-tight">
            <NombreEquipo
              id={partido.equipo_local_id}
              nombre={equipoLocal?.nombre ?? "Local"}
              logoUrl={equipoLocal?.logo_url ?? null}
            />
            <span className="font-mono">
              {golesLocal} — {golesVisitante}
            </span>
            <NombreEquipo
              id={partido.equipo_visitante_id}
              nombre={equipoVisitante?.nombre ?? "Visitante"}
              logoUrl={equipoVisitante?.logo_url ?? null}
            />
          </h1>
          <p className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-3">
            {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
          </p>

          <section>
            <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
              <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                Alineaciones
              </h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-8">
              <ul className="flex flex-col gap-1.5">
                {jugadorasQueJugaronLocal.map((jugadora) => (
                  <li key={jugadora.id}>
                    <NombreJugadora
                      id={jugadora.id}
                      nombre={jugadora.nombre}
                      fotoUrl={jugadora.foto_url}
                    />
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-1.5">
                {jugadorasQueJugaronVisitante.map((jugadora) => (
                  <li key={jugadora.id}>
                    <NombreJugadora
                      id={jugadora.id}
                      nombre={jugadora.nombre}
                      fotoUrl={jugadora.foto_url}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
              <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Goles</h2>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {(goles ?? []).map((gol, indice) => (
                <li key={indice} className="flex items-center gap-2 text-sm">
                  <NombreJugadora
                    id={gol.jugadora_id}
                    nombre={jugadoraPorId.get(gol.jugadora_id)?.nombre ?? "Jugadora"}
                    fotoUrl={jugadoraPorId.get(gol.jugadora_id)?.fotoUrl ?? null}
                  />
                  <span className="font-mono text-tinta-3">min. {gol.minuto}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
              <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                Tarjetas
              </h2>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {(tarjetas ?? []).map((tarjeta, indice) => (
                <li key={indice} className="flex items-center gap-2 text-sm">
                  <NombreJugadora
                    id={tarjeta.jugadora_id}
                    nombre={jugadoraPorId.get(tarjeta.jugadora_id)?.nombre ?? "Jugadora"}
                    fotoUrl={jugadoraPorId.get(tarjeta.jugadora_id)?.fotoUrl ?? null}
                  />
                  <span className="font-mono text-tinta-3">
                    {tarjeta.tipo} — min. {tarjeta.minuto}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {partido.mvp_jugadora_id && (
            <p className="text-sm">
              Jugadora del partido:{" "}
              <NombreJugadora
                id={partido.mvp_jugadora_id}
                nombre={jugadoraPorId.get(partido.mvp_jugadora_id)?.nombre ?? "Jugadora"}
                fotoUrl={jugadoraPorId.get(partido.mvp_jugadora_id)?.fotoUrl ?? null}
              />
            </p>
          )}

          {partido.incidencias && (
            <section>
              <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Incidencias
                </h2>
              </div>
              <p className="mt-3 text-sm">{partido.incidencias}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/partidos/\[partidoId\]/page.tsx
git commit -m "feat: apply Solosé identity and avatars to Detalle de partido"
```

---

### Task 6: Posiciones

**Files:**
- Modify: `src/app/torneos/[torneoId]/posiciones/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `NombreEquipo` con `logoUrl` (Task 1). No cambia `calcularPosiciones` ni su tipo `PartidoParaPosiciones` — la lógica de cálculo es idéntica.
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/torneos/[torneoId]/posiciones/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { calcularPosiciones, type PartidoParaPosiciones } from "@/lib/posiciones";

export default async function PosicionesPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, orden_desempate_manual")
    .eq("torneo_id", torneoId)
    .order("nombre");

  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);
  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
  const ordenDesempateManualPorEquipo = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, equipo.orden_desempate_manual])
  );

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase.from("jugadoras").select("id, equipo_id").in("equipo_id", equipoIds)
      : { data: [] as { id: string; equipo_id: string }[], error: null };

  const idsPorEquipo = new Map<string, Set<string>>();
  for (const jugadora of jugadoras ?? []) {
    const set = idsPorEquipo.get(jugadora.equipo_id) ?? new Set<string>();
    set.add(jugadora.id);
    idsPorEquipo.set(jugadora.equipo_id, set);
  }

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id")
    .eq("torneo_id", torneoId)
    .eq("tipo", "regular");

  const jornadaIds = (jornadas ?? []).map((jornada) => jornada.id);

  const { data: partidosRaw, error: partidosError } =
    jornadaIds.length > 0
      ? await supabase
          .from("partidos")
          .select("id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIds)
      : {
          data: [] as {
            id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        };

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const partidosJugados = (partidosRaw ?? []).filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIds = partidosJugados.map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("partido_id, jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string; tipo: string }[], error: null };

  const partidosParaCalculo: PartidoParaPosiciones[] = partidosJugados.map((partido) => {
    const idsLocal = idsPorEquipo.get(partido.equipo_local_id) ?? new Set<string>();
    const idsVisitante = idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set<string>();

    let golesLocal = 0;
    let golesVisitante = 0;
    for (const gol of goles ?? []) {
      if (gol.partido_id !== partido.id) continue;
      if (idsLocal.has(gol.jugadora_id)) golesLocal += 1;
      else if (idsVisitante.has(gol.jugadora_id)) golesVisitante += 1;
    }

    let tarjetasAmarillasLocal = 0;
    let tarjetasRojasLocal = 0;
    let tarjetasAmarillasVisitante = 0;
    let tarjetasRojasVisitante = 0;
    for (const tarjeta of tarjetas ?? []) {
      if (tarjeta.partido_id !== partido.id) continue;
      const esLocal = idsLocal.has(tarjeta.jugadora_id);
      const esVisitante = idsVisitante.has(tarjeta.jugadora_id);
      if (esLocal && tarjeta.tipo === "amarilla") tarjetasAmarillasLocal += 1;
      else if (esLocal && tarjeta.tipo === "roja") tarjetasRojasLocal += 1;
      else if (esVisitante && tarjeta.tipo === "amarilla") tarjetasAmarillasVisitante += 1;
      else if (esVisitante && tarjeta.tipo === "roja") tarjetasRojasVisitante += 1;
    }

    return {
      equipoLocalId: partido.equipo_local_id,
      equipoVisitanteId: partido.equipo_visitante_id,
      golesLocal,
      golesVisitante,
      tarjetasAmarillasLocal,
      tarjetasRojasLocal,
      tarjetasAmarillasVisitante,
      tarjetasRojasVisitante,
    };
  });

  const tabla = calcularPosiciones(equipoIds, partidosParaCalculo, ordenDesempateManualPorEquipo);

  const hayError = Boolean(
    equiposError ||
      jugadorasError ||
      jornadasError ||
      partidosError ||
      golesError ||
      tarjetasError
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Posiciones</h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las posiciones. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Equipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  PJ
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Pts
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  GF
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  GC
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  DG
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  TA
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  TR
                </th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => (
                <tr key={fila.equipoId} className="border-b border-linea-2">
                  <td className="p-2 text-sm">
                    <NombreEquipo
                      id={fila.equipoId}
                      nombre={equipoInfoPorId.get(fila.equipoId)?.nombre ?? "Equipo"}
                      logoUrl={equipoInfoPorId.get(fila.equipoId)?.logoUrl ?? null}
                    />
                  </td>
                  <td className="p-2 text-sm">{fila.partidosJugados}</td>
                  <td className="p-2 text-sm font-medium">{fila.puntos}</td>
                  <td className="p-2 text-sm">{fila.golesFavor}</td>
                  <td className="p-2 text-sm">{fila.golesContra}</td>
                  <td className="p-2 text-sm">{fila.diferenciaGoles}</td>
                  <td className="p-2 text-sm">{fila.tarjetasAmarillas}</td>
                  <td className="p-2 text-sm">{fila.tarjetasRojas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)` — incluye `src/lib/posiciones.test.ts`, que sigue pasando porque `calcularPosiciones` no cambió.

- [ ] **Step 3: Commit**

```bash
git add src/app/torneos/\[torneoId\]/posiciones/page.tsx
git commit -m "feat: apply Solosé identity and team avatars to Posiciones"
```

---

### Task 7: Ficha de equipo

**Files:**
- Modify: `src/app/equipos/[equipoId]/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Avatar` (tamaño grande, 64px, para el logo del equipo) y `NombreJugadora` con `fotoUrl` (Task 1).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/equipos/[equipoId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { Avatar } from "@/components/ui/avatar";

export default async function FichaEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("id", equipoId)
    .maybeSingle();

  if (!equipo && !equipoError) {
    notFound();
  }

  if (equipoError || !equipo) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información del equipo. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const { data: jugadoras, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta")
    .eq("equipo_id", equipoId)
    .order("nombre");

  const idsPropias = new Set((jugadoras ?? []).map((jugadora) => jugadora.id));

  const { data: partidosLocal, error: partidosLocalError } = await supabase
    .from("partidos")
    .select("id, fecha")
    .eq("equipo_local_id", equipoId);

  const { data: partidosVisitante, error: partidosVisitanteError } = await supabase
    .from("partidos")
    .select("id, fecha")
    .eq("equipo_visitante_id", equipoId);

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const partidos = [...(partidosLocal ?? []), ...(partidosVisitante ?? [])].filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIds = partidos.map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { jugadora_id: string; tipo: string }[], error: null };

  const golesPorPartido = new Map<string, { propios: number; rivales: number }>();
  for (const partido of partidos) {
    golesPorPartido.set(partido.id, { propios: 0, rivales: 0 });
  }
  for (const gol of goles ?? []) {
    const entrada = golesPorPartido.get(gol.partido_id);
    if (!entrada) continue;
    if (idsPropias.has(gol.jugadora_id)) {
      entrada.propios += 1;
    } else {
      entrada.rivales += 1;
    }
  }

  let ganados = 0;
  let empatados = 0;
  let perdidos = 0;
  let golesFavor = 0;
  let golesContra = 0;
  for (const { propios, rivales } of golesPorPartido.values()) {
    golesFavor += propios;
    golesContra += rivales;
    if (propios > rivales) ganados += 1;
    else if (propios < rivales) perdidos += 1;
    else empatados += 1;
  }

  let tarjetasAmarillas = 0;
  let tarjetasRojas = 0;
  for (const tarjeta of tarjetas ?? []) {
    if (!idsPropias.has(tarjeta.jugadora_id)) continue;
    if (tarjeta.tipo === "amarilla") tarjetasAmarillas += 1;
    else if (tarjeta.tipo === "roja") tarjetasRojas += 1;
  }

  const partidosJugados = partidos.length;
  const puntos = ganados * 3 + empatados;
  const diferenciaGoles = golesFavor - golesContra;

  const hayError = Boolean(
    jugadorasError ||
      partidosLocalError ||
      partidosVisitanteError ||
      golesError ||
      tarjetasError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar src={equipo.logo_url} nombre={equipo.nombre} size={64} />
        <h1 className="font-tit text-xl uppercase tracking-tight">{equipo.nombre}</h1>
      </div>

      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información del equipo. Intenta de nuevo.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PJ</dt>
              <dd className="text-lg font-semibold">{partidosJugados}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PG</dt>
              <dd className="text-lg font-semibold">{ganados}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PE</dt>
              <dd className="text-lg font-semibold">{empatados}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PP</dt>
              <dd className="text-lg font-semibold">{perdidos}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">Pts</dt>
              <dd className="text-lg font-semibold">{puntos}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">GF</dt>
              <dd className="text-lg font-semibold">{golesFavor}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">GC</dt>
              <dd className="text-lg font-semibold">{golesContra}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">DG</dt>
              <dd className="text-lg font-semibold">{diferenciaGoles}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                TA / TR
              </dt>
              <dd className="text-lg font-semibold">
                {tarjetasAmarillas} / {tarjetasRojas}
              </dd>
            </div>
          </dl>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
              <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                Jugadoras
              </h2>
            </div>
            <ul className="mt-1 flex flex-col gap-1.5">
              {(jugadoras ?? []).map((jugadora) => (
                <li key={jugadora.id} className="flex items-center gap-2 text-sm">
                  <NombreJugadora
                    id={jugadora.id}
                    nombre={jugadora.nombre}
                    fotoUrl={jugadora.foto_url}
                  />
                  {jugadora.numero_camiseta != null && (
                    <span className="font-mono text-tinta-3">#{jugadora.numero_camiseta}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/equipos/\[equipoId\]/page.tsx
git commit -m "feat: apply Solosé identity to Ficha de equipo, use Avatar for team logo"
```

---

### Task 8: Ficha de jugadora

**Files:**
- Modify: `src/app/jugadoras/[jugadoraId]/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Avatar` (64px, foto de la jugadora) y `NombreEquipo` con `logoUrl` (Task 1).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/jugadoras/[jugadoraId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { Avatar } from "@/components/ui/avatar";

export default async function FichaJugadoraPage({
  params,
}: {
  params: Promise<{ jugadoraId: string }>;
}) {
  const { jugadoraId } = await params;
  const supabase = await createClient();

  const { data: jugadora, error: jugadoraError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta, equipo_id")
    .eq("id", jugadoraId)
    .maybeSingle();

  if (!jugadora && !jugadoraError) {
    notFound();
  }

  if (jugadoraError || !jugadora) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información de la jugadora. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("id", jugadora.equipo_id)
    .maybeSingle();

  const { data: companeras, error: companerasError } = await supabase
    .from("jugadoras")
    .select("id")
    .eq("equipo_id", jugadora.equipo_id);

  const idsCompaneras = new Set((companeras ?? []).map((fila) => fila.id));

  const { data: alineaciones, error: alineacionesError } = await supabase
    .from("alineaciones")
    .select("partido_id")
    .eq("jugadora_id", jugadoraId);

  const partidoIds = (alineaciones ?? []).map((fila) => fila.partido_id);

  const { data: partidos, error: partidosError } =
    partidoIds.length > 0
      ? await supabase.from("partidos").select("id").in("id", partidoIds)
      : { data: [] as { id: string }[], error: null };

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { jugadora_id: string; tipo: string }[], error: null };

  const { count: vecesMvp, error: mvpError } = await supabase
    .from("partidos")
    .select("id", { count: "exact", head: true })
    .eq("mvp_jugadora_id", jugadoraId);

  const golesPorPartido = new Map<string, { propios: number; rivales: number }>();
  for (const partido of partidos ?? []) {
    golesPorPartido.set(partido.id, { propios: 0, rivales: 0 });
  }
  for (const gol of goles ?? []) {
    const entrada = golesPorPartido.get(gol.partido_id);
    if (!entrada) continue;
    if (idsCompaneras.has(gol.jugadora_id)) {
      entrada.propios += 1;
    } else {
      entrada.rivales += 1;
    }
  }

  let ganados = 0;
  let empatados = 0;
  let perdidos = 0;
  for (const { propios, rivales } of golesPorPartido.values()) {
    if (propios > rivales) ganados += 1;
    else if (propios < rivales) perdidos += 1;
    else empatados += 1;
  }

  const totalGoles = (goles ?? []).filter((gol) => gol.jugadora_id === jugadoraId).length;
  const totalAmarillas = (tarjetas ?? []).filter(
    (tarjeta) => tarjeta.jugadora_id === jugadoraId && tarjeta.tipo === "amarilla"
  ).length;
  const totalRojas = (tarjetas ?? []).filter(
    (tarjeta) => tarjeta.jugadora_id === jugadoraId && tarjeta.tipo === "roja"
  ).length;

  const hayError = Boolean(
    equipoError ||
      companerasError ||
      alineacionesError ||
      partidosError ||
      golesError ||
      tarjetasError ||
      mvpError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar src={jugadora.foto_url} nombre={jugadora.nombre} size={64} />
        <div>
          <h1 className="font-tit text-xl uppercase tracking-tight">{jugadora.nombre}</h1>
          {equipo && (
            <NombreEquipo id={equipo.id} nombre={equipo.nombre} logoUrl={equipo.logo_url} />
          )}
        </div>
      </div>

      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información de la jugadora. Intenta de nuevo.
        </p>
      ) : (
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PJ</dt>
            <dd className="text-lg font-semibold">{partidoIds.length}</dd>
          </div>
          <div>
            <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PG</dt>
            <dd className="text-lg font-semibold">{ganados}</dd>
          </div>
          <div>
            <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PE</dt>
            <dd className="text-lg font-semibold">{empatados}</dd>
          </div>
          <div>
            <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">PP</dt>
            <dd className="text-lg font-semibold">{perdidos}</dd>
          </div>
          <div>
            <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
              Goles
            </dt>
            <dd className="text-lg font-semibold">{totalGoles}</dd>
          </div>
          <div>
            <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
              TA / TR
            </dt>
            <dd className="text-lg font-semibold">
              {totalAmarillas} / {totalRojas}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
              Veces MVP
            </dt>
            <dd className="text-lg font-semibold">{vecesMvp ?? 0}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/jugadoras/\[jugadoraId\]/page.tsx
git commit -m "feat: apply Solosé identity to Ficha de jugadora, use Avatar for player photo"
```

---

### Task 9: Goleadoras

**Files:**
- Modify: `src/app/torneos/[torneoId]/goleadoras/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `NombreJugadora`/`NombreEquipo` con `fotoUrl`/`logoUrl` (Task 1).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/torneos/[torneoId]/goleadoras/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { NombreEquipo } from "@/components/public/nombre-equipo";

export default async function GoleadorasPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId);

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, foto_url, equipo_id")
          .in("equipo_id", equipoIds)
          .order("nombre")
      : {
          data: [] as { id: string; nombre: string; foto_url: string | null; equipo_id: string }[],
          error: null,
        };

  const jugadoraIds = (jugadoras ?? []).map((jugadora) => jugadora.id);

  const { data: goles, error: golesError } =
    jugadoraIds.length > 0
      ? await supabase.from("goles").select("jugadora_id").in("jugadora_id", jugadoraIds)
      : { data: [] as { jugadora_id: string }[], error: null };

  const golesPorJugadora = new Map<string, number>();
  for (const gol of goles ?? []) {
    golesPorJugadora.set(gol.jugadora_id, (golesPorJugadora.get(gol.jugadora_id) ?? 0) + 1);
  }

  const tabla = (jugadoras ?? [])
    .map((jugadora) => ({
      id: jugadora.id,
      nombre: jugadora.nombre,
      fotoUrl: jugadora.foto_url,
      equipoId: jugadora.equipo_id,
      goles: golesPorJugadora.get(jugadora.id) ?? 0,
    }))
    .filter((fila) => fila.goles > 0)
    .sort((a, b) => b.goles - a.goles || a.nombre.localeCompare(b.nombre));

  const hayError = Boolean(equiposError || jugadorasError || golesError);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Goleadoras</h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las goleadoras. Intenta de nuevo.
        </p>
      ) : tabla.length === 0 ? (
        <p className="text-sm text-tinta-3">Todavía no hay goles registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Jugadora
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Equipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Goles
                </th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => (
                <tr key={fila.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">
                    <NombreJugadora id={fila.id} nombre={fila.nombre} fotoUrl={fila.fotoUrl} />
                  </td>
                  <td className="p-2 text-sm">
                    <NombreEquipo
                      id={fila.equipoId}
                      nombre={equipoInfoPorId.get(fila.equipoId)?.nombre ?? "Equipo"}
                      logoUrl={equipoInfoPorId.get(fila.equipoId)?.logoUrl ?? null}
                    />
                  </td>
                  <td className="p-2 text-sm font-medium">{fila.goles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/torneos/\[torneoId\]/goleadoras/page.tsx
git commit -m "feat: apply Solosé identity and avatars to Goleadoras"
```

---

### Task 10: Suspendidas

**Files:**
- Modify: `src/app/torneos/[torneoId]/suspendidas/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `NombreJugadora`/`NombreEquipo` con `fotoUrl`/`logoUrl` (Task 1).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/torneos/[torneoId]/suspendidas/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { NombreEquipo } from "@/components/public/nombre-equipo";

export default async function SuspendidasPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId);

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);

  const { data: jugadorasRaw, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, foto_url, equipo_id")
          .in("equipo_id", equipoIds)
      : {
          data: [] as { id: string; nombre: string; foto_url: string | null; equipo_id: string }[],
          error: null,
        };

  const jugadoraPorId = new Map((jugadorasRaw ?? []).map((jugadora) => [jugadora.id, jugadora]));
  const jugadoraIds = (jugadorasRaw ?? []).map((jugadora) => jugadora.id);

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta")
    .eq("torneo_id", torneoId);

  const etiquetaPorJornada = new Map(
    (jornadas ?? []).map((jornada) => [jornada.id, jornada.etiqueta])
  );

  const { data: suspensiones, error: suspensionesError } =
    jugadoraIds.length > 0
      ? await supabase
          .from("suspensiones")
          .select("id, jugadora_id, jornada_desde_id, jornada_hasta_id, motivo")
          .in("jugadora_id", jugadoraIds)
          .order("created_at", { ascending: false })
      : {
          data: [] as {
            id: string;
            jugadora_id: string;
            jornada_desde_id: string;
            jornada_hasta_id: string;
            motivo: string | null;
          }[],
          error: null,
        };

  const hayError = Boolean(
    equiposError || jugadorasError || jornadasError || suspensionesError
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Suspendidas
        </h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las suspensiones. Intenta de nuevo.
        </p>
      ) : (suspensiones ?? []).length === 0 ? (
        <p className="text-sm text-tinta-3">No hay jugadoras suspendidas por el momento.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Jugadora
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Equipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Desde
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Hasta
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody>
              {(suspensiones ?? []).map((suspension) => {
                const jugadora = jugadoraPorId.get(suspension.jugadora_id);
                const equipoInfo = jugadora ? equipoInfoPorId.get(jugadora.equipo_id) : undefined;
                return (
                  <tr key={suspension.id} className="border-b border-linea-2">
                    <td className="p-2 text-sm">
                      {jugadora ? (
                        <NombreJugadora
                          id={jugadora.id}
                          nombre={jugadora.nombre}
                          fotoUrl={jugadora.foto_url}
                        />
                      ) : (
                        "Jugadora"
                      )}
                    </td>
                    <td className="p-2 text-sm">
                      {jugadora ? (
                        <NombreEquipo
                          id={jugadora.equipo_id}
                          nombre={equipoInfo?.nombre ?? "Equipo"}
                          logoUrl={equipoInfo?.logoUrl ?? null}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 text-sm">
                      {etiquetaPorJornada.get(suspension.jornada_desde_id) ?? "—"}
                    </td>
                    <td className="p-2 text-sm">
                      {etiquetaPorJornada.get(suspension.jornada_hasta_id) ?? "—"}
                    </td>
                    <td className="p-2 text-sm">{suspension.motivo ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/torneos/\[torneoId\]/suspendidas/page.tsx
git commit -m "feat: apply Solosé identity and avatars to Suspendidas"
```

---

### Task 11: Reglamento público

**Files:**
- Modify: `src/app/torneos/[torneoId]/reglamento/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: nada de tareas anteriores (no muestra nombres de equipo/jugadora).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/torneos/[torneoId]/reglamento/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function ReglamentoPublicoPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: reglamento, error: reglamentoError } = await supabase
    .from("reglamentos")
    .select("pdf_url")
    .eq("torneo_id", torneoId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Reglamento</h1>
      </div>
      {reglamentoError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el reglamento. Intenta de nuevo.
        </p>
      ) : reglamento?.pdf_url ? (
        <div className="flex flex-col gap-3">
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-azul underline"
          >
            Abrir el reglamento en una pestaña nueva
          </a>
          <p className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
            Si no ves el PDF abajo, ábrelo en una pestaña nueva con el enlace de arriba.
          </p>
          <iframe
            src={reglamento.pdf_url}
            title="Reglamento del torneo"
            className="h-[70vh] w-full rounded-md border border-linea"
          />
        </div>
      ) : (
        <p className="text-sm text-tinta-3">
          Todavía no se ha publicado el reglamento de este torneo.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/torneos/\[torneoId\]/reglamento/page.tsx
git commit -m "feat: apply Solosé identity to Reglamento público, add mobile PDF fallback hint"
```

---

## Fin de Fase 5b

Al terminar la Tarea 11, las 10 rutas públicas y los 2 componentes de nombre enlazado tienen la identidad visual completa de Solosé, con avatares de equipo/jugadora visibles en todos lados donde el admin ya haya cargado `logo_url`/`foto_url`. Sigue el proceso de `finishing-a-development-branch` (merge a master, verificar build/tests en master, limpiar worktree, push, verificar producción — este merge SÍ cambia visualmente todas las páginas públicas, hacer una revisión visual real antes de dar por cerrada la fase). Fase 5c (admin) queda como el siguiente y último sub-plan del proyecto.
