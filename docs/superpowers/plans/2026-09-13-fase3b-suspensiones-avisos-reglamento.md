# Fase 3b — Suspensiones, avisos y reglamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the admin side of the app (Fase 3) by letting an administradora register manual suspensions, publish/delete avisos, and upload/replace a torneo's reglamento PDF.

**Architecture:** Same conventions as Fases 2-3a — Server Components fetch via the RLS-enforced `createClient()`, mutations are `"use server"` Server Actions with try/catch around every Supabase call, forms use `useActionState`, delete actions reuse `DeleteButton`. These three features are independent of each other and of the match-capture screen — none of them touch `partidos`, `goles`, `tarjetas`, or `alineaciones`.

**Tech Stack:** Same as prior phases (Next.js 16, React 19, TypeScript, Tailwind, Vitest, `@supabase/ssr`). No new npm dependencies. Task 3 uses the Supabase Storage JS client (`supabase.storage`), already part of `@supabase/supabase-js`.

## Global Constraints

- Toda la interfaz usa lenguaje femenino.
- Todo Supabase call dentro de una función `"use server"` va envuelto en `try/catch`; toda query de lista (incluyendo las de apoyo para construir etiquetas de `<select>`) revisa su `error` y bloquea el formulario correspondiente si falla — no debe verse como "no hay datos" cuando en realidad falló la carga (lección de la revisión final de Fase 3a).
- Cada pantalla nueva incluye un link "← Volver".
- Las suspensiones se capturan manualmente: no hay cálculo automático a partir de tarjetas rojas (decisión ya tomada en el diseño).
- El reglamento es un PDF real subido a Supabase Storage (bucket `media`, ya configurado con lectura pública y escritura solo para `is_admin()` desde la Fundación) — no un campo de texto con un link externo.
- Escritura restringida a administradoras — todo mediante `createClient()` de `@/lib/supabase/server` (RLS), nunca un cliente de service role.
- Costo $0/mes, sin dependencias nuevas.

---

## File Structure

```
src/
├── lib/
│   └── validation/
│       ├── suspension.ts / suspension.test.ts     # NEW
│       └── aviso.ts / aviso.test.ts                # NEW
└── app/
    └── admin/(protected)/
        ├── page.tsx                                 # MODIFY: add links to Suspensiones and Avisos
        ├── suspensiones/
        │   ├── page.tsx                              # NEW: list (all) + create
        │   ├── actions.ts                            # NEW: crearSuspension, eliminarSuspension
        │   └── suspension-form.tsx                   # NEW
        ├── avisos/
        │   ├── page.tsx                               # NEW: list + create
        │   ├── actions.ts                             # NEW: crearAviso, eliminarAviso
        │   └── aviso-form.tsx                          # NEW
        └── torneos/
            ├── page.tsx                                # MODIFY: add "Reglamento" link
            └── [torneoId]/
                └── reglamento/
                    ├── page.tsx                          # NEW
                    ├── actions.ts                        # NEW: subirReglamento
                    └── reglamento-form.tsx                # NEW
```

---

### Task 1: Suspensiones — listar (todas), crear, eliminar

**Files:**
- Create: `src/lib/validation/suspension.ts`
- Test: `src/lib/validation/suspension.test.ts`
- Create: `src/app/admin/(protected)/suspensiones/actions.ts`
- Create: `src/app/admin/(protected)/suspensiones/suspension-form.tsx`
- Create: `src/app/admin/(protected)/suspensiones/page.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`; `DeleteButton` from `@/components/admin/delete-button`.
- Produces: the `/admin/suspensiones` route, linked from the admin home page.

- [ ] **Step 1: Write the failing validation test**

