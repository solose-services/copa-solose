# Fase 5d — Ajuste de diseño hacia el mockup de Fer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acercar el sitio público de Copa Solose al mockup de Claude Design que aprobó Fer — paneles oscuros en las pantallas "hero" (login, marcador de partido, fichas), menú de navegación inferior fijo, y varios detalles de distribución (jornadas en chips, top 4 en posiciones, bloques de estadística más grandes) — usando exclusivamente los colores ya definidos en la identidad de Solosé.

**Architecture:** Ningún cambio de esquema de base de datos. Todo lo nuevo se deriva de datos que ya existen (`hora` de partidos, `numero_camiseta` de jugadoras, `categoria` de torneo, la función `calcularPosiciones` ya existente). El "panel oscuro" es simplemente `background: var(--tinta)` con texto `var(--crema)`, aplicado como una sección más al inicio de cada página — no es un modo oscuro global ni un toggle, es parte fija del diseño de esas pantallas específicas.

**Tech Stack:** Next.js 16 App Router (Server Components), Tailwind CSS v4, los tokens y componentes de Fase 5a/5b (`Avatar`, `Logo`, `bg-crema`/`text-azul`/`text-vino`/`text-tinta`, etc.), `color-mix()` para derivar tonos nuevos sobre fondo oscuro (permitido explícitamente por el doc de identidad, sección 12: "Derivar tonos con color-mix() sobre los existentes").

## Global Constraints

- **Paneles oscuros**: fondo `var(--tinta)` (`#241D14`), texto principal `var(--crema)` (`#F4EDE0`), texto secundario `rgba(244,237,224,.5)` a `rgba(244,237,224,.7)` según jerarquía, acento `var(--azul)` (reemplaza el dorado del mockup original). Nunca negro puro.
- **El marcador sigue siendo 100% derivado de los goles** (`contarMarcador`) — esta fase NO agrega ninguna forma de editar el marcador directamente. Confirmado explícitamente con el usuario.
- **Colores nuevos derivados, no inventados**: donde se necesite un tono más claro de `--vino` sobre fondo oscuro (para que un error siga siendo legible), usar `color-mix(in srgb, var(--vino) 55%, var(--crema))` — nunca un hex nuevo fuera de la paleta.
- **Tarjeta amarilla**: se usa `#B26A12` (el tono "ocre" ya definido en la sección 3 del doc de identidad para categorías de "atención") como color del swatch — no se inventa un amarillo nuevo.
- Ninguna Server Action ni archivo `actions.ts` cambia. Ninguna migración de base de datos.
- Los 75 tests existentes (`npm test -- --run`, 17 archivos) deben seguir pasando sin cambios después de cada tarea — ninguna de estas páginas tiene tests propios (son Server Components sin lógica pura extraída), consistente con el resto del proyecto.
- **Fuera de alcance explícito de esta fase** (decisiones deliberadas, repetir en cada task brief para que nadie las "complete" por iniciativa propia): no se replica la vista de "jornada actual + jornada anterior resumida" del mockup — se simplifica a una sola jornada seleccionada; no se agrega el listado "Últimos partidos" en Ficha de jugadora; no se agrega marcador de capitana (requeriría una columna nueva en la base de datos — feature nuevo, no ajuste visual); Goleadoras no cambia en absoluto en esta fase.
- Spec de identidad completo: `IDENTIDAD-VISUAL-SOLOSE.md` (raíz del repo). Spec de diseño de Fase 5: `docs/superpowers/specs/2026-09-14-fase5-identidad-visual-design.md`.

---

### Task 1: Menú de navegación inferior (bottom tab bar)

