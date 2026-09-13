# Fase 4c — Suspendidas y reglamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the MVP described in the original design: the two remaining "más información" screens (Suspendidas, Reglamento), plus a data-integrity fix in the admin Suspensiones form that a prior phase's final review flagged as a prerequisite for this exact phase.

**Architecture:** Same Server Component + RLS-enforced `createClient()` pattern as every prior public-site phase. Task 1 is the only admin-side change in this plan — everything else is read-only public pages.

**Tech Stack:** Same as prior phases (Next.js 16, React 19, TypeScript, Tailwind, Vitest, `@supabase/ssr`). No new dependencies.

## Context carried over from Fase 3b's final review

Fase 3b's admin Suspensiones form only validated that `jugadoraId`, `jornadaDesdeId`, and `jornadaHastaId` were present — nothing stopped an admin from picking a `jornadaHasta` earlier than `jornadaDesde`, or jornadas from a different torneo than the jugadora's own team. That review flagged this as something that "silently means never suspended" to whatever public screen eventually consumes this data — which is exactly this phase's Suspendidas screen. **Task 1 fixes this before Task 2 builds on top of the data it produces.**

## Global Constraints

- Toda la interfaz usa lenguaje femenino.
- Las suspensiones siguen siendo manuales (sin cálculo automático desde tarjetas rojas) — Task 1 solo agrega validación de que el rango tenga sentido, no cambia esa decisión de diseño.
- Todo Supabase call dentro de una función `"use server"` va envuelto en `try/catch`; toda query de lista revisa su `error`.
- Cualquier nombre de equipo o de jugadora es un link a su ficha, vía `NombreEquipo`/`NombreJugadora`.
- Costo $0/mes, sin dependencias nuevas.

---

## File Structure

```
src/
└── app/
    ├── admin/(protected)/
    │   └── suspensiones/
    │       └── actions.ts                        # MODIFY: add cross-field validation to crearSuspension
    └── torneos/
        └── [torneoId]/
            ├── suspendidas/
            │   └── page.tsx                        # NEW
            └── reglamento/
                └── page.tsx                         # NEW (public — different path from the admin upload page)
```

---

### Task 1: Validar el rango de una suspensión antes de guardarla