```ts
// src/lib/validation/suspension.test.ts
import { describe, expect, it } from "vitest";
import { validateSuspensionForm } from "./suspension";

describe("validateSuspensionForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "jornada-1",
        motivo: "Roja directa",
      })
    ).toEqual({});
  });

  it("allows an empty motivo", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "jornada-1",
        motivo: "",
      })
    ).toEqual({});
  });

  it("requires jugadoraId", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "jornada-1",
        motivo: "",
      }).jugadoraId
    ).toBe("Selecciona a la jugadora.");
  });

  it("requires jornadaDesdeId", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "",
        jornadaHastaId: "jornada-1",
        motivo: "",
      }).jornadaDesdeId
    ).toBe("Selecciona la jornada de inicio.");
  });

  it("requires jornadaHastaId", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "",
        motivo: "",
      }).jornadaHastaId
    ).toBe("Selecciona la jornada final.");
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/validation/suspension.test.ts`
Expected: FAIL — `Cannot find module './suspension'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/validation/suspension.ts
export interface SuspensionFormValues {
  jugadoraId: string;
  jornadaDesdeId: string;
  jornadaHastaId: string;
  motivo: string;
}

export interface SuspensionFormErrors {
  jugadoraId?: string;
  jornadaDesdeId?: string;
  jornadaHastaId?: string;
}

export function validateSuspensionForm(values: SuspensionFormValues): SuspensionFormErrors {
  const errors: SuspensionFormErrors = {};

  if (!values.jugadoraId) {
    errors.jugadoraId = "Selecciona a la jugadora.";
  }
  if (!values.jornadaDesdeId) {
    errors.jornadaDesdeId = "Selecciona la jornada de inicio.";
  }
  if (!values.jornadaHastaId) {
    errors.jornadaHastaId = "Selecciona la jornada final.";
  }

  return errors;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 5 new ones.

- [ ] **Step 5: Server actions**

```ts
// src/app/admin/(protected)/suspensiones/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validateSuspensionForm,
  type SuspensionFormErrors,
} from "@/lib/validation/suspension";

export interface CrearSuspensionState {
  errors: SuspensionFormErrors;
  errorGeneral?: string;
}

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

export async function eliminarSuspension(
  suspensionId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("suspensiones")
      .delete()
      .eq("id", suspensionId);

    if (error) {
      return { error: "No se pudo eliminar la suspensión. Intenta de nuevo." };
    }

    revalidatePath("/admin/suspensiones");
    return {};
  } catch {
    return { error: "No se pudo eliminar la suspensión. Intenta de nuevo." };
  }
}
```

- [ ] **Step 6: Create form (client component)**

```tsx
// src/app/admin/(protected)/suspensiones/suspension-form.tsx
"use client";

import { useActionState } from "react";
import { crearSuspension, type CrearSuspensionState } from "./actions";

const estadoInicial: CrearSuspensionState = { errors: {} };

