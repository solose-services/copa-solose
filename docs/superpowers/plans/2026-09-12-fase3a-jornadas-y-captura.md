# Fase 3a — Jornadas y captura de partidos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an administradora build a torneo's calendar (jornadas → partidos) and capture a played match's result (alineación, goles, tarjetas, jugadora del partido, incidencias) in one screen per partido, with the marcador always derived from `goles`.

**Architecture:** Same as Fase 2 — Server Components fetch via the RLS-enforced `createClient()`, mutations are `"use server"` Server Actions with try/catch around every Supabase call, forms use `useActionState`, and delete actions reuse the shared `DeleteButton`. The capture screen is one route (`/admin/partidos/[partidoId]/capturar`) with several independent mini-forms (alineación, goles, tarjetas, MVP, incidencias), each its own Server Action, so saving one doesn't require touching the others.

**Tech Stack:** Same as Fase 2 (Next.js 16, React 19, TypeScript, Tailwind, Vitest, `@supabase/ssr`). No new dependencies.

## Global Constraints

- Toda la interfaz usa lenguaje femenino.
- El marcador de un partido **nunca** se captura como número: siempre se deriva contando `goles`.
- La alineación solo registra "jugó / no jugó" — no distingue titular/suplente (decisión ya tomada en el diseño).
- La liguilla se arma a mano: no hay lógica automática de clasificación; una jornada de tipo `liguilla` se crea igual que una `regular`, solo cambia la etiqueta/tipo.
- Todo Supabase call dentro de una función `"use server"` va envuelto en `try/catch`; toda query de lista revisa su `error`. `redirect()` (si se usa) siempre queda fuera del `try/catch`.
- Cada pantalla nueva incluye un link "← Volver" a la pantalla anterior en la jerarquía (aprendido de la retroalimentación real de Fase 2 — no repetir el olvido).
- Escritura restringida a administradoras — todo mediante `createClient()` de `@/lib/supabase/server` (RLS), nunca un cliente de service role.
- Costo $0/mes, sin dependencias nuevas.

---

## File Structure

```
src/
├── lib/
│   └── validation/
│       ├── jornada.ts / jornada.test.ts          # NEW
│       └── partido.ts / partido.test.ts          # NEW
└── app/
    └── admin/(protected)/
        ├── torneos/
        │   ├── page.tsx                            # MODIFY: add "Ver jornadas" link
        │   └── [torneoId]/
        │       └── jornadas/
        │           ├── page.tsx                    # NEW: list + create
        │           ├── actions.ts                  # NEW: crearJornada
        │           ├── jornada-form.tsx             # NEW
        │           └── [jornadaId]/
        │               └── partidos/
        │                   ├── page.tsx             # NEW: list + create
        │                   ├── actions.ts           # NEW: crearPartido
        │                   └── partido-form.tsx     # NEW
        └── partidos/
            └── [partidoId]/
                └── capturar/
                    ├── page.tsx                     # NEW (grows across Tasks 3-6)
                    ├── actions.ts                   # NEW (grows across Tasks 3-6)
                    ├── alineacion-form.tsx           # NEW (Task 3)
                    ├── gol-form.tsx                  # NEW (Task 4)
                    ├── tarjeta-form.tsx              # NEW (Task 5)
                    ├── mvp-form.tsx                  # NEW (Task 6)
                    └── incidencias-form.tsx          # NEW (Task 6)
```

---

### Task 1: Jornadas — listar por torneo, crear

**Files:**
- Create: `src/lib/validation/jornada.ts`
- Test: `src/lib/validation/jornada.test.ts`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/actions.ts`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/jornada-form.tsx`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/page.tsx`
- Modify: `src/app/admin/(protected)/torneos/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (Fundación).
- Produces: the `/admin/torneos/[torneoId]/jornadas` route that Task 2 (partidos) links from, and that this task's modification of the torneos list page links to.

- [ ] **Step 1: Write the failing validation test**

