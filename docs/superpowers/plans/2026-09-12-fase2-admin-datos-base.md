# Fase 2 — Administración: datos base (torneos, equipos, jugadoras) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two security gaps the Fundación phase's final review flagged as blocking for this phase, then build the admin CRUD screens for torneos, equipos, and jugadoras.

**Architecture:** Server Components fetch and render lists using the Supabase server client (RLS-enforced, no service role). Mutations are Next.js Server Actions (`"use server"`) that re-use the same RLS-enforced client — a write only succeeds if the signed-in user has a row in `perfiles_admin`, exactly as the database already requires. Forms use React 19's `useActionState` for inline validation feedback; delete/toggle actions use `useTransition` with a shared confirm-dialog button.

**Tech Stack:** Same as Fundación (Next.js 16, React 19, TypeScript, Tailwind, Vitest, `@supabase/ssr`, `@supabase/supabase-js`). No new dependencies.

## Global Constraints

- Toda la interfaz usa lenguaje femenino (jugadoras, administradoras).
- Escritura restringida a quien tenga fila en `perfiles_admin` — reforzada en dos capas: RLS (ya existe desde Fundación) y ahora también a nivel de aplicación (este plan).
- Formularios simples y directos, sin pasos innecesarios (spec: prioridad de uso simple en administración).
- Costo objetivo $0/mes — sin dependencias nuevas.
- Por esta fase, `logo_url` y `foto_url` se capturan como un campo de texto (pegar un link), no como un subir-archivo — decisión explícita para mantener el alcance simple; la subida de imágenes queda para una fase posterior corta.
- No se toca nada de `supabase/migrations/` en este plan — el esquema de Fundación ya tiene los campos necesarios.

---

## File Structure

```
src/
├── proxy.ts                                   # MODIFY: add admin-membership check
├── lib/
│   ├── auth/
│   │   ├── is-admin-user.ts                   # NEW: perfiles_admin membership check
│   │   └── is-admin-user.test.ts
│   └── validation/
│       ├── torneo.ts                          # NEW
│       ├── torneo.test.ts
│       ├── equipo.ts                          # NEW
│       ├── equipo.test.ts
│       ├── jugadora.ts                        # NEW
│       └── jugadora.test.ts
├── components/
│   └── admin/
│       └── delete-button.tsx                  # NEW: shared confirm-then-delete button
└── app/
    └── admin/
        ├── login/page.tsx                     # MOVE (unchanged content) — stays outside protected group
        └── (protected)/
            ├── layout.tsx                     # MOVE (unchanged content, from admin/layout.tsx)
            ├── sign-out-button.tsx            # MOVE (unchanged content, from admin/sign-out-button.tsx)
            ├── page.tsx                       # MOVE + MODIFY (link to /admin/torneos)
            └── torneos/
                ├── page.tsx                    # NEW: list + create form
                ├── actions.ts                  # NEW: crearTorneo, alternarTorneoActivo
                ├── torneo-form.tsx             # NEW: client create form
                ├── toggle-activo-button.tsx    # NEW: client toggle
                └── [torneoId]/
                    └── equipos/
                        ├── page.tsx            # NEW: list + create form, scoped to torneo
                        ├── actions.ts          # NEW: crearEquipo, eliminarEquipo
                        └── equipo-form.tsx     # NEW: client create form
        └── equipos/
            └── [equipoId]/
                ├── editar/
                │   └── page.tsx                # NEW: edit form for one equipo
                └── jugadoras/
                    ├── page.tsx                 # NEW: list + create form, scoped to equipo
                    ├── actions.ts               # NEW: crearJugadora, eliminarJugadora
                    └── jugadora-form.tsx        # NEW: client create form
        └── jugadoras/
            └── [jugadoraId]/
                └── editar/
                    └── page.tsx                 # NEW: edit form for one jugadora
```

---

### Task 1: Chequeo de administradora (`requireAdmin`)

**Files:**
- Create: `src/lib/auth/is-admin-user.ts`
- Test: `src/lib/auth/is-admin-user.test.ts`
- Modify: `src/proxy.ts` (currently 50 lines — full current content shown below)