**Files:**
- Create: `src/components/public/bottom-nav.tsx`
- Modify: `src/components/public/torneo-nav.tsx` (reemplazo completo — se reduce a solo los links secundarios)
- Modify: `src/app/torneos/[torneoId]/layout.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: nada nuevo (patrón idéntico al `TorneoNav` ya existente: Client Component con `usePathname`).
- Produces: `BottomNav({ torneoId }: { torneoId: string })` — no lo consume ninguna otra tarea de este plan, solo `TorneoLayout`.

- [ ] **Step 1: Crear `src/components/public/bottom-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ torneoId }: { torneoId: string }) {
  const pathname = usePathname();

  const enlaces = [
    { href: "/", etiqueta: "Inicio" },
    { href: `/torneos/${torneoId}/calendario`, etiqueta: "Calendario" },
    { href: `/torneos/${torneoId}/posiciones`, etiqueta: "Posiciones" },
    { href: `/torneos/${torneoId}/goleadoras`, etiqueta: "Goleadoras" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1160px] items-center justify-around border-t border-linea bg-crema px-2"
      style={{ paddingBottom: "calc(.5rem + env(safe-area-inset-bottom))", paddingTop: ".5rem" }}
    >
      {enlaces.map((enlace) => {
        const activo = pathname === enlace.href;
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={
              activo
                ? "font-mono text-[.62rem] font-medium uppercase tracking-wider text-azul"
                : "font-mono text-[.62rem] uppercase tracking-wider text-tinta-2"
            }
          >
            {enlace.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
```

Nota: "Inicio" enlaza a `/` (la página Principal global) — no existe (ni se crea en esta fase) una vista de inicio por-torneo, consistente con la decisión original del proyecto de que los avisos son globales, no por torneo.

- [ ] **Step 2: Reemplazar `src/components/public/torneo-nav.tsx`**

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
          : "border-b-2 border-transparent pb-1 font-mono text-[.68rem] uppercase tracking-wider text-tinta-2 hover:text-tinta-2"
      }
    >
      {etiqueta}
    </Link>
  );
}

export function TorneoNav({ torneoId }: { torneoId: string }) {
  const pathname = usePathname();

  const secundarios = [
    { href: `/torneos/${torneoId}/suspendidas`, etiqueta: "Suspendidas" },
    { href: `/torneos/${torneoId}/reglamento`, etiqueta: "Reglamento" },
  ];

  return (
    <nav className="flex gap-5 overflow-x-auto">
      {secundarios.map((enlace) => (
        <EnlaceNav key={enlace.href} {...enlace} activo={pathname === enlace.href} />
      ))}
    </nav>
  );
}
```

Nota: se elimina el arreglo `principales` (Calendario/Posiciones/Goleadoras) y su `<nav>` — esos tres ahora viven en `BottomNav`. La firma del componente (`{ torneoId: string }`) no cambia, así que `TorneoLayout` no necesita cambios en cómo lo invoca, solo en agregar `BottomNav` al lado.

- [ ] **Step 3: Reemplazar `src/app/torneos/[torneoId]/layout.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { TorneoNav } from "@/components/public/torneo-nav";
import { BottomNav } from "@/components/public/bottom-nav";

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
            className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-2 underline"
          >
            Cambiar torneo
          </Link>
        </div>
        <p className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-2">
          {torneo?.nombre ?? "Torneo"}
        </p>
        <TorneoNav torneoId={torneoId} />
      </header>
      <main className="flex flex-col gap-6 p-4 pb-20">{children}</main>
      <BottomNav torneoId={torneoId} />
    </div>
  );
}
```

Nota: `pb-20` en `<main>` dejar espacio para que el `BottomNav` fijo no tape el final del contenido.

- [ ] **Step 4: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sin errores.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 5: Commit**

```bash
git add src/components/public/bottom-nav.tsx src/components/public/torneo-nav.tsx "src/app/torneos/[torneoId]/layout.tsx"
git commit -m "feat: replace top primary nav with a fixed bottom tab bar

Matches the mockup's mobile-app navigation pattern. Suspendidas and
Reglamento stay in the top secondary nav; Calendario/Posiciones/
Goleadoras/Inicio move to a fixed bottom bar."
```

---

### Task 2: Login admin — tratamiento oscuro completo

**Files:**
- Modify: `src/app/admin/login/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Logo` (sin cambios).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/admin/login/page.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateLoginForm, type LoginFormErrors } from "@/lib/auth/login-form";
import { Logo } from "@/components/ui/logo";

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

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorGeneral("Correo o contraseña incorrectos.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorGeneral("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6"
      style={{ background: "var(--tinta)", color: "var(--crema)" }}
    >
      <Logo />
      <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
        Acceso de administración
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1">
          <span
            className="font-mono text-[.62rem] uppercase tracking-wider"
            style={{ color: "rgba(244,237,224,.55)" }}
          >
            Correo
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-0 border-b bg-transparent px-1 py-2 text-sm focus:border-azul focus:outline-none"
            style={{ borderBottomColor: "rgba(244,237,224,.25)", color: "var(--crema)" }}
          />
          {errors.email && (
            <span
              className="text-sm"
              style={{ color: "color-mix(in srgb, var(--vino) 55%, var(--crema))" }}
            >
              {errors.email}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span
            className="font-mono text-[.62rem] uppercase tracking-wider"
            style={{ color: "rgba(244,237,224,.55)" }}
          >
            Contraseña
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-0 border-b bg-transparent px-1 py-2 text-sm focus:border-azul focus:outline-none"
            style={{ borderBottomColor: "rgba(244,237,224,.25)", color: "var(--crema)" }}
          />
          {errors.password && (
            <span
              className="text-sm"
              style={{ color: "color-mix(in srgb, var(--vino) 55%, var(--crema))" }}
            >
              {errors.password}
            </span>
          )}
        </label>
        {errorGeneral && (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{
              borderColor: "var(--vino)",
              background: "rgba(90,42,34,.35)",
              color: "var(--crema)",
            }}
          >
            {errorGeneral}
          </p>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

Nota: los errores de campo (`errors.email`/`errors.password`) usan `color-mix(in srgb, var(--vino) 55%, var(--crema))` en vez de la utilidad `text-vino` — `--vino` es un café oscuro y sobre fondo `--tinta` (también oscuro) sería casi ilegible; mezclarlo con crema lo aclara sin salir de la paleta. Toda la lógica de `handleSubmit` (validación, `signInWithPassword`, mensajes de error, `router.push`) es idéntica a la versión anterior — solo cambian clases y estilos.

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/login/page.tsx
git commit -m "feat: apply dark tinta treatment to admin login screen

Matches the mockup's full-dark entry screen. Auth logic (validation,
signInWithPassword, error messages, redirect) is unchanged."
```

---

### Task 3: Calendario — tira de jornadas y jornada seleccionada

**Files:**
- Modify: `src/app/torneos/[torneoId]/calendario/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Avatar`, `contarMarcador` (sin cambios de firma).
- Produces: nada consumido por otras tareas. Selección de jornada vía query param `?jornada=<id>` en la misma URL — no requiere Client Component ni JavaScript, son `<Link>` normales de Next.js.

- [ ] **Step 1: Reemplazar `src/app/torneos/[torneoId]/calendario/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarMarcador } from "@/lib/marcador";
import { Avatar } from "@/components/ui/avatar";

export default async function CalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ torneoId: string }>;
  searchParams: Promise<{ jornada?: string }>;
}) {
  const { torneoId } = await params;
  const { jornada: jornadaSeleccionadaId } = await searchParams;
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
          .select("id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora")
          .in("jornada_id", jornadaIds)
      : {
          data: [] as {
            id: string;
            jornada_id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
            hora: string | null;
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

  const jornadasOrdenadas = jornadas ?? [];
  const jornadaConPartidoJugado = new Set(
    (partidos ?? [])
      .filter((partido) => partido.fecha && partido.fecha <= hoy)
      .map((partido) => partido.jornada_id)
  );
  let jornadaActualId: string | undefined = jornadasOrdenadas[0]?.id;
  for (const jornada of jornadasOrdenadas) {
    if (jornadaConPartidoJugado.has(jornada.id)) {
      jornadaActualId = jornada.id;
    }
  }

  const jornadaSeleccionada =
    jornadasOrdenadas.find((jornada) => jornada.id === jornadaSeleccionadaId) ??
    jornadasOrdenadas.find((jornada) => jornada.id === jornadaActualId) ??
    jornadasOrdenadas[0];

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
        <>
          <nav className="flex gap-3 overflow-x-auto pb-1">
            {jornadasOrdenadas.map((jornada) => {
              const activa = jornada.id === jornadaSeleccionada?.id;
              return (
                <Link
                  key={jornada.id}
                  href={`?jornada=${jornada.id}`}
                  className={
                    activa
                      ? "flex-none border-b-2 border-azul pb-1 font-mono text-[.68rem] uppercase tracking-wider text-azul"
                      : "flex-none border-b-2 border-transparent pb-1 font-mono text-[.68rem] uppercase tracking-wider text-tinta-2"
                  }
                >
                  {jornada.etiqueta}
                </Link>
              );
            })}
          </nav>

          {jornadaSeleccionada ? (
            <section className="flex flex-col gap-2">
              <p className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                {jornadaSeleccionada.etiqueta}
              </p>
              <ul className="flex flex-col gap-2">
                {(partidosPorJornada.get(jornadaSeleccionada.id) ?? []).map((partido) => {
                  const yaJugado = Boolean(partido.fecha && partido.fecha <= hoy);
                  const { golesLocal, golesVisitante } = contarMarcador(
                    golesPorPartido.get(partido.id) ?? [],
                    idsPorEquipo.get(partido.equipo_local_id) ?? new Set(),
                    idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set()
                  );
                  const local = equipoInfoPorId.get(partido.equipo_local_id);
                  const visitante = equipoInfoPorId.get(partido.equipo_visitante_id);
                  const fechaHora = [partido.fecha, partido.hora].filter(Boolean).join(" · ");

                  return (
                    <li key={partido.id} className="border-b border-linea-2 pb-2 last:border-b-0">
                      <Link
                        href={`/partidos/${partido.id}`}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="flex flex-wrap items-center gap-1.5">
                          <Avatar
                            src={local?.logoUrl ?? null}
                            nombre={local?.nombre ?? "Equipo"}
                            size={20}
                          />
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
                          {fechaHora || "Sin fecha"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-tinta-2">Todavía no hay jornadas registradas.</p>
          )}
        </>
      )}
    </div>
  );
}
```

Nota: la jornada por defecto es la de mayor `orden` que tenga al menos un partido con `fecha <= hoy` (la más reciente ya jugada); si ninguna se ha jugado, se muestra la primera. El usuario navega entre jornadas con los chips, que son links normales a `?jornada=<id>` — sin `"use client"`, sin JavaScript extra. Se simplifica intencionalmente respecto al mockup: se muestra solo la jornada seleccionada, no "jornada actual + anterior resumida".

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/torneos/[torneoId]/calendario/page.tsx"
git commit -m "feat: add jornada chip picker to Calendario

Shows all jornadas as a horizontal chip strip (?jornada=id in the
URL, no client JS needed), defaulting to the most recently played
one. Adds partido.hora next to the date. No 'en vivo' badge — that
concept doesn't exist in the data model."
```

---

### Task 4: Detalle de partido — panel oscuro y tarjeta de MVP

**Files:**
- Modify: `src/app/partidos/[partidoId]/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `NombreJugadora` (sin cambios de firma), `contarMarcador` (sin cambios).
- Produces: nada consumido por otras tareas. `NombreEquipo` deja de usarse en esta página (se reemplaza por una caja cuadrada local `CajaEquipo`, ya que el marcador ahora vive en un panel oscuro con un tratamiento visual propio, distinto del texto enlazado normal).

- [ ] **Step 1: Reemplazar `src/app/partidos/[partidoId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { contarMarcador } from "@/lib/marcador";

function CajaEquipo({ nombre, logoUrl }: { nombre: string; logoUrl: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md border font-tit text-lg"
        style={{ borderColor: "rgba(244,237,224,.35)", color: "var(--crema)" }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria pegada por el admin
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          nombre.charAt(0).toUpperCase()
        )}
      </div>
      <span
        className="font-mono text-[.62rem] uppercase tracking-wider"
        style={{ color: "rgba(244,237,224,.7)" }}
      >
        {nombre}
      </span>
    </div>
  );
}

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
    .select("id, nombre, foto_url, numero_camiseta")
    .eq("equipo_id", partido.equipo_local_id);

  const { data: jugadorasVisitante, error: jugadorasVisitanteError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta")
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

  const jugadorasQueJugaronLocal = (jugadorasLocal ?? [])
    .filter((jugadora) => (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id))
    .sort((a, b) => (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99));
  const jugadorasQueJugaronVisitante = (jugadorasVisitante ?? [])
    .filter((jugadora) => (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id))
    .sort((a, b) => (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99));

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {hayError ? (
        <div className="p-6">
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudo cargar el detalle del partido. Intenta de nuevo.
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex flex-col items-center gap-3 px-6 py-8"
            style={{ background: "var(--tinta)" }}
          >
            <div className="flex items-center gap-6">
              <CajaEquipo
                nombre={equipoLocal?.nombre ?? "Local"}
                logoUrl={equipoLocal?.logo_url ?? null}
              />
              <span className="font-tit text-4xl font-semibold" style={{ color: "var(--azul)" }}>
                {golesLocal}&ndash;{golesVisitante}
              </span>
              <CajaEquipo
                nombre={equipoVisitante?.nombre ?? "Visitante"}
                logoUrl={equipoVisitante?.logo_url ?? null}
              />
            </div>
            <p
              className="font-mono text-[.62rem] uppercase tracking-wider"
              style={{ color: "rgba(244,237,224,.5)" }}
            >
              {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
            </p>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <section>
              <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Alineaciones
                </h2>
              </div>
              <div className="mt-3 flex flex-wrap gap-8">
                <ul className="flex flex-col gap-1.5">
                  {jugadorasQueJugaronLocal.map((jugadora) => (
                    <li key={jugadora.id} className="flex items-center gap-2">
                      {jugadora.numero_camiseta != null && (
                        <span className="w-5 text-right font-mono text-xs text-tinta-2">
                          {jugadora.numero_camiseta}
                        </span>
                      )}
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
                    <li key={jugadora.id} className="flex items-center gap-2">
                      {jugadora.numero_camiseta != null && (
                        <span className="w-5 text-right font-mono text-xs text-tinta-2">
                          {jugadora.numero_camiseta}
                        </span>
                      )}
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
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Goles
                </h2>
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
              <section
                className="flex flex-col gap-1 rounded-md border border-linea p-3"
                style={{ background: "var(--papel)" }}
              >
                <span className="font-mono text-[.6rem] uppercase tracking-wider text-tinta-2">
                  Jugadora del partido
                </span>
                <NombreJugadora
                  id={partido.mvp_jugadora_id}
                  nombre={jugadoraPorId.get(partido.mvp_jugadora_id)?.nombre ?? "Jugadora"}
                  fotoUrl={jugadoraPorId.get(partido.mvp_jugadora_id)?.fotoUrl ?? null}
                />
              </section>
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
          </div>
        </>
      )}
    </div>
  );
}
```

Nota: `jugadorasLocal`/`jugadorasVisitante` ahora incluyen `numero_camiseta` en el `select()`, usado para ordenar y mostrar el número en Alineaciones. El patrón `if (!partido && !partidoError) notFound()` seguido del retorno de error separado permanece exactamente igual — no se toca. Todo el bloque de cálculo (`contarMarcador`, `jugadorasQueJugaron*`) es funcionalmente el mismo, solo se le agregó `.sort()` por número de camiseta.

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`. Confirmar además `npx vitest run src/lib/marcador.test.ts` sigue pasando (4 tests) — `contarMarcador` no cambió.

- [ ] **Step 3: Commit**

```bash
git add "src/app/partidos/[partidoId]/page.tsx"
git commit -m "feat: add dark score hero and MVP card to Detalle de partido

Score header moves into a tinta-dark panel with square team boxes
(logo or initial). MVP gets its own bordered card. Alineaciones now
show jersey numbers, sorted numerically. Scoreboard is still 100%
derived from contarMarcador — no direct score editing."
```

---

### Task 5: Posiciones — resaltar los primeros 4 lugares

**Files:**
- Modify: `src/app/torneos/[torneoId]/posiciones/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `calcularPosiciones`, `NombreEquipo` (sin cambios de firma).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/torneos/[torneoId]/posiciones/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { calcularPosiciones, type PartidoParaPosiciones } from "@/lib/posiciones";

const EQUIPOS_QUE_CLASIFICAN = 4;

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
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    Equipo
                  </th>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    PJ
                  </th>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    Pts
                  </th>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    GF
                  </th>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    GC
                  </th>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    DG
                  </th>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    TA
                  </th>
                  <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                    TR
                  </th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((fila, indice) => {
                  const clasifica = indice < EQUIPOS_QUE_CLASIFICAN;
                  const esCorte = indice === EQUIPOS_QUE_CLASIFICAN - 1;
                  return (
                    <tr
                      key={fila.equipoId}
                      className={esCorte ? "border-b-2 border-azul" : "border-b border-linea-2"}
                      style={
                        clasifica
                          ? { background: "color-mix(in srgb, var(--azul) 6%, var(--papel))" }
                          : undefined
                      }
                    >
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {tabla.length > EQUIPOS_QUE_CLASIFICAN && (
            <p className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
              Los primeros {EQUIPOS_QUE_CLASIFICAN} pasan a semifinales.
            </p>
          )}
        </>
      )}
    </div>
  );
}
```

Nota: `EQUIPOS_QUE_CLASIFICAN = 4` es una constante fija (no configurable desde el admin en esta fase) — coincide con el mockup y con que cada torneo actual tiene 8 equipos. La leyenda solo se muestra si hay más de 4 equipos en la tabla (evita un mensaje sin sentido en un torneo chico). `calcularPosiciones` no se modifica.

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`. Confirmar además `npx vitest run src/lib/posiciones.test.ts` sigue pasando (10 tests) — `calcularPosiciones` no cambió.

- [ ] **Step 3: Commit**

```bash
git add "src/app/torneos/[torneoId]/posiciones/page.tsx"
git commit -m "feat: highlight top 4 standings with a qualification line

Rows 1-4 get a subtle azul-tinted background and a solid azul rule
below row 4, plus a legend. calcularPosiciones itself is untouched."
```

---

### Task 6: Ficha de equipo — panel oscuro y estadísticas compactas

**Files:**
- Modify: `src/app/equipos/[equipoId]/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Avatar`, `NombreJugadora` (sin cambios de firma), `calcularPosiciones`/`PartidoParaPosiciones` (importados desde `@/lib/posiciones`, sin cambios de firma).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/equipos/[equipoId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { Avatar } from "@/components/ui/avatar";
import { calcularPosiciones, type PartidoParaPosiciones } from "@/lib/posiciones";

export default async function FichaEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, torneo_id, orden_desempate_manual")
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

  const { data: torneo, error: torneoError } = await supabase
    .from("torneos")
    .select("categoria")
    .eq("id", equipo.torneo_id)
    .maybeSingle();

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

  const { data: equiposTorneo, error: equiposTorneoError } = await supabase
    .from("equipos")
    .select("id, orden_desempate_manual")
    .eq("torneo_id", equipo.torneo_id);

  const equipoIdsTorneo = (equiposTorneo ?? []).map((fila) => fila.id);
  const ordenDesempateManualPorEquipo = new Map(
    (equiposTorneo ?? []).map((fila) => [fila.id, fila.orden_desempate_manual])
  );

  const { data: jugadorasTorneo, error: jugadorasTorneoError } =
    equipoIdsTorneo.length > 0
      ? await supabase.from("jugadoras").select("id, equipo_id").in("equipo_id", equipoIdsTorneo)
      : { data: [] as { id: string; equipo_id: string }[], error: null };

  const idsPorEquipoTorneo = new Map<string, Set<string>>();
  for (const jugadora of jugadorasTorneo ?? []) {
    const set = idsPorEquipoTorneo.get(jugadora.equipo_id) ?? new Set<string>();
    set.add(jugadora.id);
    idsPorEquipoTorneo.set(jugadora.equipo_id, set);
  }

  const { data: jornadasRegulares, error: jornadasRegularesError } = await supabase
    .from("jornadas")
    .select("id")
    .eq("torneo_id", equipo.torneo_id)
    .eq("tipo", "regular");

  const jornadaIdsRegulares = (jornadasRegulares ?? []).map((jornada) => jornada.id);

  const { data: partidosTorneo, error: partidosTorneoError } =
    jornadaIdsRegulares.length > 0
      ? await supabase
          .from("partidos")
          .select("id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIdsRegulares)
      : {
          data: [] as {
            id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        };

  const partidosTorneoJugados = (partidosTorneo ?? []).filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIdsTorneo = partidosTorneoJugados.map((partido) => partido.id);

  const { data: golesTorneo, error: golesTorneoError } =
    partidoIdsTorneo.length > 0
      ? await supabase
          .from("goles")
          .select("partido_id, jugadora_id")
          .in("partido_id", partidoIdsTorneo)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetasTorneo, error: tarjetasTorneoError } =
    partidoIdsTorneo.length > 0
      ? await supabase
          .from("tarjetas")
          .select("partido_id, jugadora_id, tipo")
          .in("partido_id", partidoIdsTorneo)
      : { data: [] as { partido_id: string; jugadora_id: string; tipo: string }[], error: null };

  const partidosParaCalculo: PartidoParaPosiciones[] = partidosTorneoJugados.map((partido) => {
    const idsLocalT = idsPorEquipoTorneo.get(partido.equipo_local_id) ?? new Set<string>();
    const idsVisitanteT = idsPorEquipoTorneo.get(partido.equipo_visitante_id) ?? new Set<string>();

    let golesLocalCalc = 0;
    let golesVisitanteCalc = 0;
    for (const gol of golesTorneo ?? []) {
      if (gol.partido_id !== partido.id) continue;
      if (idsLocalT.has(gol.jugadora_id)) golesLocalCalc += 1;
      else if (idsVisitanteT.has(gol.jugadora_id)) golesVisitanteCalc += 1;
    }

    let tarjetasAmarillasLocal = 0;
    let tarjetasRojasLocal = 0;
    let tarjetasAmarillasVisitante = 0;
    let tarjetasRojasVisitante = 0;
    for (const tarjeta of tarjetasTorneo ?? []) {
      if (tarjeta.partido_id !== partido.id) continue;
      const esLocal = idsLocalT.has(tarjeta.jugadora_id);
      const esVisitante = idsVisitanteT.has(tarjeta.jugadora_id);
      if (esLocal && tarjeta.tipo === "amarilla") tarjetasAmarillasLocal += 1;
      else if (esLocal && tarjeta.tipo === "roja") tarjetasRojasLocal += 1;
      else if (esVisitante && tarjeta.tipo === "amarilla") tarjetasAmarillasVisitante += 1;
      else if (esVisitante && tarjeta.tipo === "roja") tarjetasRojasVisitante += 1;
    }

    return {
      equipoLocalId: partido.equipo_local_id,
      equipoVisitanteId: partido.equipo_visitante_id,
      golesLocal: golesLocalCalc,
      golesVisitante: golesVisitanteCalc,
      tarjetasAmarillasLocal,
      tarjetasRojasLocal,
      tarjetasAmarillasVisitante,
      tarjetasRojasVisitante,
    };
  });

  const tablaTorneo = calcularPosiciones(
    equipoIdsTorneo,
    partidosParaCalculo,
    ordenDesempateManualPorEquipo
  );
  const posicion = tablaTorneo.findIndex((fila) => fila.equipoId === equipoId) + 1;

  const hayError = Boolean(
    torneoError ||
      jugadorasError ||
      partidosLocalError ||
      partidosVisitanteError ||
      golesError ||
      tarjetasError ||
      equiposTorneoError ||
      jugadorasTorneoError ||
      jornadasRegularesError ||
      partidosTorneoError ||
      golesTorneoError ||
      tarjetasTorneoError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {hayError ? (
        <div className="p-6">
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudo cargar la información del equipo. Intenta de nuevo.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 px-6 py-8" style={{ background: "var(--tinta)" }}>
            <Avatar src={equipo.logo_url} nombre={equipo.nombre} size={56} />
            <div>
              <h1
                className="font-tit text-xl uppercase tracking-tight"
                style={{ color: "var(--crema)" }}
              >
                {equipo.nombre}
              </h1>
              {posicion > 0 && (
                <p
                  className="font-mono text-[.62rem] uppercase tracking-wider"
                  style={{ color: "rgba(244,237,224,.6)" }}
                >
                  {posicion}° lugar{torneo?.categoria ? ` · ${torneo.categoria}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <dl className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Puntos
                </dt>
                <dd className="text-2xl font-semibold">{puntos}</dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Jugados
                </dt>
                <dd className="text-2xl font-semibold">{partidosJugados}</dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  G-E-P
                </dt>
                <dd className="text-2xl font-semibold">
                  {ganados}-{empatados}-{perdidos}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Dif.
                </dt>
                <dd className="text-2xl font-semibold">
                  {diferenciaGoles > 0 ? `+${diferenciaGoles}` : diferenciaGoles}
                </dd>
              </div>
            </dl>
            <div className="flex gap-6">
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "#B26A12" }}
                />
                {tarjetasAmarillas} amarillas
              </span>
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "var(--vino)" }}
                />
                {tarjetasRojas} rojas
              </span>
            </div>

            <section className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Jugadoras registradas · {jugadoras?.length ?? 0}
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
          </div>
        </>
      )}
    </div>
  );
}
```

Nota: la posición en la tabla general se calcula con la MISMA función `calcularPosiciones` que usa la página de Posiciones, reconstruyendo el mismo tipo de datos (`PartidoParaPosiciones`) a partir de TODOS los equipos del torneo — no solo este equipo. Esta duplicación de cómputo entre páginas es intencional y consistente con el resto del proyecto (cada página construye sus propios `Map` a partir de queries simples, en vez de compartir una función de fetching — ver `docs/superpowers/specs/2026-09-12-torneos-futbol-design.md`). `#B26A12` es el tono "ocre" ya definido en la sección 3 del doc de identidad (categoría "pendiente/atención"), reutilizado aquí para el swatch de tarjeta amarilla — no es un color nuevo.

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`. Confirmar además `npx vitest run src/lib/posiciones.test.ts` sigue pasando (10 tests).

- [ ] **Step 3: Commit**

```bash
git add "src/app/equipos/[equipoId]/page.tsx"
git commit -m "feat: add dark hero with tournament rank to Ficha de equipo

Rank is computed with the existing calcularPosiciones against all
teams in the tournament. Stats become 4 bigger blocks (Puntos/
Jugados/G-E-P/Dif.) plus a yellow/red card swatch row, replacing the
previous 9-number grid."
```

---

### Task 7: Ficha de jugadora — panel oscuro y contexto de goleo

**Files:**
- Modify: `src/app/jugadoras/[jugadoraId]/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Avatar`, `NombreEquipo` (sin cambios de firma).
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
    .select("id, nombre, logo_url, torneo_id")
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

  let contextoGoleo: string | null = null;
  let contextoGoleoError = false;
  if (equipo?.torneo_id && totalGoles > 0) {
    const { data: equiposTorneo, error: equiposTorneoError } = await supabase
      .from("equipos")
      .select("id")
      .eq("torneo_id", equipo.torneo_id);
    const equipoIdsTorneo = (equiposTorneo ?? []).map((fila) => fila.id);

    const { data: jugadorasTorneo, error: jugadorasTorneoError } =
      equipoIdsTorneo.length > 0
        ? await supabase.from("jugadoras").select("id").in("equipo_id", equipoIdsTorneo)
        : { data: [] as { id: string }[], error: null };
    const jugadoraIdsTorneo = (jugadorasTorneo ?? []).map((fila) => fila.id);

    const { data: golesTorneo, error: golesTorneoError } =
      jugadoraIdsTorneo.length > 0
        ? await supabase.from("goles").select("jugadora_id").in("jugadora_id", jugadoraIdsTorneo)
        : { data: [] as { jugadora_id: string }[], error: null };

    contextoGoleoError = Boolean(equiposTorneoError || jugadorasTorneoError || golesTorneoError);

    const golesPorJugadoraTorneo = new Map<string, number>();
    for (const gol of golesTorneo ?? []) {
      golesPorJugadoraTorneo.set(
        gol.jugadora_id,
        (golesPorJugadoraTorneo.get(gol.jugadora_id) ?? 0) + 1
      );
    }

    const maxGoles = Math.max(0, ...golesPorJugadoraTorneo.values());
    if (totalGoles >= maxGoles) {
      contextoGoleo = "Líder de goleo";
    } else {
      const diferencia = maxGoles - totalGoles;
      contextoGoleo = `A ${diferencia} gol${diferencia === 1 ? "" : "es"} de la líder`;
    }
  }

  const hayError = Boolean(
    equipoError ||
      companerasError ||
      alineacionesError ||
      partidosError ||
      golesError ||
      tarjetasError ||
      mvpError ||
      contextoGoleoError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {hayError ? (
        <div className="p-6">
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudo cargar la información de la jugadora. Intenta de nuevo.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 px-6 py-8" style={{ background: "var(--tinta)" }}>
            <Avatar src={jugadora.foto_url} nombre={jugadora.nombre} size={56} />
            <div>
              <h1
                className="font-tit text-xl uppercase tracking-tight"
                style={{ color: "var(--crema)" }}
              >
                {jugadora.nombre}
              </h1>
              {equipo && (
                <NombreEquipo id={equipo.id} nombre={equipo.nombre} logoUrl={equipo.logo_url} />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6">
            {contextoGoleo && (
              <p
                className="rounded-sm border-l-2 border-azul px-3 py-2.5 text-sm"
                style={{ background: "rgba(27,63,209,.07)" }}
              >
                {contextoGoleo} · {totalGoles} gol{totalGoles === 1 ? "" : "es"} en el torneo
              </p>
            )}

            <dl className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Jugados
                </dt>
                <dd className="text-2xl font-semibold">{partidoIds.length}</dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  G-E-P
                </dt>
                <dd className="text-2xl font-semibold">
                  {ganados}-{empatados}-{perdidos}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Goles
                </dt>
                <dd className="text-2xl font-semibold">{totalGoles}</dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  MVP
                </dt>
                <dd className="text-2xl font-semibold">{vecesMvp ?? 0}</dd>
              </div>
            </dl>
            <div className="flex gap-6">
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "#B26A12" }}
                />
                {totalAmarillas} amarillas
              </span>
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "var(--vino)" }}
                />
                {totalRojas} rojas
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

Nota: `contextoGoleo` solo se calcula si `totalGoles > 0` (evita 3 queries extra para jugadoras sin goles, que son la mayoría). Si esas 3 queries fallan, `contextoGoleoError` se agrega a `hayError` — no se descarta el error de una consulta secundaria como ya se documentó como regla dura del proyecto. No se agrega el listado "Últimos partidos" (fuera de alcance de esta fase).

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/jugadoras/[jugadoraId]/page.tsx"
git commit -m "feat: add dark hero and scoring context to Ficha de jugadora

'Líder de goleo' / 'A N goles de la líder' computed against the whole
tournament, only when the player has scored. Stats become 4 bigger
blocks plus a card swatch row, matching Ficha de equipo's pattern."
```

---

## Fin de Fase 5d

Al terminar la Tarea 7, el sitio público tiene el menú inferior fijo, el tratamiento de panel oscuro en login/marcador/fichas, y los detalles de distribución pedidos (chips de jornada, top 4 en posiciones, estadísticas compactas). Sigue el proceso de `finishing-a-development-branch` (merge a master, verificar build/tests, limpiar worktree, push, verificar producción con revisión visual real — este cambio es muy visible: revisar el menú inferior en una pantalla angosta/móvil, el login oscuro, y al menos una Ficha de equipo/jugadora).