```ts
// src/lib/validation/jornada.test.ts
import { describe, expect, it } from "vitest";
import { validateJornadaForm } from "./jornada";

describe("validateJornadaForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "regular", orden: "1" })
    ).toEqual({});
  });

  it("requires a non-empty etiqueta", () => {
    expect(
      validateJornadaForm({ etiqueta: "", tipo: "regular", orden: "1" }).etiqueta
    ).toBe("La etiqueta es obligatoria.");
  });

  it("rejects an invalid tipo", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "otro", orden: "1" }).tipo
    ).toBe("Selecciona un tipo válido.");
  });

  it("accepts tipo liguilla", () => {
    expect(
      validateJornadaForm({ etiqueta: "Semifinal", tipo: "liguilla", orden: "9" })
    ).toEqual({});
  });

  it("rejects a non-numeric orden", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "regular", orden: "abc" }).orden
    ).toBe("El orden debe ser un número entero positivo.");
  });

  it("rejects a negative orden", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "regular", orden: "-1" }).orden
    ).toBe("El orden debe ser un número entero positivo.");
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/validation/jornada.test.ts`
Expected: FAIL — `Cannot find module './jornada'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/validation/jornada.ts
export interface JornadaFormValues {
  etiqueta: string;
  tipo: string;
  orden: string;
}

export interface JornadaFormErrors {
  etiqueta?: string;
  tipo?: string;
  orden?: string;
}

export function validateJornadaForm(values: JornadaFormValues): JornadaFormErrors {
  const errors: JornadaFormErrors = {};

  if (!values.etiqueta.trim()) {
    errors.etiqueta = "La etiqueta es obligatoria.";
  }

  if (values.tipo !== "regular" && values.tipo !== "liguilla") {
    errors.tipo = "Selecciona un tipo válido.";
  }

  if (!/^\d+$/.test(values.orden.trim())) {
    errors.orden = "El orden debe ser un número entero positivo.";
  }

  return errors;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 6 new ones.

- [ ] **Step 5: Server action**

```ts
// src/app/admin/(protected)/torneos/[torneoId]/jornadas/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateJornadaForm, type JornadaFormErrors } from "@/lib/validation/jornada";

export interface CrearJornadaState {
  errors: JornadaFormErrors;
  errorGeneral?: string;
}

