# Fase 4a — Principal, calendario y detalle de partido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first slice of the public (no-login) site: the landing page with avisos and torneo selection, the per-torneo navigation shell, the calendario, and the match detail page — all read-only, all consuming data already captured by the admin side (Fases 2-3).

**Architecture:** Server Components fetch via the same RLS-enforced `createClient()` used everywhere else — the `anon` role already has public SELECT on every table involved (`torneos`, `equipos`, `jugadoras`, `jornadas`, `partidos`, `alineaciones`, `goles`, `tarjetas`, `avisos`), granted back in the Fundación phase's `0002_rls_policies.sql`. No auth, no proxy involvement (the proxy only matches `/admin/:path*`). A small `contarMarcador` pure helper (extracted and tested here for the first time) computes a partido's score by checking each gol's `jugadora_id` against each team's roster — the same logic the admin capture screen already has inline, now reusable and unit-tested, addressing a gap a prior phase's final review flagged.

**Tech Stack:** Same as prior phases (Next.js 16, React 19, TypeScript, Tailwind, Vitest, `@supabase/ssr`). No new dependencies.

## Global Constraints

- Toda la interfaz usa lenguaje femenino.
- El marcador de un partido se deriva SIEMPRE contando `goles` contra el roster de cada equipo — nunca un valor guardado.
- Un partido se considera "ya jugado" (y por lo tanto muestra marcador) cuando su `fecha` existe y no es posterior a hoy; si no tiene fecha o es futura, se muestra "vs" sin marcador.
- Cualquier nombre de equipo o de jugadora que aparezca en una pantalla pública es un link a su ficha — implementado como los componentes reutilizables `NombreEquipo`/`NombreJugadora` de este plan, usados en todas las pantallas públicas de esta fase y las siguientes (regla transversal del diseño original).
- Toda query de lista (incluida cualquier query de apoyo usada solo para construir un mapa de nombres) revisa su `error` y bloquea/oculta lo que dependa de ella con un mensaje visible en vez de mostrar datos vacíos como si fueran reales — lección de las revisiones finales de Fases 3a/3b.
- No hay escritura en ninguna pantalla de esta fase — son de solo lectura. No aplica el patrón de `"use server"`/try-catch de las fases de administración porque no hay Server Actions aquí.
- Costo $0/mes, sin dependencias nuevas.

---

## File Structure

```
src/
├── lib/
│   ├── marcador.ts / marcador.test.ts        # NEW: contarMarcador (pure, tested)
│   └── supabase/server.ts                     # (unchanged, reused)
├── components/
│   └── public/
│       ├── nombre-equipo.tsx                   # NEW
│       └── nombre-jugadora.tsx                 # NEW
└── app/
    ├── page.tsx                                # MODIFY: replace create-next-app boilerplate with Principal
    ├── torneos/
    │   └── [torneoId]/
    │       ├── layout.tsx                       # NEW: nav shell (menu + "cambiar torneo")
    │       └── calendario/
    │           └── page.tsx                     # NEW
    └── partidos/
        └── [partidoId]/
            └── page.tsx                          # NEW: detalle de partido
```

---

### Task 1: Componentes de nombre enlazado + helper de marcador

**Files:**
- Create: `src/components/public/nombre-equipo.tsx`
- Create: `src/components/public/nombre-jugadora.tsx`
- Create: `src/lib/marcador.ts`
- Test: `src/lib/marcador.test.ts`

**Interfaces:**
- Produces: `<NombreEquipo id nombre />`, `<NombreJugadora id nombre />` — used by every public screen in this plan and the ones that follow (Fases 4b/4c). `contarMarcador(goles: {jugadoraId: string}[], idsLocal: Set<string>, idsVisitante: Set<string>): {golesLocal: number, golesVisitante: number}` — used by Task 4 (calendario) and Task 5 (detalle de partido).

- [ ] **Step 1: Write the failing test for `contarMarcador`**