**Files:**
- Modify: `src/app/admin/(protected)/suspensiones/actions.ts`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`.
- Produces: no new exports — `crearSuspension`'s signature and return type (`CrearSuspensionState`) stay exactly as they are; only its internal validation grows. `eliminarSuspension` is untouched.

- [ ] **Step 1: Read the current file**

Open `src/app/admin/(protected)/suspensiones/actions.ts` and confirm its current `crearSuspension` matches (from Fase 3b):

```ts
export async function crearSuspension(
  _prevState: CrearSuspensionState,
  formData: FormData
): Promise<CrearSuspensionState> {
  const values = {
    jugadoraId: String(formData.get("jugadoraId") ?? ""),
    jornadaDesdeId: String(formData.get("jornadaDesdeId") ?? ""),
    jornadaHastaId: String(formData.get("jornadaHastaId") ?? ""),
    motivo: String(formData.get("motivo") ?? ""),
  };

  const errors = validateSuspensionForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("suspensiones").insert({
      jugadora_id: values.jugadoraId,
      jornada_desde_id: values.jornadaDesdeId,
      jornada_hasta_id: values.jornadaHastaId,
      motivo: values.motivo || null,
    });

    if (error) {
      return {
        errors: {},
        errorGeneral: "No se pudo registrar la suspensión. Intenta de nuevo.",
      };
    }

    revalidatePath("/admin/suspensiones");
    return { errors: {} };
  } catch {
    return {
      errors: {},
      errorGeneral: "No se pudo registrar la suspensión. Intenta de nuevo.",
    };
  }
}
```

- [ ] **Step 2: Replace it with the version that adds cross-field validation**

```ts
export async function crearSuspension(
  _prevState: CrearSuspensionState,
  formData: FormData
): Promise<CrearSuspensionState> {
  const values = {
    jugadoraId: String(formData.get("jugadoraId") ?? ""),
    jornadaDesdeId: String(formData.get("jornadaDesdeId") ?? ""),
    jornadaHastaId: String(formData.get("jornadaHastaId") ?? ""),
    motivo: String(formData.get("motivo") ?? ""),
  };

  const errors = validateSuspensionForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();

    const { data: jugadora, error: jugadoraError } = await supabase
      .from("jugadoras")
      .select("equipo_id")
      .eq("id", values.jugadoraId)
      .maybeSingle();

    const { data: equipo, error: equipoError } = jugadora
      ? await supabase
          .from("equipos")
          .select("torneo_id")
          .eq("id", jugadora.equipo_id)
          .maybeSingle()
      : { data: null, error: null };

    const { data: jornadaDesde, error: jornadaDesdeError } = await supabase
      .from("jornadas")
      .select("torneo_id, orden")
      .eq("id", values.jornadaDesdeId)
      .maybeSingle();

    const { data: jornadaHasta, error: jornadaHastaError } = await supabase
      .from("jornadas")
      .select("torneo_id, orden")
      .eq("id", values.jornadaHastaId)
      .maybeSingle();

    if (jugadoraError || equipoError || jornadaDesdeError || jornadaHastaError) {
      return {
        errors: {},
        errorGeneral: "No se pudo validar la información. Intenta de nuevo.",
      };
    }

    if (!jugadora || !equipo || !jornadaDesde || !jornadaHasta) {
      return {
        errors: {},
        errorGeneral: "No se pudo encontrar la información seleccionada. Intenta de nuevo.",
      };
    }

    if (jornadaDesde.torneo_id !== equipo.torneo_id || jornadaHasta.torneo_id !== equipo.torneo_id) {
      return {
        errors: {
          jornadaDesdeId: "Las jornadas deben ser del mismo torneo que el equipo de la jugadora.",
        },
      };
    }

    if (jornadaHasta.orden < jornadaDesde.orden) {
      return {
        errors: {
          jornadaHastaId: "La jornada final no puede ser anterior a la jornada de inicio.",
        },
      };
    }

    const { error } = await supabase.from("suspensiones").insert({
      jugadora_id: values.jugadoraId,
      jornada_desde_id: values.jornadaDesdeId,
      jornada_hasta_id: values.jornadaHastaId,
      motivo: values.motivo || null,
    });

    if (error) {
      return {
        errors: {},
        errorGeneral: "No se pudo registrar la suspensión. Intenta de nuevo.",
      };
    }

    revalidatePath("/admin/suspensiones");
    return { errors: {} };
  } catch {
    return {
      errors: {},
      errorGeneral: "No se pudo registrar la suspensión. Intenta de nuevo.",
    };
  }
}
```

Do not modify `eliminarSuspension` or `CrearSuspensionState` — only `crearSuspension`'s body changes.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all tests pass (this task adds no new unit tests — `crearSuspension` has never had dedicated tests in any phase, consistent with how every other Server Action's Supabase-touching body has been handled; only `validateSuspensionForm`, the pure presence-check function, is unit-tested).

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/suspensiones/actions.ts"
git commit -m "fix: validate that a suspension's jornada range makes sense before saving it"
```

---

### Task 2: Suspendidas