**Interfaces:**
- Consumes: nothing new — uses the `SupabaseClient` type already used throughout the codebase.
- Produces: `isAdminUser(supabase, userId: string): Promise<boolean>` — used by `proxy.ts` now, and by any future server-side page/action in later phases that needs to double-check admin membership.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/auth/is-admin-user.test.ts
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminUser } from "./is-admin-user";

function makeSupabaseMock(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn(async () => result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from } as unknown as SupabaseClient;
}

describe("isAdminUser", () => {
  it("returns true when a matching perfiles_admin row exists", async () => {
    const supabase = makeSupabaseMock({ data: { id: "user-1" }, error: null });
    await expect(isAdminUser(supabase, "user-1")).resolves.toBe(true);
  });

  it("returns false when no matching row exists", async () => {
    const supabase = makeSupabaseMock({ data: null, error: null });
    await expect(isAdminUser(supabase, "user-1")).resolves.toBe(false);
  });

  it("returns false when the query errors", async () => {
    const supabase = makeSupabaseMock({
      data: null,
      error: { message: "boom" },
    });
    await expect(isAdminUser(supabase, "user-1")).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/auth/is-admin-user.test.ts`
Expected: FAIL — `Cannot find module './is-admin-user'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/auth/is-admin-user.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all test files pass, including the 3 new tests.

- [ ] **Step 5: Wire it into the proxy**

Current `src/proxy.ts` (50 lines):

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { shouldProtectPath } from "@/lib/auth/protected-paths";
import { getSupabaseEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
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
  } catch {
    if (shouldProtectPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

Replace it with:

```ts
// src/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { shouldProtectPath } from "@/lib/auth/protected-paths";
import { isAdminUser } from "@/lib/auth/is-admin-user";
import { getSupabaseEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
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

    if (!shouldProtectPath(request.nextUrl.pathname)) {
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdminUser(supabase, user.id))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  } catch {
    if (shouldProtectPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 6: Verify the project still builds and tests pass**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth/is-admin-user.ts src/lib/auth/is-admin-user.test.ts src/proxy.ts
git commit -m "feat: require perfiles_admin membership to access /admin, not just a session"
```

---

### Task 2: Sacar `/admin/login` del layout protegido

**Files:**
- Move: `src/app/admin/layout.tsx` → `src/app/admin/(protected)/layout.tsx` (content unchanged)
- Move: `src/app/admin/page.tsx` → `src/app/admin/(protected)/page.tsx` (content modified — see Step 3)
- No change to `src/app/admin/login/page.tsx`, `src/app/admin/sign-out-button.tsx` — they keep their current relative import paths since `sign-out-button.tsx` stays a sibling of the moved `layout.tsx` (move it into `(protected)/` too, since it's only used by that layout).
- Move: `src/app/admin/sign-out-button.tsx` → `src/app/admin/(protected)/sign-out-button.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — this is a pure routing restructure. `/admin` and `/admin/login` keep the exact same URLs; only `/admin/login` stops being wrapped by the admin shell (header + "Cerrar sesión").

- [ ] **Step 1: Create the route group and move the three files**

```bash
mkdir -p "src/app/admin/(protected)"
git mv src/app/admin/layout.tsx "src/app/admin/(protected)/layout.tsx"
git mv src/app/admin/sign-out-button.tsx "src/app/admin/(protected)/sign-out-button.tsx"
git mv src/app/admin/page.tsx "src/app/admin/(protected)/page.tsx"
```

- [ ] **Step 2: Fix the layout's import of the moved sign-out button**

`src/app/admin/(protected)/layout.tsx` currently imports `./sign-out-button` — since both files moved together into the same folder, this relative import does not need to change. Open the file and confirm it still reads:

```tsx
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

No edit needed if the import still reads `./sign-out-button` — the `git mv` of both files together keeps them siblings.

- [ ] **Step 3: Update the admin home page to link to Torneos**

Replace `src/app/admin/(protected)/page.tsx` with:

```tsx
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <p>Bienvenida al panel de administración de Copa Solose.</p>
      <Link href="/admin/torneos" className="underline">
        Ir a Torneos
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin` and `/admin/login` still listed in the route table (the `(protected)` segment does not appear in the URL).

- [ ] **Step 5: Verify `/admin/login` no longer renders inside the admin shell**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/admin/login > /tmp/login-page.html
grep -c "Acceso de administración" /tmp/login-page.html
grep -c "Cerrar sesión" /tmp/login-page.html
grep -c "Copa Solose — Administración" /tmp/login-page.html
kill %1
```

Expected: the first `grep -c` prints `1` (the login form is still there); the second and third print `0` (the admin shell's header and sign-out button are gone from the login page).

- [ ] **Step 6: Verify `/admin` still redirects when unauthenticated**

```bash
npm run dev &
sleep 3
curl -sI http://localhost:3000/admin | head -1
kill %1
```

Expected: a redirect status line (e.g. `HTTP/1.1 307 Temporary Redirect`), confirming the route group did not accidentally remove the proxy's protection.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all tests still pass (this task touches no test files, but confirms nothing broke).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move admin shell into a (protected) route group so /admin/login renders standalone"
```

---

### Task 3: Torneos — listar, crear, activar/desactivar

**Files:**
- Create: `src/lib/validation/torneo.ts`
- Test: `src/lib/validation/torneo.test.ts`
- Create: `src/app/admin/(protected)/torneos/page.tsx`
- Create: `src/app/admin/(protected)/torneos/actions.ts`
- Create: `src/app/admin/(protected)/torneos/torneo-form.tsx`
- Create: `src/app/admin/(protected)/torneos/toggle-activo-button.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (async, Fundación Task 3).
- Produces: the `torneos` route (`/admin/torneos`) that Task 2's home page already links to. `validateTorneoForm` is a pattern later tasks in this plan copy for `equipo`/`jugadora`.

- [ ] **Step 1: Write the failing validation test**

```ts
// src/lib/validation/torneo.test.ts
import { describe, expect, it } from "vitest";
import { validateTorneoForm } from "./torneo";

describe("validateTorneoForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateTorneoForm({ nombre: "Torneo Femenil", categoria: "femenil", temporada: "2026" })
    ).toEqual({});
  });

  it("requires a non-empty nombre", () => {
    expect(
      validateTorneoForm({ nombre: "", categoria: "femenil", temporada: "2026" }).nombre
    ).toBe("El nombre es obligatorio.");
  });

  it("requires a non-empty categoria", () => {
    expect(
      validateTorneoForm({ nombre: "Torneo", categoria: "", temporada: "2026" }).categoria
    ).toBe("La categoría es obligatoria.");
  });

  it("requires a non-empty temporada", () => {
    expect(
      validateTorneoForm({ nombre: "Torneo", categoria: "femenil", temporada: "" }).temporada
    ).toBe("La temporada es obligatoria.");
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/validation/torneo.test.ts`
Expected: FAIL — `Cannot find module './torneo'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/validation/torneo.ts
export interface TorneoFormValues {
  nombre: string;
  categoria: string;
  temporada: string;
}

export interface TorneoFormErrors {
  nombre?: string;
  categoria?: string;
  temporada?: string;
}

export function validateTorneoForm(values: TorneoFormValues): TorneoFormErrors {
  const errors: TorneoFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }
  if (!values.categoria.trim()) {
    errors.categoria = "La categoría es obligatoria.";
  }
  if (!values.temporada.trim()) {
    errors.temporada = "La temporada es obligatoria.";
  }

  return errors;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 4 new ones.

- [ ] **Step 5: Server actions**

```ts
// src/app/admin/(protected)/torneos/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTorneoForm, type TorneoFormErrors } from "@/lib/validation/torneo";

export interface CrearTorneoState {
  errors: TorneoFormErrors;
  errorGeneral?: string;
}

export async function crearTorneo(
  _prevState: CrearTorneoState,
  formData: FormData
): Promise<CrearTorneoState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    categoria: String(formData.get("categoria") ?? ""),
    temporada: String(formData.get("temporada") ?? ""),
  };

  const errors = validateTorneoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("torneos").insert({
    nombre: values.nombre,
    categoria: values.categoria,
    temporada: values.temporada,
    activo: true,
  });

  if (error) {
    return { errors: {}, errorGeneral: "No se pudo crear el torneo. Intenta de nuevo." };
  }

  revalidatePath("/admin/torneos");
  return { errors: {} };
}

export async function alternarTorneoActivo(id: string, activoActual: boolean) {
  const supabase = await createClient();
  await supabase.from("torneos").update({ activo: !activoActual }).eq("id", id);
  revalidatePath("/admin/torneos");
}
```

- [ ] **Step 6: Create form (client component)**

```tsx
// src/app/admin/(protected)/torneos/torneo-form.tsx
"use client";

import { useActionState } from "react";
import { crearTorneo, type CrearTorneoState } from "./actions";

const estadoInicial: CrearTorneoState = { errors: {} };

export function TorneoForm() {
  const [state, formAction, pending] = useActionState(crearTorneo, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Nombre</span>
        <input name="nombre" className="rounded border px-3 py-2" />
        {state.errors.nombre && (
          <span className="text-sm text-red-600">{state.errors.nombre}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Categoría</span>
        <input name="categoria" className="rounded border px-3 py-2" placeholder="femenil, mixto…" />
        {state.errors.categoria && (
          <span className="text-sm text-red-600">{state.errors.categoria}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Temporada</span>
        <input name="temporada" className="rounded border px-3 py-2" placeholder="2026" />
        {state.errors.temporada && (
          <span className="text-sm text-red-600">{state.errors.temporada}</span>
        )}
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear torneo"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: Toggle button (client component)**

```tsx
// src/app/admin/(protected)/torneos/toggle-activo-button.tsx
"use client";

import { useTransition } from "react";
import { alternarTorneoActivo } from "./actions";

export function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => alternarTorneoActivo(id, activo))}
      disabled={pending}
      className="rounded border px-3 py-1 text-sm disabled:opacity-50"
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
```

- [ ] **Step 8: List page (server component)**

```tsx
// src/app/admin/(protected)/torneos/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TorneoForm } from "./torneo-form";
import { ToggleActivoButton } from "./toggle-activo-button";

export default async function TorneosPage() {
  const supabase = await createClient();
  const { data: torneos } = await supabase
    .from("torneos")
    .select("id, nombre, categoria, temporada, activo")
    .order("temporada", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Torneos</h1>
      <TorneoForm />
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Nombre</th>
            <th className="p-2">Categoría</th>
            <th className="p-2">Temporada</th>
            <th className="p-2">Activo</th>
            <th className="p-2"></th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(torneos ?? []).map((torneo) => (
            <tr key={torneo.id} className="border-t">
              <td className="p-2">{torneo.nombre}</td>
              <td className="p-2">{torneo.categoria}</td>
              <td className="p-2">{torneo.temporada}</td>
              <td className="p-2">{torneo.activo ? "Sí" : "No"}</td>
              <td className="p-2">
                <ToggleActivoButton id={torneo.id} activo={torneo.activo} />
              </td>
              <td className="p-2">
                <Link href={`/admin/torneos/${torneo.id}/equipos`} className="underline">
                  Ver equipos
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 9: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/torneos` listed as a dynamic route.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/lib/validation/torneo.ts src/lib/validation/torneo.test.ts src/app/admin/\(protected\)/torneos
git commit -m "feat: add torneos admin screen (list, create, toggle activo)"
```

---

### Task 4: Equipos — listar por torneo, crear, editar, eliminar

**Files:**
- Create: `src/lib/validation/equipo.ts`
- Test: `src/lib/validation/equipo.test.ts`
- Create: `src/components/admin/delete-button.tsx`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/equipos/page.tsx`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/equipos/actions.ts`
- Create: `src/app/admin/(protected)/torneos/[torneoId]/equipos/equipo-form.tsx`
- Create: `src/app/admin/(protected)/equipos/[equipoId]/editar/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`; the `torneos` table from Task 3.
- Produces: `DeleteButton` (a shared client component other tasks in this plan reuse) with props `{ onDelete: () => Promise<void>; confirmMessage: string }`. The equipos route (`/admin/torneos/[torneoId]/equipos`) that Task 3's list page already links to.

- [ ] **Step 1: Write the failing validation test**

```ts
// src/lib/validation/equipo.test.ts
import { describe, expect, it } from "vitest";
import { validateEquipoForm } from "./equipo";

describe("validateEquipoForm", () => {
  it("returns no errors for valid input", () => {
    expect(validateEquipoForm({ nombre: "Las Águilas", logoUrl: "" })).toEqual({});
  });

  it("requires a non-empty nombre", () => {
    expect(validateEquipoForm({ nombre: "", logoUrl: "" }).nombre).toBe(
      "El nombre es obligatorio."
    );
  });

  it("allows an empty logoUrl", () => {
    expect(validateEquipoForm({ nombre: "Las Águilas", logoUrl: "" }).logoUrl).toBeUndefined();
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/validation/equipo.test.ts`
Expected: FAIL — `Cannot find module './equipo'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/validation/equipo.ts
export interface EquipoFormValues {
  nombre: string;
  logoUrl: string;
}

export interface EquipoFormErrors {
  nombre?: string;
  logoUrl?: string;
}

export function validateEquipoForm(values: EquipoFormValues): EquipoFormErrors {
  const errors: EquipoFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  return errors;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 3 new ones.

- [ ] **Step 5: Shared delete button**

```tsx
// src/components/admin/delete-button.tsx
"use client";

import { useTransition } from "react";

export function DeleteButton({
  onDelete,
  confirmMessage,
}: {
  onDelete: () => Promise<void>;
  confirmMessage: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(onDelete);
      }}
      disabled={pending}
      className="rounded border border-red-600 px-3 py-1 text-sm text-red-600 disabled:opacity-50"
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
```

- [ ] **Step 6: Server actions**

```ts
// src/app/admin/(protected)/torneos/[torneoId]/equipos/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEquipoForm, type EquipoFormErrors } from "@/lib/validation/equipo";

export interface CrearEquipoState {
  errors: EquipoFormErrors;
  errorGeneral?: string;
}

export async function crearEquipo(
  torneoId: string,
  _prevState: CrearEquipoState,
  formData: FormData
): Promise<CrearEquipoState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
  };

  const errors = validateEquipoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("equipos").insert({
    torneo_id: torneoId,
    nombre: values.nombre,
    logo_url: values.logoUrl || null,
  });

  if (error) {
    return { errors: {}, errorGeneral: "No se pudo crear el equipo. Intenta de nuevo." };
  }

  revalidatePath(`/admin/torneos/${torneoId}/equipos`);
  return { errors: {} };
}

export async function actualizarEquipo(
  equipoId: string,
  torneoId: string,
  _prevState: CrearEquipoState,
  formData: FormData
): Promise<CrearEquipoState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
  };

  const errors = validateEquipoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("equipos")
    .update({ nombre: values.nombre, logo_url: values.logoUrl || null })
    .eq("id", equipoId);

  if (error) {
    return { errors: {}, errorGeneral: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidatePath(`/admin/torneos/${torneoId}/equipos`);
  redirect(`/admin/torneos/${torneoId}/equipos`);
}

export async function eliminarEquipo(equipoId: string, torneoId: string) {
  const supabase = await createClient();
  await supabase.from("equipos").delete().eq("id", equipoId);
  revalidatePath(`/admin/torneos/${torneoId}/equipos`);
}
```

- [ ] **Step 7: Create form (client component)**

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/equipos/equipo-form.tsx
"use client";

import { useActionState } from "react";
import { crearEquipo, type CrearEquipoState } from "./actions";

const estadoInicial: CrearEquipoState = { errors: {} };

export function EquipoForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(
    crearEquipo.bind(null, torneoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Nombre</span>
        <input name="nombre" className="rounded border px-3 py-2" />
        {state.errors.nombre && (
          <span className="text-sm text-red-600">{state.errors.nombre}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Logo (link, opcional)</span>
        <input name="logoUrl" className="rounded border px-3 py-2" placeholder="https://…" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear equipo"}
      </button>
    </form>
  );
}
```

- [ ] **Step 8: List page, scoped to the torneo (server component)**

```tsx
// src/app/admin/(protected)/torneos/[torneoId]/equipos/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { EquipoForm } from "./equipo-form";
import { eliminarEquipo } from "./actions";

export default async function EquiposPage({
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

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        Equipos — {torneo?.nombre ?? "Torneo"}
      </h1>
      <EquipoForm torneoId={torneoId} />
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Nombre</th>
            <th className="p-2"></th>
            <th className="p-2"></th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(equipos ?? []).map((equipo) => (
            <tr key={equipo.id} className="border-t">
              <td className="p-2">{equipo.nombre}</td>
              <td className="p-2">
                <Link href={`/admin/equipos/${equipo.id}/editar`} className="underline">
                  Editar
                </Link>
              </td>
              <td className="p-2">
                <Link href={`/admin/equipos/${equipo.id}/jugadoras`} className="underline">
                  Ver jugadoras
                </Link>
              </td>
              <td className="p-2">
                <DeleteButton
                  onDelete={eliminarEquipo.bind(null, equipo.id, torneoId)}
                  confirmMessage={`¿Eliminar a ${equipo.nombre}? Esto no se puede deshacer.`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 9: Edit page (server component with inline form)**

```tsx
// src/app/admin/(protected)/equipos/[equipoId]/editar/page.tsx
import { createClient } from "@/lib/supabase/server";
import { actualizarEquipo } from "../../../torneos/[torneoId]/equipos/actions";
import { notFound } from "next/navigation";

export default async function EditarEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, torneo_id")
    .eq("id", equipoId)
    .maybeSingle();

  if (!equipo) {
    notFound();
  }

  const actualizarConIds = actualizarEquipo.bind(null, equipo.id, equipo.torneo_id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar equipo</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          await actualizarConIds({ errors: {} }, formData);
        }}
        className="flex flex-col gap-3 max-w-sm"
      >
        <label className="flex flex-col gap-1">
          <span>Nombre</span>
          <input
            name="nombre"
            defaultValue={equipo.nombre}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Logo (link, opcional)</span>
          <input
            name="logoUrl"
            defaultValue={equipo.logo_url ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 10: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/torneos/[torneoId]/equipos` and `/admin/equipos/[equipoId]/editar` listed as dynamic routes.

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 12: Commit**

```bash
git add src/lib/validation/equipo.ts src/lib/validation/equipo.test.ts src/components/admin/delete-button.tsx "src/app/admin/(protected)/torneos/[torneoId]" "src/app/admin/(protected)/equipos"
git commit -m "feat: add equipos admin screens (list per torneo, create, edit, delete)"
```

---

### Task 5: Jugadoras — listar por equipo, crear, editar, eliminar

**Files:**
- Create: `src/lib/validation/jugadora.ts`
- Test: `src/lib/validation/jugadora.test.ts`
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/equipos/page.tsx` (the "Ver jugadoras" link already added in Task 4 needs its target to exist — no code change here beyond what Task 4 already wrote; this note is informational)
- Create: `src/app/admin/(protected)/equipos/[equipoId]/jugadoras/page.tsx`
- Create: `src/app/admin/(protected)/equipos/[equipoId]/jugadoras/actions.ts`
- Create: `src/app/admin/(protected)/equipos/[equipoId]/jugadoras/jugadora-form.tsx`
- Create: `src/app/admin/(protected)/jugadoras/[jugadoraId]/editar/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`; `DeleteButton` from `@/components/admin/delete-button` (Task 4).
- Produces: the jugadoras route (`/admin/equipos/[equipoId]/jugadoras`) that Task 4's equipos list page already links to. This closes out Fase 2 — after this task, an administradora can go Torneos → Equipos → Jugadoras end to end.

- [ ] **Step 1: Write the failing validation test**

```ts
// src/lib/validation/jugadora.test.ts
import { describe, expect, it } from "vitest";
import { validateJugadoraForm } from "./jugadora";

describe("validateJugadoraForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "10", fotoUrl: "" })
    ).toEqual({});
  });

  it("requires a non-empty nombre", () => {
    expect(
      validateJugadoraForm({ nombre: "", numeroCamiseta: "10", fotoUrl: "" }).nombre
    ).toBe("El nombre es obligatorio.");
  });

  it("allows an empty numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "", fotoUrl: "" })
        .numeroCamiseta
    ).toBeUndefined();
  });

  it("rejects a non-numeric numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "abc", fotoUrl: "" })
        .numeroCamiseta
    ).toBe("El número debe ser un valor numérico.");
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/validation/jugadora.test.ts`
Expected: FAIL — `Cannot find module './jugadora'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/validation/jugadora.ts
export interface JugadoraFormValues {
  nombre: string;
  numeroCamiseta: string;
  fotoUrl: string;
}

export interface JugadoraFormErrors {
  nombre?: string;
  numeroCamiseta?: string;
}

export function validateJugadoraForm(values: JugadoraFormValues): JugadoraFormErrors {
  const errors: JugadoraFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (values.numeroCamiseta.trim() && Number.isNaN(Number(values.numeroCamiseta))) {
    errors.numeroCamiseta = "El número debe ser un valor numérico.";
  }

  return errors;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 4 new ones.

- [ ] **Step 5: Server actions**

```ts
// src/app/admin/(protected)/equipos/[equipoId]/jugadoras/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateJugadoraForm, type JugadoraFormErrors } from "@/lib/validation/jugadora";

export interface CrearJugadoraState {
  errors: JugadoraFormErrors;
  errorGeneral?: string;
}

function parseNumeroCamiseta(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export async function crearJugadora(
  equipoId: string,
  _prevState: CrearJugadoraState,
  formData: FormData
): Promise<CrearJugadoraState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    numeroCamiseta: String(formData.get("numeroCamiseta") ?? ""),
    fotoUrl: String(formData.get("fotoUrl") ?? ""),
  };

  const errors = validateJugadoraForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("jugadoras").insert({
    equipo_id: equipoId,
    nombre: values.nombre,
    numero_camiseta: parseNumeroCamiseta(values.numeroCamiseta),
    foto_url: values.fotoUrl || null,
  });

  if (error) {
    return {
      errors: {},
      errorGeneral: "No se pudo registrar a la jugadora. Intenta de nuevo.",
    };
  }

  revalidatePath(`/admin/equipos/${equipoId}/jugadoras`);
  return { errors: {} };
}

export async function actualizarJugadora(
  jugadoraId: string,
  equipoId: string,
  _prevState: CrearJugadoraState,
  formData: FormData
): Promise<CrearJugadoraState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    numeroCamiseta: String(formData.get("numeroCamiseta") ?? ""),
    fotoUrl: String(formData.get("fotoUrl") ?? ""),
  };

  const errors = validateJugadoraForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("jugadoras")
    .update({
      nombre: values.nombre,
      numero_camiseta: parseNumeroCamiseta(values.numeroCamiseta),
      foto_url: values.fotoUrl || null,
    })
    .eq("id", jugadoraId);

  if (error) {
    return { errors: {}, errorGeneral: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidatePath(`/admin/equipos/${equipoId}/jugadoras`);
  redirect(`/admin/equipos/${equipoId}/jugadoras`);
}

export async function eliminarJugadora(jugadoraId: string, equipoId: string) {
  const supabase = await createClient();
  await supabase.from("jugadoras").delete().eq("id", jugadoraId);
  revalidatePath(`/admin/equipos/${equipoId}/jugadoras`);
}
```

- [ ] **Step 6: Create form (client component)**

```tsx
// src/app/admin/(protected)/equipos/[equipoId]/jugadoras/jugadora-form.tsx
"use client";

import { useActionState } from "react";
import { crearJugadora, type CrearJugadoraState } from "./actions";

const estadoInicial: CrearJugadoraState = { errors: {} };

export function JugadoraForm({ equipoId }: { equipoId: string }) {
  const [state, formAction, pending] = useActionState(
    crearJugadora.bind(null, equipoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Nombre</span>
        <input name="nombre" className="rounded border px-3 py-2" />
        {state.errors.nombre && (
          <span className="text-sm text-red-600">{state.errors.nombre}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Número de camiseta (opcional)</span>
        <input name="numeroCamiseta" className="rounded border px-3 py-2" />
        {state.errors.numeroCamiseta && (
          <span className="text-sm text-red-600">{state.errors.numeroCamiseta}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Foto (link, opcional)</span>
        <input name="fotoUrl" className="rounded border px-3 py-2" placeholder="https://…" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar jugadora"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: List page, scoped to the equipo (server component)**

```tsx
// src/app/admin/(protected)/equipos/[equipoId]/jugadoras/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { JugadoraForm } from "./jugadora-form";
import { eliminarJugadora } from "./actions";

export default async function JugadorasPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", equipoId)
    .maybeSingle();

  const { data: jugadoras } = await supabase
    .from("jugadoras")
    .select("id, nombre, numero_camiseta")
    .eq("equipo_id", equipoId)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        Jugadoras — {equipo?.nombre ?? "Equipo"}
      </h1>
      <JugadoraForm equipoId={equipoId} />
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Nombre</th>
            <th className="p-2">Número</th>
            <th className="p-2"></th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(jugadoras ?? []).map((jugadora) => (
            <tr key={jugadora.id} className="border-t">
              <td className="p-2">{jugadora.nombre}</td>
              <td className="p-2">{jugadora.numero_camiseta ?? "—"}</td>
              <td className="p-2">
                <Link href={`/admin/jugadoras/${jugadora.id}/editar`} className="underline">
                  Editar
                </Link>
              </td>
              <td className="p-2">
                <DeleteButton
                  onDelete={eliminarJugadora.bind(null, jugadora.id, equipoId)}
                  confirmMessage={`¿Eliminar a ${jugadora.nombre}? Esto no se puede deshacer.`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 8: Edit page (server component with inline form)**

```tsx
// src/app/admin/(protected)/jugadoras/[jugadoraId]/editar/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarJugadora } from "../../../equipos/[equipoId]/jugadoras/actions";

export default async function EditarJugadoraPage({
  params,
}: {
  params: Promise<{ jugadoraId: string }>;
}) {
  const { jugadoraId } = await params;
  const supabase = await createClient();

  const { data: jugadora } = await supabase
    .from("jugadoras")
    .select("id, nombre, numero_camiseta, foto_url, equipo_id")
    .eq("id", jugadoraId)
    .maybeSingle();

  if (!jugadora) {
    notFound();
  }

  const actualizarConIds = actualizarJugadora.bind(null, jugadora.id, jugadora.equipo_id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar jugadora</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          await actualizarConIds({ errors: {} }, formData);
        }}
        className="flex flex-col gap-3 max-w-sm"
      >
        <label className="flex flex-col gap-1">
          <span>Nombre</span>
          <input
            name="nombre"
            defaultValue={jugadora.nombre}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Número de camiseta (opcional)</span>
          <input
            name="numeroCamiseta"
            defaultValue={jugadora.numero_camiseta ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Foto (link, opcional)</span>
          <input
            name="fotoUrl"
            defaultValue={jugadora.foto_url ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 9: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/admin/equipos/[equipoId]/jugadoras` and `/admin/jugadoras/[jugadoraId]/editar` listed as dynamic routes.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/lib/validation/jugadora.ts src/lib/validation/jugadora.test.ts "src/app/admin/(protected)/equipos/[equipoId]/jugadoras" "src/app/admin/(protected)/jugadoras"
git commit -m "feat: add jugadoras admin screens (list per equipo, create, edit, delete)"
```

---

## Al terminar

Con esto, una administradora puede entrar a `/admin`, crear un torneo, agregarle equipos, y agregarle jugadoras a cada equipo — de punta a punta, con la protección de que solo cuentas en `perfiles_admin` pueden hacerlo (verificado en dos capas: RLS y la aplicación). El siguiente plan (**Fase 3 — Administración: partidos**) construye sobre estas pantallas para agregar jornadas, captura de partidos, suspensiones, avisos y reglamento.