```ts
// src/lib/marcador.test.ts
import { describe, expect, it } from "vitest";
import { contarMarcador } from "./marcador";

describe("contarMarcador", () => {
  it("counts goals for the local team", () => {
    const resultado = contarMarcador(
      [{ jugadoraId: "j1" }, { jugadoraId: "j1" }],
      new Set(["j1"]),
      new Set(["j2"])
    );
    expect(resultado).toEqual({ golesLocal: 2, golesVisitante: 0 });
  });

  it("counts goals for the visitante team", () => {
    const resultado = contarMarcador([{ jugadoraId: "j2" }], new Set(["j1"]), new Set(["j2"]));
    expect(resultado).toEqual({ golesLocal: 0, golesVisitante: 1 });
  });

  it("returns 0-0 when there are no goles", () => {
    expect(contarMarcador([], new Set(["j1"]), new Set(["j2"]))).toEqual({
      golesLocal: 0,
      golesVisitante: 0,
    });
  });

  it("ignores a gol from a jugadora on neither roster", () => {
    const resultado = contarMarcador([{ jugadoraId: "j3" }], new Set(["j1"]), new Set(["j2"]));
    expect(resultado).toEqual({ golesLocal: 0, golesVisitante: 0 });
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/marcador.test.ts`
Expected: FAIL — `Cannot find module './marcador'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/marcador.ts
export interface GolParaContar {
  jugadoraId: string;
}

export function contarMarcador(
  goles: GolParaContar[],
  idsJugadorasLocal: Set<string>,
  idsJugadorasVisitante: Set<string>
): { golesLocal: number; golesVisitante: number } {
  let golesLocal = 0;
  let golesVisitante = 0;

  for (const gol of goles) {
    if (idsJugadorasLocal.has(gol.jugadoraId)) {
      golesLocal += 1;
    } else if (idsJugadorasVisitante.has(gol.jugadoraId)) {
      golesVisitante += 1;
    }
  }

  return { golesLocal, golesVisitante };
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 4 new ones.

- [ ] **Step 5: Nombre-enlazado components**

```tsx
// src/components/public/nombre-equipo.tsx
import Link from "next/link";

export function NombreEquipo({ id, nombre }: { id: string; nombre: string }) {
  return (
    <Link href={`/equipos/${id}`} className="underline">
      {nombre}
    </Link>
  );
}
```

```tsx
// src/components/public/nombre-jugadora.tsx
import Link from "next/link";