**Files:**
- Create: `src/app/torneos/[torneoId]/suspendidas/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `NombreJugadora`, `NombreEquipo` (Fase 4a).
- Produces: the page Fase 4a's nav shell already links to.

- [ ] **Step 1: Page**

```tsx
// src/app/torneos/[torneoId]/suspendidas/page.tsx
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
    .select("id, nombre")
    .eq("torneo_id", torneoId);

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));
  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);

  const { data: jugadorasRaw, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, equipo_id")
          .in("equipo_id", equipoIds)
      : { data: [] as { id: string; nombre: string; equipo_id: string }[], error: null };

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
      <h1 className="text-xl font-semibold">Suspendidas</h1>
      {hayError ? (
        <p className="text-red-600">No se pudieron cargar las suspensiones. Intenta de nuevo.</p>
      ) : (suspensiones ?? []).length === 0 ? (
        <p className="text-gray-600">No hay jugadoras suspendidas por el momento.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Jugadora</th>
              <th className="p-2">Equipo</th>
              <th className="p-2">Desde</th>
              <th className="p-2">Hasta</th>
              <th className="p-2">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {(suspensiones ?? []).map((suspension) => {
              const jugadora = jugadoraPorId.get(suspension.jugadora_id);
              return (
                <tr key={suspension.id} className="border-t">
                  <td className="p-2">
                    {jugadora ? (
                      <NombreJugadora id={jugadora.id} nombre={jugadora.nombre} />
                    ) : (
                      "Jugadora"
                    )}
                  </td>
                  <td className="p-2">
                    {jugadora ? (
                      <NombreEquipo
                        id={jugadora.equipo_id}
                        nombre={nombrePorEquipo.get(jugadora.equipo_id) ?? "Equipo"}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    {etiquetaPorJornada.get(suspension.jornada_desde_id) ?? "—"}
                  </td>
                  <td className="p-2">
                    {etiquetaPorJornada.get(suspension.jornada_hasta_id) ?? "—"}
                  </td>
                  <td className="p-2">{suspension.motivo ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/torneos/[torneoId]/suspendidas` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/torneos/[torneoId]/suspendidas"
git commit -m "feat: add public suspendidas screen"
```

---

### Task 3: Reglamento (pública)

**Files:**
- Create: `src/app/torneos/[torneoId]/reglamento/page.tsx`

**Interfaces:**
- Consumes: `createClient()`.
- Produces: the last page Fase 4a's nav shell links to. **This is the last task of the whole Fase 4 plan (and, with it, the whole MVP described in the original design).**

**Note:** this file lives at `src/app/torneos/[torneoId]/reglamento/page.tsx` — a different path from the admin's upload page (`src/app/admin/(protected)/torneos/[torneoId]/reglamento/page.tsx`), so there is no route collision.

- [ ] **Step 1: Page**

```tsx
// src/app/torneos/[torneoId]/reglamento/page.tsx
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
      <h1 className="text-xl font-semibold">Reglamento</h1>
      {reglamentoError ? (
        <p className="text-red-600">No se pudo cargar el reglamento. Intenta de nuevo.</p>
      ) : reglamento?.pdf_url ? (
        <div className="flex flex-col gap-3">
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Abrir el reglamento en una pestaña nueva
          </a>
          <iframe
            src={reglamento.pdf_url}
            title="Reglamento del torneo"
            className="h-[70vh] w-full rounded border"
          />
        </div>
      ) : (
        <p className="text-gray-600">Todavía no se ha publicado el reglamento de este torneo.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/torneos/[torneoId]/reglamento` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/torneos/[torneoId]/reglamento"
git commit -m "feat: add public reglamento screen, completing the Fase 4 MVP"
```

---

## Al terminar

Con esto queda completo el MVP descrito en el diseño original: administración completa (torneos, equipos, jugadoras, jornadas, partidos con captura completa, suspensiones, avisos, reglamento) y sitio público completo (Principal, Calendario, Detalle de partido, Posiciones, Fichas de equipo y de jugadora, Goleadoras, Suspendidas, Reglamento), con todos los nombres enlazados entre sí. Lo que sigue después de esto —según lo que se definió al inicio como explícitamente fuera de este MVP— es login de jugadoras, notificaciones push, temporadas anteriores, guardar partidos en el calendario del celular, apps nativas, y modo sin internet.