export async function crearJornada(
  torneoId: string,
  _prevState: CrearJornadaState,
  formData: FormData
): Promise<CrearJornadaState> {
  const values = {
    etiqueta: String(formData.get("etiqueta") ?? ""),
    tipo: String(formData.get("tipo") ?? ""),
    orden: String(formData.get("orden") ?? ""),
  };

  const errors = validateJornadaForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("jornadas").insert({
      torneo_id: torneoId,
      etiqueta: values.etiqueta,
      tipo: values.tipo,
      orden: Number(values.orden),
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo crear la jornada. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/jornadas`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo crear la jornada. Intenta de nuevo." };
  }
}
```

- [ ] **Step 6: Create form (client component)**

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/jornadas/jornada-form.tsx
"use client";

import { useActionState } from "react";
import { crearJornada, type CrearJornadaState } from "./actions";

const estadoInicial: CrearJornadaState = { errors: {} };

export function JornadaForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(
    crearJornada.bind(null, torneoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Etiqueta</span>
        <input name="etiqueta" className="rounded border px-3 py-2" placeholder="Jornada 1" />
        {state.errors.etiqueta && (
          <span className="text-sm text-red-600">{state.errors.etiqueta}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Tipo</span>
        <select name="tipo" className="rounded border px-3 py-2" defaultValue="regular">
          <option value="regular">Regular</option>
          <option value="liguilla">Liguilla</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-red-600">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span>Orden</span>
        <input name="orden" className="rounded border px-3 py-2" placeholder="1" />
        {state.errors.orden && <span className="text-sm text-red-600">{state.errors.orden}</span>}
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear jornada"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: List page (server component)**

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/jornadas/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JornadaForm } from "./jornada-form";

export default async function JornadasPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("nombre")
    .eq("id", torneoId)
    .maybeSingle();

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta, tipo, orden")
    .eq("torneo_id", torneoId)
    .order("orden");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/torneos" className="underline">
        ← Volver a Torneos
      </Link>
      <h1 className="text-xl font-semibold">
        Jornadas — {torneo?.nombre ?? "Torneo"}
      </h1>
      <JornadaForm torneoId={torneoId} />
      {jornadasError ? (
        <p className="text-red-600">No se pudieron cargar las jornadas. Intenta de nuevo.</p>
      ) : (
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Etiqueta</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Orden</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(jornadas ?? []).map((jornada) => (
            <tr key={jornada.id} className="border-t">
              <td className="p-2">{jornada.etiqueta}</td>
              <td className="p-2">{jornada.tipo}</td>
              <td className="p-2">{jornada.orden}</td>
              <td className="p-2">
                <Link
                  href={`/admin/torneos/${torneoId}/jornadas/${jornada.id}/partidos`}
                  className="underline"
                >
                  Ver partidos
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Link to it from the Torneos list page**

Open `src/app/admin/(protected)/torneos/page.tsx`. Find the table row that currently renders (per Fase 2):

```tsx
              <td className="p-2">
                <Link href={`/admin/torneos/${torneo.id}/equipos`} className="underline">
                  Ver equipos
                </Link>
              </td>
```

Add a sibling cell right after it (so the row now has one more `<td>` and the `<thead>` needs one more empty `<th className="p-2"></th>` to match):

```tsx
              <td className="p-2">
                <Link href={`/admin/torneos/${torneo.id}/equipos`} className="underline">
                  Ver equipos
                </Link>
              </td>
              <td className="p-2">
                <Link href={`/admin/torneos/${torneo.id}/jornadas`} className="underline">
                  Ver jornadas
                </Link>
              </td>
```

And in the `<thead>`, add one more `<th className="p-2"></th>` so the column count still matches the row's cell count.

- [ ] **Step 9: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/torneos/[torneoId]/jornadas` listed as a dynamic route.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/lib/validation/jornada.ts src/lib/validation/jornada.test.ts "src/app/admin/(protected)/torneos"
git commit -m "feat: add jornadas admin screen (list per torneo, create)"
```

---

### Task 2: Partidos — listar por jornada, crear

**Files:**
- Create: `src/lib/validation/partido.ts`
- Test: `src/lib/validation/partido.test.ts`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/actions.ts`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/partido-form.tsx`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`; the `equipos` table (Fase 2).
- Produces: the `/admin/torneos/[torneoId]/jornadas/[jornadaId]/partidos` route (linked from Task 1's jornadas list), and each partido row links to `/admin/partidos/[partidoId]/capturar` (built in Tasks 3-6).

- [ ] **Step 1: Write the failing validation test**

```ts
// src/lib/validation/partido.test.ts
import { describe, expect, it } from "vitest";
import { validatePartidoForm } from "./partido";

describe("validatePartidoForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validatePartidoForm({
        equipoLocalId: "equipo-1",
        equipoVisitanteId: "equipo-2",
        fecha: "2026-03-01",
      })
    ).toEqual({});
  });

  it("requires equipoLocalId", () => {
    expect(
      validatePartidoForm({ equipoLocalId: "", equipoVisitanteId: "equipo-2", fecha: "2026-03-01" })
        .equipoLocalId
    ).toBe("Selecciona el equipo local.");
  });

  it("requires equipoVisitanteId", () => {
    expect(
      validatePartidoForm({ equipoLocalId: "equipo-1", equipoVisitanteId: "", fecha: "2026-03-01" })
        .equipoVisitanteId
    ).toBe("Selecciona el equipo visitante.");
  });

  it("rejects the same team as local and visitante", () => {
    expect(
      validatePartidoForm({
        equipoLocalId: "equipo-1",
        equipoVisitanteId: "equipo-1",
        fecha: "2026-03-01",
      }).equipoVisitanteId
    ).toBe("El equipo visitante debe ser distinto al local.");
  });

  it("requires a non-empty fecha", () => {
    expect(
      validatePartidoForm({ equipoLocalId: "equipo-1", equipoVisitanteId: "equipo-2", fecha: "" })
        .fecha
    ).toBe("La fecha es obligatoria.");
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/validation/partido.test.ts`
Expected: FAIL — `Cannot find module './partido'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/validation/partido.ts
export interface PartidoFormValues {
  equipoLocalId: string;
  equipoVisitanteId: string;
  fecha: string;
}

export interface PartidoFormErrors {
  equipoLocalId?: string;
  equipoVisitanteId?: string;
  fecha?: string;
}

export function validatePartidoForm(values: PartidoFormValues): PartidoFormErrors {
  const errors: PartidoFormErrors = {};

  if (!values.equipoLocalId) {
    errors.equipoLocalId = "Selecciona el equipo local.";
  }

  if (!values.equipoVisitanteId) {
    errors.equipoVisitanteId = "Selecciona el equipo visitante.";
  }

  if (
    values.equipoLocalId &&
    values.equipoVisitanteId &&
    values.equipoLocalId === values.equipoVisitanteId
  ) {
    errors.equipoVisitanteId = "El equipo visitante debe ser distinto al local.";
  }

  if (!values.fecha.trim()) {
    errors.fecha = "La fecha es obligatoria.";
  }

  return errors;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 5 new ones.

- [ ] **Step 5: Server action**

```ts
// src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validatePartidoForm, type PartidoFormErrors } from "@/lib/validation/partido";

export interface CrearPartidoState {
  errors: PartidoFormErrors;
  errorGeneral?: string;
}

export async function crearPartido(
  jornadaId: string,
  torneoId: string,
  _prevState: CrearPartidoState,
  formData: FormData
): Promise<CrearPartidoState> {
  const values = {
    equipoLocalId: String(formData.get("equipoLocalId") ?? ""),
    equipoVisitanteId: String(formData.get("equipoVisitanteId") ?? ""),
    fecha: String(formData.get("fecha") ?? ""),
  };
  const hora = String(formData.get("hora") ?? "");

  const errors = validatePartidoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("partidos").insert({
      jornada_id: jornadaId,
      equipo_local_id: values.equipoLocalId,
      equipo_visitante_id: values.equipoVisitanteId,
      fecha: values.fecha,
      hora: hora || null,
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo crear el partido. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/jornadas/${jornadaId}/partidos`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo crear el partido. Intenta de nuevo." };
  }
}
```

- [ ] **Step 6: Create form (client component)**

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/partido-form.tsx
"use client";

import { useActionState } from "react";
import { crearPartido, type CrearPartidoState } from "./actions";

const estadoInicial: CrearPartidoState = { errors: {} };

export function PartidoForm({
  jornadaId,
  torneoId,
  equipos,
}: {
  jornadaId: string;
  torneoId: string;
  equipos: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    crearPartido.bind(null, jornadaId, torneoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Equipo local</span>
        <select name="equipoLocalId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoLocalId && (
          <span className="text-sm text-red-600">{state.errors.equipoLocalId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Equipo visitante</span>
        <select name="equipoVisitanteId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoVisitanteId && (
          <span className="text-sm text-red-600">{state.errors.equipoVisitanteId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Fecha</span>
        <input type="date" name="fecha" className="rounded border px-3 py-2" />
        {state.errors.fecha && <span className="text-sm text-red-600">{state.errors.fecha}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span>Hora (opcional)</span>
        <input type="time" name="hora" className="rounded border px-3 py-2" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear partido"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: List page (server component)**

Team names are resolved with a client-side lookup map (built from the same `equipos` query the form needs) rather than a Supabase join, since `partidos` has two foreign keys to `equipos` (local and visitante) and disambiguating that in a PostgREST join requires guessing Postgres's auto-generated constraint names — a plain lookup map is simpler and doesn't depend on that.

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PartidoForm } from "./partido-form";

export default async function PartidosPage({
  params,
}: {
  params: Promise<{ torneoId: string; jornadaId: string }>;
}) {
  const { torneoId, jornadaId } = await params;
  const supabase = await createClient();

  const { data: jornada } = await supabase
    .from("jornadas")
    .select("etiqueta")
    .eq("id", jornadaId)
    .maybeSingle();

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre")
    .eq("torneo_id", torneoId)
    .order("nombre");

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));

  const { data: partidos, error: partidosError } = await supabase
    .from("partidos")
    .select("id, equipo_local_id, equipo_visitante_id, fecha, hora")
    .eq("jornada_id", jornadaId)
    .order("fecha");

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/admin/torneos/${torneoId}/jornadas`} className="underline">
        ← Volver a Jornadas
      </Link>
      <h1 className="text-xl font-semibold">
        Partidos — {jornada?.etiqueta ?? "Jornada"}
      </h1>
      <PartidoForm jornadaId={jornadaId} torneoId={torneoId} equipos={equipos ?? []} />
      {partidosError ? (
        <p className="text-red-600">No se pudieron cargar los partidos. Intenta de nuevo.</p>
      ) : (
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Local</th>
            <th className="p-2">Visitante</th>
            <th className="p-2">Fecha</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(partidos ?? []).map((partido) => (
            <tr key={partido.id} className="border-t">
              <td className="p-2">
                {nombrePorEquipo.get(partido.equipo_local_id) ?? "Equipo"}
              </td>
              <td className="p-2">
                {nombrePorEquipo.get(partido.equipo_visitante_id) ?? "Equipo"}
              </td>
              <td className="p-2">{partido.fecha ?? "—"}</td>
              <td className="p-2">
                <Link href={`/admin/partidos/${partido.id}/capturar`} className="underline">
                  Capturar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with the partidos route listed.

- [ ] **Step 9: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/lib/validation/partido.ts src/lib/validation/partido.test.ts "src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]"
git commit -m "feat: add partidos admin screen (list per jornada, create)"
```

---

### Task 3: Captura de partido — pantalla base y alineación

**Files:**
- Create: `src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx`
- Create: `src/app/admin/(protected)/partidos/[partidoId]/capturar/actions.ts`
- Create: `src/app/admin/(protected)/partidos/[partidoId]/capturar/alineacion-form.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`.
- Produces: the `/admin/partidos/[partidoId]/capturar` route (linked from Task 2's partidos list). `actions.ts` in this folder grows in Tasks 4-6 — later tasks append new exported functions to this same file, they don't replace it.

- [ ] **Step 1: Server action for alineación**

```ts
// src/app/admin/(protected)/partidos/[partidoId]/capturar/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function guardarAlineacion(
  partidoId: string,
  equipoLocalId: string,
  equipoVisitanteId: string,
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const jugadorasLocal = formData.getAll("jugadorasLocal").map(String);
  const jugadorasVisitante = formData.getAll("jugadorasVisitante").map(String);

  const filas = [
    ...jugadorasLocal.map((jugadoraId) => ({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      equipo_id: equipoLocalId,
    })),
    ...jugadorasVisitante.map((jugadoraId) => ({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      equipo_id: equipoVisitanteId,
    })),
  ];

  try {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("alineaciones")
      .delete()
      .eq("partido_id", partidoId);

    if (deleteError) {
      return { error: "No se pudo guardar la alineación. Intenta de nuevo." };
    }

    if (filas.length > 0) {
      const { error: insertError } = await supabase.from("alineaciones").insert(filas);
      if (insertError) {
        return { error: "No se pudo guardar la alineación. Intenta de nuevo." };
      }
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudo guardar la alineación. Intenta de nuevo." };
  }
}
```

- [ ] **Step 2: Alineación form (client component)**

```tsx
// src/app/admin/(protected)/partidos/[partidoId]/capturar/alineacion-form.tsx
"use client";

import { useActionState } from "react";
import { guardarAlineacion } from "./actions";

interface Jugadora {
  id: string;
  nombre: string;
}

export function AlineacionForm({
  partidoId,
  equipoLocalId,
  equipoVisitanteId,
  nombreLocal,
  nombreVisitante,
  jugadorasLocal,
  jugadorasVisitante,
  seleccionadasIniciales,
}: {
  partidoId: string;
  equipoLocalId: string;
  equipoVisitanteId: string;
  nombreLocal: string;
  nombreVisitante: string;
  jugadorasLocal: Jugadora[];
  jugadorasVisitante: Jugadora[];
  seleccionadasIniciales: string[];
}) {
  const [state, formAction, pending] = useActionState(
    guardarAlineacion.bind(null, partidoId, equipoLocalId, equipoVisitanteId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded border p-4">
      <h2 className="font-semibold">Alineación</h2>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{nombreLocal}</span>
          {jugadorasLocal.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="jugadorasLocal"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-medium">{nombreVisitante}</span>
          {jugadorasVisitante.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="jugadorasVisitante"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar alineación"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Capture page (server component) — fetches everything, renders header + marcador + alineación**

```tsx
// src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlineacionForm } from "./alineacion-form";

export default async function CapturarPartidoPage({
  params,
}: {
  params: Promise<{ partidoId: string }>;
}) {
  const { partidoId } = await params;
  const supabase = await createClient();

  const { data: partido } = await supabase
    .from("partidos")
    .select("id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora")
    .eq("id", partidoId)
    .maybeSingle();

  if (!partido) {
    notFound();
  }

  const { data: jornada } = await supabase
    .from("jornadas")
    .select("torneo_id, etiqueta")
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
    .eq("equipo_id", partido.equipo_local_id)
    .order("nombre");

  const { data: jugadorasVisitante } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_visitante_id)
    .order("nombre");

  const { data: alineaciones } = await supabase
    .from("alineaciones")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const { data: goles } = await supabase
    .from("goles")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const golesLocal = (goles ?? []).filter((gol) => idsLocal.has(gol.jugadora_id)).length;
  const golesVisitante = (goles ?? []).filter((gol) => idsVisitante.has(gol.jugadora_id)).length;

  return (
    <div className="flex flex-col gap-6">
      {jornada?.torneo_id && (
        <Link
          href={`/admin/torneos/${jornada.torneo_id}/jornadas/${partido.jornada_id}/partidos`}
          className="underline"
        >
          ← Volver a Partidos
        </Link>
      )}
      <h1 className="text-xl font-semibold">
        {equipoLocal?.nombre ?? "Local"} {golesLocal} — {golesVisitante}{" "}
        {equipoVisitante?.nombre ?? "Visitante"}
      </h1>
      <p className="text-sm text-gray-600">
        {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
      </p>
      <AlineacionForm
        partidoId={partidoId}
        equipoLocalId={partido.equipo_local_id}
        equipoVisitanteId={partido.equipo_visitante_id}
        nombreLocal={equipoLocal?.nombre ?? "Local"}
        nombreVisitante={equipoVisitante?.nombre ?? "Visitante"}
        jugadorasLocal={jugadorasLocal ?? []}
        jugadorasVisitante={jugadorasVisitante ?? []}
        seleccionadasIniciales={(alineaciones ?? []).map((fila) => fila.jugadora_id)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/partidos/[partidoId]/capturar` listed as a dynamic route.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests pass (this task adds no new unit tests — the marcador/alineación logic lives in a Server Component and a thin Server Action, consistent with how Fase 2's list pages were handled).

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(protected)/partidos"
git commit -m "feat: add match capture screen with score header and alineación"
```

---

### Task 4: Captura de partido — goles

**Files:**
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/actions.ts` (append `agregarGol`, `eliminarGol`)
- Create: `src/app/admin/(protected)/partidos/[partidoId]/capturar/gol-form.tsx`
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx` (add the goles section)

**Interfaces:**
- Consumes: `DeleteButton` from `@/components/admin/delete-button` (Fase 2).
- Produces: nothing new consumed by other tasks — this is a self-contained addition to the capture page.

- [ ] **Step 1: Append the goles actions**

Add to the end of `src/app/admin/(protected)/partidos/[partidoId]/capturar/actions.ts` (do not remove `guardarAlineacion`):

```ts

export interface AgregarGolState {
  errors: { jugadoraId?: string; minuto?: string };
  errorGeneral?: string;
}

export async function agregarGol(
  partidoId: string,
  _prevState: AgregarGolState,
  formData: FormData
): Promise<AgregarGolState> {
  const jugadoraId = String(formData.get("jugadoraId") ?? "");
  const minutoRaw = String(formData.get("minuto") ?? "");

  const errors: AgregarGolState["errors"] = {};
  if (!jugadoraId) {
    errors.jugadoraId = "Selecciona quién anotó.";
  }
  if (!/^\d+$/.test(minutoRaw.trim())) {
    errors.minuto = "El minuto debe ser un número entero.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("goles").insert({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      minuto: Number(minutoRaw),
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo registrar el gol. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo registrar el gol. Intenta de nuevo." };
  }
}

export async function eliminarGol(
  golId: string,
  partidoId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("goles").delete().eq("id", golId);

    if (error) {
      return { error: "No se pudo eliminar el gol. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudo eliminar el gol. Intenta de nuevo." };
  }
}
```

- [ ] **Step 2: Gol form (client component)**

```tsx
// src/app/admin/(protected)/partidos/[partidoId]/capturar/gol-form.tsx
"use client";

import { useActionState } from "react";
import { agregarGol, type AgregarGolState } from "./actions";

const estadoInicial: AgregarGolState = { errors: {} };

export function GolForm({
  partidoId,
  jugadorasQueJugaron,
}: {
  partidoId: string;
  jugadorasQueJugaron: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    agregarGol.bind(null, partidoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span>Jugadora</span>
        <select name="jugadoraId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-red-600">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Minuto</span>
        <input name="minuto" className="w-20 rounded border px-3 py-2" />
        {state.errors.minuto && (
          <span className="text-sm text-red-600">{state.errors.minuto}</span>
        )}
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar gol"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Wire the goles section into the capture page**

In `src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx`:

Add to the imports:

```ts
import { DeleteButton } from "@/components/admin/delete-button";
import { GolForm } from "./gol-form";
import { eliminarGol } from "./actions";
```

After fetching `alineaciones`, add a fetch for the full goles rows (not just `jugadora_id`) and build the combined "jugadoras que jugaron" list used by the gol dropdown:

```ts
  const { data: golesDetalle, error: golesError } = await supabase
    .from("goles")
    .select("id, jugadora_id, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const jugadorasQueJugaron = [
    ...(jugadorasLocal ?? []).filter((jugadora) =>
      (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
    ),
    ...(jugadorasVisitante ?? []).filter((jugadora) =>
      (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
    ),
  ];

  const nombrePorJugadora = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      jugadora.nombre,
    ])
  );
```

Replace the existing `const { data: goles } = await supabase...` fetch (used only for the marcador count) with `golesDetalle` for the count too — i.e. delete the old `goles` query block entirely and compute `golesLocal`/`golesVisitante` from `golesDetalle` instead:

```ts
  const golesLocal = (golesDetalle ?? []).filter((gol) => idsLocal.has(gol.jugadora_id)).length;
  const golesVisitante = (golesDetalle ?? []).filter((gol) =>
    idsVisitante.has(gol.jugadora_id)
  ).length;
```

Finally, add a "Goles" section in the JSX, right after the `<AlineacionForm ... />` element:

```tsx
      <section className="flex flex-col gap-3 rounded border p-4">
        <h2 className="font-semibold">Goles</h2>
        <GolForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {golesError ? (
          <p className="text-red-600">No se pudieron cargar los goles. Intenta de nuevo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(golesDetalle ?? []).map((gol) => (
              <li key={gol.id} className="flex items-center gap-3">
                <span>
                  {nombrePorJugadora.get(gol.jugadora_id) ?? "Jugadora"} — min. {gol.minuto}
                </span>
                <DeleteButton
                  onDelete={eliminarGol.bind(null, gol.id, partidoId)}
                  confirmMessage="¿Eliminar este gol? Esto no se puede deshacer."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(protected)/partidos"
git commit -m "feat: add goles capture (add, list, delete) with derived marcador"
```

---

### Task 5: Captura de partido — tarjetas

**Files:**
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/actions.ts` (append `agregarTarjeta`, `eliminarTarjeta`)
- Create: `src/app/admin/(protected)/partidos/[partidoId]/capturar/tarjeta-form.tsx`
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx` (add the tarjetas section)

**Interfaces:**
- Consumes: `DeleteButton` (Fase 2), `jugadorasQueJugaron` and `nombrePorJugadora` already computed in the page by Task 4.

- [ ] **Step 1: Append the tarjetas actions**

Add to the end of `actions.ts` (do not remove the goles/alineación functions):

```ts

export interface AgregarTarjetaState {
  errors: { jugadoraId?: string; tipo?: string; minuto?: string };
  errorGeneral?: string;
}

export async function agregarTarjeta(
  partidoId: string,
  _prevState: AgregarTarjetaState,
  formData: FormData
): Promise<AgregarTarjetaState> {
  const jugadoraId = String(formData.get("jugadoraId") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const minutoRaw = String(formData.get("minuto") ?? "");

  const errors: AgregarTarjetaState["errors"] = {};
  if (!jugadoraId) {
    errors.jugadoraId = "Selecciona a la jugadora.";
  }
  if (tipo !== "amarilla" && tipo !== "roja") {
    errors.tipo = "Selecciona un tipo de tarjeta válido.";
  }
  if (!/^\d+$/.test(minutoRaw.trim())) {
    errors.minuto = "El minuto debe ser un número entero.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tarjetas").insert({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      tipo,
      minuto: Number(minutoRaw),
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo registrar la tarjeta. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo registrar la tarjeta. Intenta de nuevo." };
  }
}

export async function eliminarTarjeta(
  tarjetaId: string,
  partidoId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tarjetas").delete().eq("id", tarjetaId);

    if (error) {
      return { error: "No se pudo eliminar la tarjeta. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudo eliminar la tarjeta. Intenta de nuevo." };
  }
}
```

- [ ] **Step 2: Tarjeta form (client component)**

```tsx
// src/app/admin/(protected)/partidos/[partidoId]/capturar/tarjeta-form.tsx
"use client";

import { useActionState } from "react";
import { agregarTarjeta, type AgregarTarjetaState } from "./actions";

const estadoInicial: AgregarTarjetaState = { errors: {} };

export function TarjetaForm({
  partidoId,
  jugadorasQueJugaron,
}: {
  partidoId: string;
  jugadorasQueJugaron: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    agregarTarjeta.bind(null, partidoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span>Jugadora</span>
        <select name="jugadoraId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-red-600">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Tipo</span>
        <select name="tipo" className="rounded border px-3 py-2" defaultValue="amarilla">
          <option value="amarilla">Amarilla</option>
          <option value="roja">Roja</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-red-600">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span>Minuto</span>
        <input name="minuto" className="w-20 rounded border px-3 py-2" />
        {state.errors.minuto && (
          <span className="text-sm text-red-600">{state.errors.minuto}</span>
        )}
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar tarjeta"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Wire the tarjetas section into the capture page**

Add to the imports in `page.tsx`:

```ts
import { TarjetaForm } from "./tarjeta-form";
import { eliminarTarjeta } from "./actions";
```

Add the fetch, right after the `golesDetalle` fetch:

```ts
  const { data: tarjetasDetalle, error: tarjetasError } = await supabase
    .from("tarjetas")
    .select("id, jugadora_id, tipo, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");
```

Add a "Tarjetas" section in the JSX, right after the goles `<section>`:

```tsx
      <section className="flex flex-col gap-3 rounded border p-4">
        <h2 className="font-semibold">Tarjetas</h2>
        <TarjetaForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {tarjetasError ? (
          <p className="text-red-600">No se pudieron cargar las tarjetas. Intenta de nuevo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(tarjetasDetalle ?? []).map((tarjeta) => (
              <li key={tarjeta.id} className="flex items-center gap-3">
                <span>
                  {nombrePorJugadora.get(tarjeta.jugadora_id) ?? "Jugadora"} — {tarjeta.tipo} —
                  min. {tarjeta.minuto}
                </span>
                <DeleteButton
                  onDelete={eliminarTarjeta.bind(null, tarjeta.id, partidoId)}
                  confirmMessage="¿Eliminar esta tarjeta? Esto no se puede deshacer."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(protected)/partidos"
git commit -m "feat: add tarjetas capture (add, list, delete)"
```

---

### Task 6: Captura de partido — jugadora del partido (MVP) e incidencias

**Files:**
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/actions.ts` (append `guardarMvp`, `guardarIncidencias`)
- Create: `src/app/admin/(protected)/partidos/[partidoId]/capturar/mvp-form.tsx`
- Create: `src/app/admin/(protected)/partidos/[partidoId]/capturar/incidencias-form.tsx`
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx` (add both sections; fetch `mvp_jugadora_id`/`incidencias`, already selected in Task 3's `partidos` query only partially — extend the select list)

**Interfaces:**
- Consumes: `jugadorasQueJugaron` (Task 4).
- Produces: this is the last task of Fase 3a — after this, the capture screen covers everything the design spec's "Captura de partido" section calls for.

- [ ] **Step 1: Append the MVP and incidencias actions**

Add to the end of `actions.ts`:

```ts

export async function guardarMvp(
  partidoId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const mvpJugadoraId = String(formData.get("mvpJugadoraId") ?? "");

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("partidos")
      .update({ mvp_jugadora_id: mvpJugadoraId || null })
      .eq("id", partidoId);

    if (error) {
      return { error: "No se pudo guardar la jugadora del partido. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudo guardar la jugadora del partido. Intenta de nuevo." };
  }
}

export async function guardarIncidencias(
  partidoId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const incidencias = String(formData.get("incidencias") ?? "");

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("partidos")
      .update({ incidencias: incidencias || null })
      .eq("id", partidoId);

    if (error) {
      return { error: "No se pudieron guardar las incidencias. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudieron guardar las incidencias. Intenta de nuevo." };
  }
}
```

- [ ] **Step 2: MVP form (client component)**

```tsx
// src/app/admin/(protected)/partidos/[partidoId]/capturar/mvp-form.tsx
"use client";

import { useActionState } from "react";
import { guardarMvp } from "./actions";

async function accion(
  partidoId: string,
  _prevState: { error?: string },
  formData: FormData
) {
  return guardarMvp(partidoId, formData);
}

export function MvpForm({
  partidoId,
  jugadorasQueJugaron,
  mvpActual,
}: {
  partidoId: string;
  jugadorasQueJugaron: { id: string; nombre: string }[];
  mvpActual: string | null;
}) {
  const [state, formAction, pending] = useActionState(accion.bind(null, partidoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Jugadora del partido</span>
        <select
          name="mvpJugadoraId"
          className="rounded border px-3 py-2"
          defaultValue={mvpActual ?? ""}
        >
          <option value="">Sin asignar</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Incidencias form (client component)**

```tsx
// src/app/admin/(protected)/partidos/[partidoId]/capturar/incidencias-form.tsx
"use client";

import { useActionState } from "react";
import { guardarIncidencias } from "./actions";

async function accion(
  partidoId: string,
  _prevState: { error?: string },
  formData: FormData
) {
  return guardarIncidencias(partidoId, formData);
}

export function IncidenciasForm({
  partidoId,
  incidenciasActuales,
}: {
  partidoId: string;
  incidenciasActuales: string | null;
}) {
  const [state, formAction, pending] = useActionState(accion.bind(null, partidoId), {});

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Incidencias</span>
        <textarea
          name="incidencias"
          defaultValue={incidenciasActuales ?? ""}
          className="min-h-24 rounded border px-3 py-2"
          placeholder="Notas del partido (opcional)"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Wire both sections into the capture page**

Add to the imports in `page.tsx`:

```ts
import { MvpForm } from "./mvp-form";
import { IncidenciasForm } from "./incidencias-form";
```

Extend the `partidos` select in Step 3's original query (Task 3) to also fetch `mvp_jugadora_id` and `incidencias`:

```ts
  const { data: partido } = await supabase
    .from("partidos")
    .select(
      "id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora, mvp_jugadora_id, incidencias"
    )
    .eq("id", partidoId)
    .maybeSingle();
```

Add both sections at the end of the JSX, after the tarjetas `<section>`:

```tsx
      <MvpForm
        partidoId={partidoId}
        jugadorasQueJugaron={jugadorasQueJugaron}
        mvpActual={partido.mvp_jugadora_id}
      />
      <IncidenciasForm partidoId={partidoId} incidenciasActuales={partido.incidencias} />
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add "src/app/admin/(protected)/partidos"
git commit -m "feat: add jugadora del partido and incidencias capture, completing the match capture screen"
```

---

## Al terminar

Con esto, una administradora puede crear jornadas y partidos dentro de un torneo, y capturar el resultado completo de un partido jugado (alineación, goles con minuto, tarjetas con minuto y tipo, jugadora del partido, incidencias) en una sola pantalla, con el marcador siempre derivado de los goles capturados — tal como pide el diseño. El siguiente plan (**Fase 3b — Suspensiones, avisos y reglamento**) añade las tres piezas de administración restantes, todas independientes entre sí.