export function NombreJugadora({ id, nombre }: { id: string; nombre: string }) {
  return (
    <Link href={`/jugadoras/${id}`} className="underline">
      {nombre}
    </Link>
  );
}
```

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully` (these components aren't used by any page yet, but must compile cleanly).

- [ ] **Step 7: Commit**

```bash
git add src/lib/marcador.ts src/lib/marcador.test.ts src/components/public
git commit -m "feat: add contarMarcador helper and nombre-enlazado components for the public site"
```

---

### Task 2: Principal — avisos y selector de torneo

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`.
- Produces: the landing page (`/`), linked from Task 3's nav shell ("Cambiar torneo").

- [ ] **Step 1: Replace the homepage**

Current `src/app/page.tsx` is the unmodified `create-next-app` boilerplate. Replace its entire content with:

```tsx
// src/app/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold">Copa Solose</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Avisos</h2>
        {avisosError ? (
          <p className="text-red-600">No se pudieron cargar los avisos. Intenta de nuevo.</p>
        ) : (avisos ?? []).length === 0 ? (
          <p className="text-gray-600">No hay avisos por el momento.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(avisos ?? []).map((aviso) => (
              <li key={aviso.id} className="rounded border p-4">
                <p className="font-semibold">{aviso.titulo}</p>
                <p className="text-sm text-gray-700">{aviso.cuerpo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Elige un torneo</h2>
        {torneosError ? (
          <p className="text-red-600">No se pudieron cargar los torneos. Intenta de nuevo.</p>
        ) : (torneos ?? []).length === 0 ? (
          <p className="text-gray-600">Todavía no hay torneos activos.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {(torneos ?? []).map((torneo) => (
              <Link
                key={torneo.id}
                href={`/torneos/${torneo.id}/calendario`}
                className="rounded border p-6 text-center font-semibold underline"
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

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `/` listed as a route (dynamic, since it queries Supabase).

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace default homepage with Principal (avisos + selector de torneo)"
```

---

### Task 3: Navegación por torneo (layout compartido)

**Files:**
- Create: `src/app/torneos/[torneoId]/layout.tsx`

**Interfaces:**
- Consumes: `createClient()`.
- Produces: the shared shell that Task 4's calendario (and Fases 4b/4c's posiciones, goleadoras, suspendidas, reglamento) render inside. Its nav links to routes that don't all exist yet — expected, matches the pattern already used across the admin phases (a link to a not-yet-built sibling screen is fine; it 404s until that task lands).

- [ ] **Step 1: Layout**

```tsx
// src/app/torneos/[torneoId]/layout.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2 border-b pb-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">{torneo?.nombre ?? "Torneo"}</span>
          <Link href="/" className="text-sm underline">
            Cambiar torneo
          </Link>
        </div>
        <nav className="flex gap-4">
          <Link href={`/torneos/${torneoId}/calendario`} className="underline">
            Calendario
          </Link>
          <Link href={`/torneos/${torneoId}/posiciones`} className="underline">
            Posiciones
          </Link>
          <Link href={`/torneos/${torneoId}/goleadoras`} className="underline">
            Goleadoras
          </Link>
        </nav>
        <nav className="flex gap-4 text-sm text-gray-600">
          <Link href={`/torneos/${torneoId}/suspendidas`} className="underline">
            Suspendidas
          </Link>
          <Link href={`/torneos/${torneoId}/reglamento`} className="underline">
            Reglamento
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully` (no page under `/torneos/[torneoId]` exists yet in this task alone, so this alone doesn't add a visitable route — Task 4 adds the first one; the build should still succeed since a layout with no matching page is valid Next.js).

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/torneos"
git commit -m "feat: add shared navigation shell for per-torneo public pages"
```

---

### Task 4: Calendario

**Files:**
- Create: `src/app/torneos/[torneoId]/calendario/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `contarMarcador` from `@/lib/marcador` (Task 1).
- Produces: the first real child page inside Task 3's layout. Each partido row links to `/partidos/[partidoId]`, built in Task 5.

- [ ] **Step 1: Page**

```tsx
// src/app/torneos/[torneoId]/calendario/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarMarcador } from "@/lib/marcador";

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
    .select("id, nombre")
    .eq("torneo_id", torneoId);

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));
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

  const hoy = new Date().toISOString().slice(0, 10);
  const hayError = Boolean(
    jornadasError || equiposError || jugadorasError || partidosError || golesError
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Calendario</h1>
      {hayError ? (
        <p className="text-red-600">No se pudo cargar el calendario. Intenta de nuevo.</p>
      ) : (
        (jornadas ?? []).map((jornada) => (
          <section key={jornada.id} className="flex flex-col gap-2">
            <h2 className="font-semibold">{jornada.etiqueta}</h2>
            <ul className="flex flex-col gap-2">
              {(partidosPorJornada.get(jornada.id) ?? []).map((partido) => {
                const yaJugado = Boolean(partido.fecha && partido.fecha <= hoy);
                const { golesLocal, golesVisitante } = contarMarcador(
                  golesPorPartido.get(partido.id) ?? [],
                  idsPorEquipo.get(partido.equipo_local_id) ?? new Set(),
                  idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set()
                );

                return (
                  <li key={partido.id} className="rounded border p-3">
                    <Link
                      href={`/partidos/${partido.id}`}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {nombrePorEquipo.get(partido.equipo_local_id) ?? "Equipo"}
                        {yaJugado ? ` ${golesLocal} — ${golesVisitante} ` : " vs "}
                        {nombrePorEquipo.get(partido.equipo_visitante_id) ?? "Equipo"}
                      </span>
                      <span className="text-sm text-gray-500">
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

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/torneos/[torneoId]/calendario` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/torneos/[torneoId]/calendario"
git commit -m "feat: add public calendario screen"
```

---

### Task 5: Detalle de partido

**Files:**
- Create: `src/app/partidos/[partidoId]/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `contarMarcador`, `NombreEquipo`, `NombreJugadora` (all from Task 1).
- Produces: the page Task 4's calendario links to. This is the last task of Fase 4a.

- [ ] **Step 1: Page**

```tsx
// src/app/partidos/[partidoId]/page.tsx
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

  const { data: partido } = await supabase
    .from("partidos")
    .select(
      "id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora, mvp_jugadora_id, incidencias"
    )
    .eq("id", partidoId)
    .maybeSingle();

  if (!partido) {
    notFound();
  }

  const { data: jornada } = await supabase
    .from("jornadas")
    .select("etiqueta")
    .eq("id", partido.jornada_id)
    .maybeSingle();

  const { data: equipoLocal } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_local_id)
    .maybeSingle();

  const { data: equipoVisitante } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_visitante_id)
    .maybeSingle();

  const { data: jugadorasLocal } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_local_id);

  const { data: jugadorasVisitante } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_visitante_id);

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const nombrePorJugadora = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      jugadora.nombre,
    ])
  );

  const { data: alineaciones } = await supabase
    .from("alineaciones")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const { data: goles } = await supabase
    .from("goles")
    .select("jugadora_id, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("jugadora_id, tipo, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

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
      <h1 className="text-xl font-semibold">
        <NombreEquipo id={partido.equipo_local_id} nombre={equipoLocal?.nombre ?? "Local"} />{" "}
        {golesLocal} — {golesVisitante}{" "}
        <NombreEquipo
          id={partido.equipo_visitante_id}
          nombre={equipoVisitante?.nombre ?? "Visitante"}
        />
      </h1>
      <p className="text-sm text-gray-600">
        {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
      </p>

      <section>
        <h2 className="font-semibold">Alineaciones</h2>
        <div className="flex flex-wrap gap-8">
          <ul>
            {jugadorasQueJugaronLocal.map((jugadora) => (
              <li key={jugadora.id}>
                <NombreJugadora id={jugadora.id} nombre={jugadora.nombre} />
              </li>
            ))}
          </ul>
          <ul>
            {jugadorasQueJugaronVisitante.map((jugadora) => (
              <li key={jugadora.id}>
                <NombreJugadora id={jugadora.id} nombre={jugadora.nombre} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Goles</h2>
        <ul>
          {(goles ?? []).map((gol, indice) => (
            <li key={indice}>
              <NombreJugadora
                id={gol.jugadora_id}
                nombre={nombrePorJugadora.get(gol.jugadora_id) ?? "Jugadora"}
              />{" "}
              — min. {gol.minuto}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Tarjetas</h2>
        <ul>
          {(tarjetas ?? []).map((tarjeta, indice) => (
            <li key={indice}>
              <NombreJugadora
                id={tarjeta.jugadora_id}
                nombre={nombrePorJugadora.get(tarjeta.jugadora_id) ?? "Jugadora"}
              />{" "}
              — {tarjeta.tipo} — min. {tarjeta.minuto}
            </li>
          ))}
        </ul>
      </section>

      {partido.mvp_jugadora_id && (
        <p>
          Jugadora del partido:{" "}
          <NombreJugadora
            id={partido.mvp_jugadora_id}
            nombre={nombrePorJugadora.get(partido.mvp_jugadora_id) ?? "Jugadora"}
          />
        </p>
      )}

      {partido.incidencias && (
        <section>
          <h2 className="font-semibold">Incidencias</h2>
          <p>{partido.incidencias}</p>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/partidos/[partidoId]` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/partidos"
git commit -m "feat: add public match detail screen, completing Fase 4a"
```

---

## Al terminar

Con esto, cualquier persona puede entrar al sitio sin iniciar sesión, ver los avisos, elegir un torneo, revisar su calendario, y abrir el detalle de cualquier partido (marcador, alineaciones, goles, tarjetas, jugadora del partido, incidencias), con los nombres de equipos y jugadoras siempre enlazados a sus fichas — aunque esas fichas todavía no existen (se construyen en la Fase 4b). El siguiente plan (**Fase 4b — Posiciones, fichas y goleadoras**) agrega esas pantallas.