export function SuspensionForm({
  jugadoras,
  jornadas,
}: {
  jugadoras: { id: string; etiqueta: string }[];
  jornadas: { id: string; etiqueta: string }[];
}) {
  const [state, formAction, pending] = useActionState(crearSuspension, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Jugadora</span>
        <select name="jugadoraId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jugadoras.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-red-600">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Desde jornada</span>
        <select name="jornadaDesdeId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaDesdeId && (
          <span className="text-sm text-red-600">{state.errors.jornadaDesdeId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Hasta jornada</span>
        <select name="jornadaHastaId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaHastaId && (
          <span className="text-sm text-red-600">{state.errors.jornadaHastaId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Motivo (opcional)</span>
        <input name="motivo" className="rounded border px-3 py-2" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar suspensión"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: List page (server component)**

Team/tournament names are resolved with plain lookup `Map`s (same deliberate pattern as Fase 3a's partidos page), not Supabase joins.

```tsx
// src/app/admin/(protected)/suspensiones/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { SuspensionForm } from "./suspension-form";
import { eliminarSuspension } from "./actions";

export default async function SuspensionesPage() {
  const supabase = await createClient();

  const { data: jugadorasRaw, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, equipo_id")
    .order("nombre");

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre");

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));

  const jugadoras = (jugadorasRaw ?? []).map((jugadora) => ({
    id: jugadora.id,
    etiqueta: `${jugadora.nombre} (${nombrePorEquipo.get(jugadora.equipo_id) ?? "Equipo"})`,
  }));

  const { data: jornadasRaw, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta, torneo_id")
    .order("orden");

  const { data: torneos, error: torneosError } = await supabase
    .from("torneos")
    .select("id, nombre");

  const nombrePorTorneo = new Map((torneos ?? []).map((torneo) => [torneo.id, torneo.nombre]));

  const jornadas = (jornadasRaw ?? []).map((jornada) => ({
    id: jornada.id,
    etiqueta: `${nombrePorTorneo.get(jornada.torneo_id) ?? "Torneo"} — ${jornada.etiqueta}`,
  }));

  const jugadoraPorId = new Map(jugadoras.map((jugadora) => [jugadora.id, jugadora.etiqueta]));
  const jornadaPorId = new Map(jornadas.map((jornada) => [jornada.id, jornada.etiqueta]));

  const { data: suspensiones, error: suspensionesError } = await supabase
    .from("suspensiones")
    .select("id, jugadora_id, jornada_desde_id, jornada_hasta_id, motivo")
    .order("id", { ascending: false });

  const hayErrorDeApoyo = Boolean(jugadorasError || equiposError || jornadasError || torneosError);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="underline">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold">Suspensiones</h1>
      {hayErrorDeApoyo ? (
        <p className="text-red-600">
          No se pudo cargar la información necesaria para el formulario. Intenta de nuevo.
        </p>
      ) : (
        <SuspensionForm jugadoras={jugadoras} jornadas={jornadas} />
      )}
      {suspensionesError ? (
        <p className="text-red-600">No se pudieron cargar las suspensiones. Intenta de nuevo.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Jugadora</th>
              <th className="p-2">Desde</th>
              <th className="p-2">Hasta</th>
              <th className="p-2">Motivo</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(suspensiones ?? []).map((suspension) => (
              <tr key={suspension.id} className="border-t">
                <td className="p-2">
                  {jugadoraPorId.get(suspension.jugadora_id) ?? "Jugadora"}
                </td>
                <td className="p-2">
                  {jornadaPorId.get(suspension.jornada_desde_id) ?? "—"}
                </td>
                <td className="p-2">
                  {jornadaPorId.get(suspension.jornada_hasta_id) ?? "—"}
                </td>
                <td className="p-2">{suspension.motivo ?? "—"}</td>
                <td className="p-2">
                  <DeleteButton
                    onDelete={eliminarSuspension.bind(null, suspension.id)}
                    confirmMessage="¿Eliminar esta suspensión? Esto no se puede deshacer."
                  />
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

- [ ] **Step 8: Link to it from the admin home page**

Read `src/app/admin/(protected)/page.tsx` first (currently has a welcome paragraph and a link to `/admin/torneos`). Add a second link below it:

```tsx
      <Link href="/admin/suspensiones" className="underline">
        Ir a Suspensiones
      </Link>
```

- [ ] **Step 9: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/suspensiones` listed as a route.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/lib/validation/suspension.ts src/lib/validation/suspension.test.ts "src/app/admin/(protected)/suspensiones" "src/app/admin/(protected)/page.tsx"
git commit -m "feat: add suspensiones admin screen (list, create, delete)"
```

---

### Task 2: Avisos — listar, crear, eliminar

**Files:**
- Create: `src/lib/validation/aviso.ts`
- Test: `src/lib/validation/aviso.test.ts`
- Create: `src/app/admin/(protected)/avisos/actions.ts`
- Create: `src/app/admin/(protected)/avisos/aviso-form.tsx`
- Create: `src/app/admin/(protected)/avisos/page.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `DeleteButton`.
- Produces: the `/admin/avisos` route, linked from the admin home page.

- [ ] **Step 1: Write the failing validation test**

```ts
// src/lib/validation/aviso.test.ts
import { describe, expect, it } from "vitest";
import { validateAvisoForm } from "./aviso";

describe("validateAvisoForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateAvisoForm({
        titulo: "Se pospone la jornada 5",
        cuerpo: "Por lluvia, la jornada 5 se pospone una semana.",
        imagenUrl: "",
      })
    ).toEqual({});
  });

  it("requires a non-empty titulo", () => {
    expect(
      validateAvisoForm({ titulo: "", cuerpo: "Texto", imagenUrl: "" }).titulo
    ).toBe("El título es obligatorio.");
  });

  it("requires a non-empty cuerpo", () => {
    expect(
      validateAvisoForm({ titulo: "Aviso", cuerpo: "", imagenUrl: "" }).cuerpo
    ).toBe("El cuerpo es obligatorio.");
  });

  it("allows an empty imagenUrl", () => {
    expect(
      validateAvisoForm({ titulo: "Aviso", cuerpo: "Texto", imagenUrl: "" }).imagenUrl
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/validation/aviso.test.ts`
Expected: FAIL — `Cannot find module './aviso'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/validation/aviso.ts
export interface AvisoFormValues {
  titulo: string;
  cuerpo: string;
  imagenUrl: string;
}

export interface AvisoFormErrors {
  titulo?: string;
  cuerpo?: string;
}

export function validateAvisoForm(values: AvisoFormValues): AvisoFormErrors {
  const errors: AvisoFormErrors = {};

  if (!values.titulo.trim()) {
    errors.titulo = "El título es obligatorio.";
  }
  if (!values.cuerpo.trim()) {
    errors.cuerpo = "El cuerpo es obligatorio.";
  }

  return errors;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 4 new ones.

- [ ] **Step 5: Server actions**

```ts
// src/app/admin/(protected)/avisos/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateAvisoForm, type AvisoFormErrors } from "@/lib/validation/aviso";

export interface CrearAvisoState {
  errors: AvisoFormErrors;
  errorGeneral?: string;
}

export async function crearAviso(
  _prevState: CrearAvisoState,
  formData: FormData
): Promise<CrearAvisoState> {
  const values = {
    titulo: String(formData.get("titulo") ?? ""),
    cuerpo: String(formData.get("cuerpo") ?? ""),
    imagenUrl: String(formData.get("imagenUrl") ?? ""),
  };

  const errors = validateAvisoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("avisos").insert({
      titulo: values.titulo,
      cuerpo: values.cuerpo,
      imagen_url: values.imagenUrl || null,
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo publicar el aviso. Intenta de nuevo." };
    }

    revalidatePath("/admin/avisos");
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo publicar el aviso. Intenta de nuevo." };
  }
}

export async function eliminarAviso(avisoId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("avisos").delete().eq("id", avisoId);

    if (error) {
      return { error: "No se pudo eliminar el aviso. Intenta de nuevo." };
    }

    revalidatePath("/admin/avisos");
    return {};
  } catch {
    return { error: "No se pudo eliminar el aviso. Intenta de nuevo." };
  }
}
```

- [ ] **Step 6: Create form (client component)**

```tsx
// src/app/admin/(protected)/avisos/aviso-form.tsx
"use client";

import { useActionState } from "react";
import { crearAviso, type CrearAvisoState } from "./actions";

const estadoInicial: CrearAvisoState = { errors: {} };

export function AvisoForm() {
  const [state, formAction, pending] = useActionState(crearAviso, estadoInicial);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4 max-w-lg">
      <label className="flex flex-col gap-1">
        <span>Título</span>
        <input name="titulo" className="rounded border px-3 py-2" />
        {state.errors.titulo && (
          <span className="text-sm text-red-600">{state.errors.titulo}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Cuerpo</span>
        <textarea name="cuerpo" className="min-h-24 rounded border px-3 py-2" />
        {state.errors.cuerpo && (
          <span className="text-sm text-red-600">{state.errors.cuerpo}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Imagen (link, opcional)</span>
        <input name="imagenUrl" className="rounded border px-3 py-2" placeholder="https://…" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Publicando…" : "Publicar aviso"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: List page (server component)**

```tsx
// src/app/admin/(protected)/avisos/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { AvisoForm } from "./aviso-form";
import { eliminarAviso } from "./actions";

export default async function AvisosPage() {
  const supabase = await createClient();

  const { data: avisos, error: avisosError } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, fecha_publicacion")
    .order("fecha_publicacion", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="underline">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold">Avisos</h1>
      <AvisoForm />
      {avisosError ? (
        <p className="text-red-600">No se pudieron cargar los avisos. Intenta de nuevo.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(avisos ?? []).map((aviso) => (
            <li key={aviso.id} className="flex flex-col gap-1 rounded border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{aviso.titulo}</span>
                <DeleteButton
                  onDelete={eliminarAviso.bind(null, aviso.id)}
                  confirmMessage={`¿Eliminar el aviso "${aviso.titulo}"? Esto no se puede deshacer.`}
                />
              </div>
              <p className="text-sm text-gray-700">{aviso.cuerpo}</p>
              <span className="text-xs text-gray-500">
                {new Date(aviso.fecha_publicacion).toLocaleDateString("es-MX")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Link to it from the admin home page**

In `src/app/admin/(protected)/page.tsx`, add another link right after the "Ir a Suspensiones" one added in Task 1:

```tsx
      <Link href="/admin/avisos" className="underline">
        Ir a Avisos
      </Link>
```

- [ ] **Step 9: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/avisos` listed as a route.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/lib/validation/aviso.ts src/lib/validation/aviso.test.ts "src/app/admin/(protected)/avisos" "src/app/admin/(protected)/page.tsx"
git commit -m "feat: add avisos admin screen (list, create, delete)"
```

---

### Task 3: Reglamento — subir/reemplazar PDF por torneo

**Files:**
- Create: `src/app/admin/(protected)/torneos/[torneoId]/reglamento/actions.ts`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/reglamento/reglamento-form.tsx`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/reglamento/page.tsx`
- Modify: `src/app/admin/(protected)/torneos/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`, which exposes `.storage` (already part of the installed `@supabase/ssr`/`@supabase/supabase-js` client — no new package needed). Uses the `media` storage bucket and its RLS policies, both created in the Fundación phase (`supabase/migrations/0003_storage.sql`): public read, `is_admin()`-gated insert/update.
- Produces: the `/admin/torneos/[torneoId]/reglamento` route, linked from the Torneos list page. This is the last task of Fase 3.

- [ ] **Step 1: Server action**

```ts
// src/app/admin/(protected)/torneos/[torneoId]/reglamento/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function subirReglamento(
  torneoId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const archivo = formData.get("archivo");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo PDF." };
  }

  if (archivo.type !== "application/pdf") {
    return { error: "El archivo debe ser un PDF." };
  }

  try {
    const supabase = await createClient();
    const ruta = `reglamentos/${torneoId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(ruta, archivo, { upsert: true, contentType: "application/pdf" });

    if (uploadError) {
      return { error: "No se pudo subir el archivo. Intenta de nuevo." };
    }

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(ruta);

    const { error: dbError } = await supabase.from("reglamentos").upsert(
      {
        torneo_id: torneoId,
        pdf_url: publicUrlData.publicUrl,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "torneo_id" }
    );

    if (dbError) {
      return { error: "No se pudo guardar el reglamento. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/reglamento`);
    return {};
  } catch {
    return { error: "No se pudo subir el archivo. Intenta de nuevo." };
  }
}
```

- [ ] **Step 2: Upload form (client component)**

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/reglamento/reglamento-form.tsx
"use client";

import { useActionState } from "react";
import { subirReglamento } from "./actions";

async function accion(torneoId: string, _prevState: { error?: string }, formData: FormData) {
  return subirReglamento(torneoId, formData);
}

export function ReglamentoForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(accion.bind(null, torneoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Archivo PDF</span>
        <input
          type="file"
          name="archivo"
          accept="application/pdf"
          className="rounded border px-3 py-2"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Subiendo…" : "Subir reglamento"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Page (server component)**

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/reglamento/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReglamentoForm } from "./reglamento-form";

export default async function ReglamentoPage({
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

  const { data: reglamento } = await supabase
    .from("reglamentos")
    .select("pdf_url, actualizado_en")
    .eq("torneo_id", torneoId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/torneos" className="underline">
        ← Volver a Torneos
      </Link>
      <h1 className="text-xl font-semibold">Reglamento — {torneo?.nombre ?? "Torneo"}</h1>
      {reglamento?.pdf_url ? (
        <p>
          Reglamento actual:{" "}
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            ver PDF
          </a>
        </p>
      ) : (
        <p className="text-gray-600">Todavía no se ha subido un reglamento.</p>
      )}
      <ReglamentoForm torneoId={torneoId} />
    </div>
  );
}
```

- [ ] **Step 4: Link to it from the Torneos list page**

Read `src/app/admin/(protected)/torneos/page.tsx` first (by this point it has, per row: Nombre, Categoría, Temporada, Activo, a toggle button, "Ver equipos", "Ver jornadas" — added across Fase 2 and Fase 3a). Add one more `<td>` after the "Ver jornadas" one:

```tsx
              <td className="p-2">
                <Link href={`/admin/torneos/${torneo.id}/reglamento`} className="underline">
                  Reglamento
                </Link>
              </td>
```

And add one more empty `<th className="p-2"></th>` to the `<thead>` row so the column count still matches.

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/torneos/[torneoId]/reglamento` listed as a dynamic route.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass (this task adds no new unit tests — the upload flow depends on a live Storage bucket and can't be meaningfully unit-tested without one; it should be manually verified once deployed, same as the health-check route in the Fundación phase).

- [ ] **Step 7: Commit**

```bash
git add "src/app/admin/(protected)/torneos"
git commit -m "feat: add reglamento PDF upload per torneo, completing Fase 3"
```

---

## Al terminar

Con esto, la sección de administración queda completa: torneos, equipos, jugadoras, jornadas, partidos con captura completa, suspensiones, avisos y reglamento. Todo lo que un administradora necesita para operar el torneo día a día ya existe. El siguiente plan (**Fase 4 — Sitio público**) construye las pantallas de consulta que ven las jugadoras y el público en general, usando los mismos datos que esta fase y las anteriores ya capturan.
