# Fase 5c — Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar la identidad visual de Solosé (tokens y componentes de Fase 5a/5b) a toda la sección admin de Copa Solose — la última fase del proyecto de rediseño.

**Architecture:** Mismo enfoque que Fase 5b: cada página admin ya funciona correctamente (Server Actions, validación, Supabase) — este plan solo cambia clases/estructura visual, agrega dos componentes/patrones nuevos (`FormularioColapsable` para el patrón "alta discreta", iconos `lucide-react`), conecta `Avatar` donde ya se muestran nombres, y corrige dos gaps reales de manejo de errores encontrados al leer el código (no relacionados con el rediseño, pero triviales de arreglar de paso).

**Tech Stack:** Next.js 16 App Router (Server + Client Components), Tailwind CSS v4, `lucide-react` (ya instalado desde Fase 5a), componentes de Fase 5a/5b (`Avatar`, tokens `bg-crema`/`text-azul`/`text-vino`/`text-tinta`/`text-tinta-2`/`border-linea`/`border-linea-2`, `font-tit`/`font-cuerpo`/`font-mono`).

## Global Constraints

- **Patrón de encabezado de sección** (igual que en 5b): `<div className="flex items-baseline gap-2 border-b-2 border-azul pb-2"><h1/h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">TÍTULO</h1/h2></div>`.
- **Patrón de mensaje de error de formulario** (`errorGeneral`, igual que en 5b): `<p className="rounded-sm border-l-2 px-3 py-2.5 text-sm" style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}>TEXTO</p>`.
- **Error de campo individual**: `<span className="text-sm text-vino">TEXTO</span>` (el token `--color-vino` de Fase 5a ya habilita la utilidad Tailwind `text-vino` directamente, sin necesidad de `style` inline aquí).
- **Texto secundario/etiquetas**: usar `text-tinta-2`, **nunca `text-tinta-3`** — lección de la revisión final de Fase 5b: `tinta-3` da un contraste de 2.65:1 sobre el fondo crema, no pasa WCAG AA, y el propio doc de identidad dice que es "nunca para texto que importe". Reservar `tinta-3` solo para texto genuinamente decorativo (no hay casos de ese tipo en este plan).
- **Input/select/textarea**: `rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20`.
- **Botón primario**: `rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50`.
- **Botón secundario**: `rounded-sm border border-linea bg-papel px-3 py-1.5 text-sm font-medium hover:border-azul hover:text-azul disabled:opacity-50`.
- **Botón destructivo**: `rounded-sm border border-vino px-3 py-1.5 text-sm font-medium text-vino hover:bg-vino hover:text-white disabled:opacity-50`.
- **Tabla**: encabezados `border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2`, filas `border-b border-linea-2`, celdas `p-2 text-sm`. Sin cajas ni sombras.
- **Casilla de alineación** (círculo, spec sección 8, `.box`): `h-[19px] w-[19px] appearance-none rounded-full border-[1.5px] border-linea bg-papel checked:border-azul checked:bg-azul`.
- **Iconos**: `lucide-react` (ya instalado), `strokeWidth={1.7}`, tamaño `14` en línea con texto `text-sm`, `13` junto a texto más chico. Iconos de este plan: `ArrowLeft` (volver), `Pencil` (editar), `Trash2` (eliminar), `LogOut` (cerrar sesión), `Plus` (alta discreta).
- **Patrón "alta discreta"** (spec sección 8): un componente nuevo `FormularioColapsable` envuelve el formulario de creación de una lista — se aplica a torneo, equipo, jugadora, jornada, partido, suspensión, aviso (7 formularios). **NO** se aplica a `gol-form`/`tarjeta-form` (captura en vivo, entrada repetida) ni a `mvp-form`/`incidencias-form`/`reglamento-form` (editan un solo valor existente, no crean filas nuevas en una lista).
- Cada `<form>` de los 7 formularios envueltos en `FormularioColapsable` pierde su caja propia (`rounded border p-4` → sin borde/fondo, el componente padre ya da el contexto visual de "abierto").
- **Avatares**: se agrega `<Avatar src={... ?? null} nombre={...} size={20} />` junto al nombre de equipo/jugadora en las filas de tabla de: Equipos, Jugadoras, Partidos (local/visitante), Suspensiones. Nunca dentro de un `<select>` (un `<option>` nativo no puede llevar imagen). El admin no tiene fichas públicas de equipo/jugadora enlazables — el nombre en las tablas admin es texto plano con avatar al lado, no un link.
- **Dos correcciones de manejo de errores** (gaps reales encontrados al leer el código, no relacionados con el rediseño): (a) `equipos/[equipoId]/editar/page.tsx` y `jugadoras/[jugadoraId]/editar/page.tsx` no destructuran ni chequean `error` de Supabase en absoluto — se agrega el patrón ya establecido en el resto del proyecto: `if (!x && !error) { notFound(); }` seguido de `if (error || !x) { return <ErrorUI/>; }`; (b) `equipos/[equipoId]/jugadoras/page.tsx` tiene un link "← Volver" que solo se renderiza si `equipo?.torneo_id` existe — se cambia a renderizarse siempre, con `/admin/torneos` como href de respaldo cuando no se pudo resolver el torneo (mismo patrón de respaldo ya usado en `capturar/page.tsx`).
- Ningún cambio a Server Actions, validaciones, ni lógica de negocio — solo estructura/clases JSX y las dos correcciones de manejo de errores arriba.
- Los 75 tests existentes (`npm test -- --run`) deben seguir pasando sin cambios después de cada tarea (17 archivos).
- Spec completo: `docs/superpowers/specs/2026-09-14-fase5-identidad-visual-design.md`.

---

### Task 1: Componentes compartidos de admin

**Files:**
- Create: `src/components/admin/formulario-colapsable.tsx`
- Modify: `src/components/admin/delete-button.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/torneos/toggle-activo-button.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/sign-out-button.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: nada de tareas anteriores (primera tarea de la fase). `Avatar`, tokens y `lucide-react` ya existen desde Fase 5a.
- Produces: `FormularioColapsable({ etiqueta, children }: { etiqueta: string; children: ReactNode })` — Client Component. Tareas 4–8 y 11–12 lo consumen envolviendo cada `<XxxForm />` en las páginas de lista.

- [ ] **Step 1: Crear `src/components/admin/formulario-colapsable.tsx`**

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

export function FormularioColapsable({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 border-t border-linea-2 pt-3 text-sm text-tinta-2 hover:text-azul"
      >
        <Plus
          size={13}
          strokeWidth={1.7}
          className="rounded-full border border-dashed border-current p-0.5"
        />
        {etiqueta}
      </button>
    );
  }

  return <div className="flex flex-col gap-3 border-t border-linea-2 pt-3">{children}</div>;
}
```

- [ ] **Step 2: Reemplazar `src/components/admin/delete-button.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  onDelete,
  confirmMessage,
}: {
  onDelete: () => Promise<{ error?: string } | void>;
  confirmMessage: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result && result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-sm border border-vino px-3 py-1.5 text-sm font-medium text-vino hover:bg-vino hover:text-white disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.7} />
        {pending ? "Eliminando…" : "Eliminar"}
      </button>
      {error && <span className="text-xs text-vino">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Reemplazar `src/app/admin/(protected)/torneos/toggle-activo-button.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { alternarTorneoActivo } from "./actions";

export function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await alternarTorneoActivo(id, activo);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-sm border border-linea bg-papel px-3 py-1.5 text-sm font-medium hover:border-azul hover:text-azul disabled:opacity-50"
      >
        {activo ? "Desactivar" : "Activar"}
      </button>
      {error && <span className="text-xs text-vino">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 4: Reemplazar `src/app/admin/(protected)/sign-out-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function handleSignOut() {
    setCargando(true);
    const supabase = createClient();

    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors: the goal is always to land on the login page.
    } finally {
      router.push("/admin/login");
      router.refresh();
      setCargando(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={cargando}
      className="inline-flex items-center gap-1.5 rounded-sm border border-linea bg-papel px-3 py-1.5 text-sm font-medium hover:border-azul hover:text-azul disabled:opacity-50"
    >
      <LogOut size={14} strokeWidth={1.7} />
      Cerrar sesión
    </button>
  );
}
```

- [ ] **Step 5: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sin errores.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/formulario-colapsable.tsx src/components/admin/delete-button.tsx "src/app/admin/(protected)/torneos/toggle-activo-button.tsx" "src/app/admin/(protected)/sign-out-button.tsx"
git commit -m "feat: add admin shared primitives (FormularioColapsable, restyled buttons)

FormularioColapsable implements the identity doc's 'alta discreta'
pattern. DeleteButton/ToggleActivoButton/SignOutButton restyled with
Solosé tokens and lucide-react icons."
```

---

### Task 2: Login y layout de admin

**Files:**
- Modify: `src/app/admin/login/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/layout.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `Logo` (`src/components/ui/logo.tsx`, Fase 5a, sin props), `SignOutButton` (Task 1).
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Logo />
      <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
        Acceso de administración
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-0 border-b border-linea bg-transparent px-1 py-2 text-sm focus:border-azul focus:outline-none"
          />
          {errors.email && <span className="text-sm text-vino">{errors.email}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-0 border-b border-linea bg-transparent px-1 py-2 text-sm focus:border-azul focus:outline-none"
          />
          {errors.password && <span className="text-sm text-vino">{errors.password}</span>}
        </label>
        {errorGeneral && (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
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

- [ ] **Step 2: Reemplazar `src/app/admin/(protected)/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "./sign-out-button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-linea px-6 py-4">
        <div className="flex items-baseline gap-2">
          <Logo />
          <span className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
            Administración
          </span>
        </div>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
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
git add src/app/admin/login/page.tsx "src/app/admin/(protected)/layout.tsx"
git commit -m "feat: apply Solosé identity to admin login and layout

Login uses the 'sin caja, solo línea inferior' input pattern from the
identity doc's access-screen rule."
```

---

### Task 3: Página de inicio de admin

**Files:**
- Modify: `src/app/admin/(protected)/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/admin/(protected)/page.tsx`**

```tsx
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-tinta-2">Bienvenida al panel de administración de Copa Solose.</p>
      <nav className="flex flex-col gap-2">
        <Link href="/admin/torneos" className="text-sm font-medium text-azul underline">
          Ir a Torneos
        </Link>
        <Link href="/admin/suspensiones" className="text-sm font-medium text-azul underline">
          Ir a Suspensiones
        </Link>
        <Link href="/admin/avisos" className="text-sm font-medium text-azul underline">
          Ir a Avisos
        </Link>
      </nav>
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
git add "src/app/admin/(protected)/page.tsx"
git commit -m "feat: apply Solosé identity to admin home page"
```

---

### Task 4: Torneos

**Files:**
- Modify: `src/app/admin/(protected)/torneos/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/torneos/torneo-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `FormularioColapsable` (Task 1), `ToggleActivoButton` (Task 1, ya restilado).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/admin/(protected)/torneos/torneo-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { crearTorneo, type CrearTorneoState } from "./actions";

const estadoInicial: CrearTorneoState = { errors: {} };

export function TorneoForm() {
  const [state, formAction, pending] = useActionState(crearTorneo, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Nombre</span>
        <input
          name="nombre"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.nombre && <span className="text-sm text-vino">{state.errors.nombre}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Categoría</span>
        <input
          name="categoria"
          placeholder="femenil, mixto…"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.categoria && (
          <span className="text-sm text-vino">{state.errors.categoria}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Temporada</span>
        <input
          name="temporada"
          placeholder="2026"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.temporada && (
          <span className="text-sm text-vino">{state.errors.temporada}</span>
        )}
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear torneo"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `src/app/admin/(protected)/torneos/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TorneoForm } from "./torneo-form";
import { ToggleActivoButton } from "./toggle-activo-button";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";

export default async function TorneosPage() {
  const supabase = await createClient();
  const { data: torneos, error } = await supabase
    .from("torneos")
    .select("id, nombre, categoria, temporada, activo")
    .order("temporada", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Torneos</h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo torneo…">
        <TorneoForm />
      </FormularioColapsable>
      {error ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar los torneos. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Nombre
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Categoría
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Temporada
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Activo
                </th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(torneos ?? []).map((torneo) => (
                <tr key={torneo.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">{torneo.nombre}</td>
                  <td className="p-2 text-sm">{torneo.categoria}</td>
                  <td className="p-2 text-sm">{torneo.temporada}</td>
                  <td className="p-2 text-sm">{torneo.activo ? "Sí" : "No"}</td>
                  <td className="p-2">
                    <ToggleActivoButton id={torneo.id} activo={torneo.activo} />
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneo.id}/equipos`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver equipos
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneo.id}/jornadas`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver jornadas
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneo.id}/reglamento`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Reglamento
                    </Link>
                  </td>
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

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/torneos/page.tsx" "src/app/admin/(protected)/torneos/torneo-form.tsx"
git commit -m "feat: apply Solosé identity to Torneos admin, collapse creation form"
```

---

### Task 5: Equipos

**Files:**
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/equipos/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/equipos/equipo-form.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/equipos/[equipoId]/editar/page.tsx` (reemplazo completo — incluye la corrección de manejo de errores)

**Interfaces:**
- Consumes: `FormularioColapsable`, `DeleteButton` (Task 1), `Avatar` (Fase 5a).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/admin/(protected)/torneos/[torneoId]/equipos/equipo-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Nombre</span>
        <input
          name="nombre"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.nombre && <span className="text-sm text-vino">{state.errors.nombre}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Logo (link, opcional)</span>
        <input
          name="logoUrl"
          placeholder="https://…"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear equipo"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `src/app/admin/(protected)/torneos/[torneoId]/equipos/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { EquipoForm } from "./equipo-form";
import { eliminarEquipo } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

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

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/torneos"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Torneos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Equipos — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo equipo…">
        <EquipoForm torneoId={torneoId} />
      </FormularioColapsable>
      {equiposError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar los equipos. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Nombre
                </th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(equipos ?? []).map((equipo) => (
                <tr key={equipo.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar src={equipo.logo_url} nombre={equipo.nombre} size={20} />
                      {equipo.nombre}
                    </span>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/equipos/${equipo.id}/editar`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-azul underline"
                    >
                      <Pencil size={13} strokeWidth={1.7} />
                      Editar
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/equipos/${equipo.id}/jugadoras`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver jugadoras
                    </Link>
                  </td>
                  <td className="p-2">
                    <DeleteButton
                      onDelete={eliminarEquipo.bind(null, equipo.id, torneoId)}
                      confirmMessage={`¿Eliminar a ${equipo.nombre}? Esto también eliminará a todas sus jugadoras registradas y no se puede deshacer.`}
                    />
                  </td>
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

- [ ] **Step 3: Reemplazar `src/app/admin/(protected)/equipos/[equipoId]/editar/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, torneo_id")
    .eq("id", equipoId)
    .maybeSingle();

  if (!equipo && !equipoError) {
    notFound();
  }

  if (equipoError || !equipo) {
    return (
      <div className="flex flex-col gap-4">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el equipo. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const actualizarConIds = actualizarEquipo.bind(null, equipo.id, equipo.torneo_id);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/torneos/${equipo.torneo_id}/equipos`}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Equipos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Editar equipo
        </h1>
      </div>
      <form
        action={async (formData: FormData) => {
          "use server";
          await actualizarConIds({ errors: {} }, formData);
        }}
        className="flex max-w-sm flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Nombre</span>
          <input
            name="nombre"
            defaultValue={equipo.nombre}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Logo (link, opcional)</span>
          <input
            name="logoUrl"
            defaultValue={equipo.logo_url ?? ""}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
```

Nota: este paso corrige un gap real — el archivo original no destructuraba ni chequeaba `error` de Supabase en absoluto (solo `if (!equipo) notFound()`). Ahora sigue el patrón ya establecido en el resto del proyecto: `notFound()` solo cuando de verdad no existe (sin error de por medio), y un mensaje de error separado cuando la consulta falló.

- [ ] **Step 4: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/torneos/[torneoId]/equipos/page.tsx" "src/app/admin/(protected)/torneos/[torneoId]/equipos/equipo-form.tsx" "src/app/admin/(protected)/equipos/[equipoId]/editar/page.tsx"
git commit -m "feat: apply Solosé identity to Equipos admin, add avatars, fix missing error check on editar

Editar equipo previously had no error handling at all for the
Supabase lookup — now follows the project's established
notFound()-vs-error pattern."
```

---

### Task 6: Jugadoras

**Files:**
- Modify: `src/app/admin/(protected)/equipos/[equipoId]/jugadoras/page.tsx` (reemplazo completo — incluye la corrección del link "Volver" condicional)
- Modify: `src/app/admin/(protected)/equipos/[equipoId]/jugadoras/jugadora-form.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/jugadoras/[jugadoraId]/editar/page.tsx` (reemplazo completo — incluye la corrección de manejo de errores)

**Interfaces:**
- Consumes: `FormularioColapsable`, `DeleteButton` (Task 1), `Avatar` (Fase 5a).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/admin/(protected)/equipos/[equipoId]/jugadoras/jugadora-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Nombre</span>
        <input
          name="nombre"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.nombre && <span className="text-sm text-vino">{state.errors.nombre}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Número de camiseta (opcional)</span>
        <input
          name="numeroCamiseta"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.numeroCamiseta && (
          <span className="text-sm text-vino">{state.errors.numeroCamiseta}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Foto (link, opcional)</span>
        <input
          name="fotoUrl"
          placeholder="https://…"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar jugadora"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `src/app/admin/(protected)/equipos/[equipoId]/jugadoras/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { JugadoraForm } from "./jugadora-form";
import { eliminarJugadora } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

export default async function JugadorasPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipos")
    .select("nombre, torneo_id")
    .eq("id", equipoId)
    .maybeSingle();

  const { data: jugadoras, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta")
    .eq("equipo_id", equipoId)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={equipo?.torneo_id ? `/admin/torneos/${equipo.torneo_id}/equipos` : "/admin/torneos"}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Equipos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Jugadoras — {equipo?.nombre ?? "Equipo"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nueva jugadora…">
        <JugadoraForm equipoId={equipoId} />
      </FormularioColapsable>
      {jugadorasError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las jugadoras. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Nombre
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Número
                </th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(jugadoras ?? []).map((jugadora) => (
                <tr key={jugadora.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar src={jugadora.foto_url} nombre={jugadora.nombre} size={20} />
                      {jugadora.nombre}
                    </span>
                  </td>
                  <td className="p-2 text-sm">{jugadora.numero_camiseta ?? "—"}</td>
                  <td className="p-2">
                    <Link
                      href={`/admin/jugadoras/${jugadora.id}/editar`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-azul underline"
                    >
                      <Pencil size={13} strokeWidth={1.7} />
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
      )}
    </div>
  );
}
```

Nota: este paso corrige el link "Volver" que antes solo se renderizaba si `equipo?.torneo_id` existía (`{equipo?.torneo_id && (<Link>...)}`) — ahora siempre se renderiza, con `/admin/torneos` como respaldo si no se pudo resolver el torneo. Mismo patrón de respaldo que ya usa `capturar/page.tsx`.

- [ ] **Step 3: Reemplazar `src/app/admin/(protected)/jugadoras/[jugadoraId]/editar/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const { data: jugadora, error: jugadoraError } = await supabase
    .from("jugadoras")
    .select("id, nombre, numero_camiseta, foto_url, equipo_id")
    .eq("id", jugadoraId)
    .maybeSingle();

  if (!jugadora && !jugadoraError) {
    notFound();
  }

  if (jugadoraError || !jugadora) {
    return (
      <div className="flex flex-col gap-4">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la jugadora. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const actualizarConIds = actualizarJugadora.bind(null, jugadora.id, jugadora.equipo_id);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/equipos/${jugadora.equipo_id}/jugadoras`}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Jugadoras
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Editar jugadora
        </h1>
      </div>
      <form
        action={async (formData: FormData) => {
          "use server";
          await actualizarConIds({ errors: {} }, formData);
        }}
        className="flex max-w-sm flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Nombre</span>
          <input
            name="nombre"
            defaultValue={jugadora.nombre}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Número de camiseta (opcional)</span>
          <input
            name="numeroCamiseta"
            defaultValue={jugadora.numero_camiseta ?? ""}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Foto (link, opcional)</span>
          <input
            name="fotoUrl"
            defaultValue={jugadora.foto_url ?? ""}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
```

Nota: mismo tipo de corrección que en Task 5 — el archivo original no chequeaba `error` en absoluto.

- [ ] **Step 4: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/equipos/[equipoId]/jugadoras/page.tsx" "src/app/admin/(protected)/equipos/[equipoId]/jugadoras/jugadora-form.tsx" "src/app/admin/(protected)/jugadoras/[jugadoraId]/editar/page.tsx"
git commit -m "feat: apply Solosé identity to Jugadoras admin, add avatars, fix back-link and error check

Jugadoras list previously dropped its 'Volver' link entirely if the
equipo lookup failed — now always renders with a fallback href.
Editar jugadora previously had no error handling for the Supabase
lookup — now follows the project's established pattern."
```

---

### Task 7: Jornadas

**Files:**
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/jornada-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `FormularioColapsable` (Task 1).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `src/app/admin/(protected)/torneos/[torneoId]/jornadas/jornada-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Etiqueta</span>
        <input
          name="etiqueta"
          placeholder="Jornada 1"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.etiqueta && (
          <span className="text-sm text-vino">{state.errors.etiqueta}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Tipo</span>
        <select
          name="tipo"
          defaultValue="regular"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="regular">Regular</option>
          <option value="liguilla">Liguilla</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-vino">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Orden</span>
        <input
          name="orden"
          placeholder="1"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.orden && <span className="text-sm text-vino">{state.errors.orden}</span>}
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear jornada"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `src/app/admin/(protected)/torneos/[torneoId]/jornadas/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JornadaForm } from "./jornada-form";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";

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
      <Link
        href="/admin/torneos"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Torneos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Jornadas — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nueva jornada…">
        <JornadaForm torneoId={torneoId} />
      </FormularioColapsable>
      {jornadasError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las jornadas. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Etiqueta
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Tipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Orden
                </th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(jornadas ?? []).map((jornada) => (
                <tr key={jornada.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">{jornada.etiqueta}</td>
                  <td className="p-2 text-sm">{jornada.tipo}</td>
                  <td className="p-2 text-sm">{jornada.orden}</td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneoId}/jornadas/${jornada.id}/partidos`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver partidos
                    </Link>
                  </td>
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

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/torneos/[torneoId]/jornadas/page.tsx" "src/app/admin/(protected)/torneos/[torneoId]/jornadas/jornada-form.tsx"
git commit -m "feat: apply Solosé identity to Jornadas admin, collapse creation form"
```

---

### Task 8: Partidos (lista por jornada)

**Files:**
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/partido-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `FormularioColapsable` (Task 1), `Avatar` (Fase 5a).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `.../partidos/partido-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Equipo local</span>
        <select
          name="equipoLocalId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoLocalId && (
          <span className="text-sm text-vino">{state.errors.equipoLocalId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Equipo visitante</span>
        <select
          name="equipoVisitanteId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoVisitanteId && (
          <span className="text-sm text-vino">{state.errors.equipoVisitanteId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Fecha</span>
        <input
          type="date"
          name="fecha"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.fecha && <span className="text-sm text-vino">{state.errors.fecha}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Hora (opcional)</span>
        <input
          type="time"
          name="hora"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear partido"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `.../partidos/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PartidoForm } from "./partido-form";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

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
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId)
    .order("nombre");

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );

  const { data: partidos, error: partidosError } = await supabase
    .from("partidos")
    .select("id, equipo_local_id, equipo_visitante_id, fecha, hora")
    .eq("jornada_id", jornadaId)
    .order("fecha");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/torneos/${torneoId}/jornadas`}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Jornadas
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Partidos — {jornada?.etiqueta ?? "Jornada"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo partido…">
        <PartidoForm jornadaId={jornadaId} torneoId={torneoId} equipos={equipos ?? []} />
      </FormularioColapsable>
      {partidosError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar los partidos. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Local
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Visitante
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Fecha
                </th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(partidos ?? []).map((partido) => {
                const local = equipoInfoPorId.get(partido.equipo_local_id);
                const visitante = equipoInfoPorId.get(partido.equipo_visitante_id);
                return (
                  <tr key={partido.id} className="border-b border-linea-2">
                    <td className="p-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar src={local?.logoUrl ?? null} nombre={local?.nombre ?? "Equipo"} size={20} />
                        {local?.nombre ?? "Equipo"}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar
                          src={visitante?.logoUrl ?? null}
                          nombre={visitante?.nombre ?? "Equipo"}
                          size={20}
                        />
                        {visitante?.nombre ?? "Equipo"}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-sm">{partido.fecha ?? "—"}</td>
                    <td className="p-2">
                      <Link
                        href={`/admin/partidos/${partido.id}/capturar`}
                        className="text-sm font-medium text-azul underline"
                      >
                        Capturar
                      </Link>
                    </td>
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

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/page.tsx" "src/app/admin/(protected)/torneos/[torneoId]/jornadas/[jornadaId]/partidos/partido-form.tsx"
git commit -m "feat: apply Solosé identity to Partidos admin list, add team avatars"
```

---

### Task 9: Captura de partido — pantalla principal y alineación

**Files:**
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx` (reemplazo completo — incluye ajuste del patrón `notFound()`)
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/alineacion-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: nada nuevo de tareas anteriores (esta tarea no usa `FormularioColapsable` — la alineación es un editor de un solo estado, no una lista con alta).
- Produces: nada consumido por otras tareas. `GolForm`/`TarjetaForm`/`MvpForm`/`IncidenciasForm` se restilan en la Task 10 pero sus imports en `page.tsx` no cambian de nombre ni de props.

- [ ] **Step 1: Reemplazar `.../capturar/alineacion-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Alineación
        </h2>
      </div>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-tinta">{nombreLocal}</span>
          {jugadorasLocal.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="jugadorasLocal"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
                className="h-[19px] w-[19px] appearance-none rounded-full border-[1.5px] border-linea bg-papel checked:border-azul checked:bg-azul"
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-tinta">{nombreVisitante}</span>
          {jugadorasVisitante.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="jugadorasVisitante"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
                className="h-[19px] w-[19px] appearance-none rounded-full border-[1.5px] border-linea bg-papel checked:border-azul checked:bg-azul"
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
      </div>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar alineación"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `.../capturar/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlineacionForm } from "./alineacion-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { GolForm } from "./gol-form";
import { eliminarGol } from "./actions";
import { TarjetaForm } from "./tarjeta-form";
import { eliminarTarjeta } from "./actions";
import { MvpForm } from "./mvp-form";
import { IncidenciasForm } from "./incidencias-form";

export default async function CapturarPartidoPage({
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
      <div className="flex flex-col gap-4">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el partido. Intenta de nuevo.
        </p>
      </div>
    );
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

  const {
    data: jugadorasLocal,
    error: jugadorasLocalError,
  } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_local_id)
    .order("nombre");

  const {
    data: jugadorasVisitante,
    error: jugadorasVisitanteError,
  } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_visitante_id)
    .order("nombre");

  const { data: alineaciones, error: alineacionesError } = await supabase
    .from("alineaciones")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const hayErrorAlineacion = Boolean(
    jugadorasLocalError || jugadorasVisitanteError || alineacionesError
  );

  const { data: golesDetalle, error: golesError } = await supabase
    .from("goles")
    .select("id, jugadora_id, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const { data: tarjetasDetalle, error: tarjetasError } = await supabase
    .from("tarjetas")
    .select("id, jugadora_id, tipo, minuto")
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

  const mvpEnLista = jugadorasQueJugaron.some((j) => j.id === partido.mvp_jugadora_id);
  const opcionesMvp =
    partido.mvp_jugadora_id && !mvpEnLista
      ? [
          ...jugadorasQueJugaron,
          {
            id: partido.mvp_jugadora_id,
            nombre: nombrePorJugadora.get(partido.mvp_jugadora_id) ?? "Jugadora",
          },
        ]
      : jugadorasQueJugaron;

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const golesLocal = (golesDetalle ?? []).filter((gol) => idsLocal.has(gol.jugadora_id)).length;
  const golesVisitante = (golesDetalle ?? []).filter((gol) =>
    idsVisitante.has(gol.jugadora_id)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={
          jornada?.torneo_id
            ? `/admin/torneos/${jornada.torneo_id}/jornadas/${partido.jornada_id}/partidos`
            : "/admin/torneos"
        }
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Partidos
      </Link>
      <h1 className="font-tit text-xl uppercase tracking-tight">
        {equipoLocal?.nombre ?? "Local"}{" "}
        <span className="font-mono">{golesLocal} — {golesVisitante}</span>{" "}
        {equipoVisitante?.nombre ?? "Visitante"}
      </h1>
      <p className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-2">
        {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
      </p>
      {hayErrorAlineacion ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información de la alineación. Intenta de nuevo.
        </p>
      ) : (
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
      )}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Goles</h2>
        </div>
        <GolForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {golesError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudieron cargar los goles. Intenta de nuevo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(golesDetalle ?? []).map((gol) => (
              <li key={gol.id} className="flex items-center gap-3 text-sm">
                <span>
                  {nombrePorJugadora.get(gol.jugadora_id) ?? "Jugadora"}{" "}
                  <span className="font-mono text-tinta-2">min. {gol.minuto}</span>
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
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
            Tarjetas
          </h2>
        </div>
        <TarjetaForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {tarjetasError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudieron cargar las tarjetas. Intenta de nuevo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(tarjetasDetalle ?? []).map((tarjeta) => (
              <li key={tarjeta.id} className="flex items-center gap-3 text-sm">
                <span>
                  {nombrePorJugadora.get(tarjeta.jugadora_id) ?? "Jugadora"}{" "}
                  <span className="font-mono text-tinta-2">
                    {tarjeta.tipo} — min. {tarjeta.minuto}
                  </span>
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
      <MvpForm
        partidoId={partidoId}
        jugadorasQueJugaron={opcionesMvp}
        mvpActual={partido.mvp_jugadora_id}
      />
      <IncidenciasForm partidoId={partidoId} incidenciasActuales={partido.incidencias} />
    </div>
  );
}
```

Nota: el `notFound()` ahora sigue el patrón `if (!partido && !partidoError) notFound()` + retorno de error separado, en vez del `if (!partido) notFound()` original que no distinguía "no existe" de "la consulta falló".

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/partidos/[partidoId]/capturar/page.tsx" "src/app/admin/(protected)/partidos/[partidoId]/capturar/alineacion-form.tsx"
git commit -m "feat: apply Solosé identity to match-capture screen and lineup form

Also fixes the notFound()-vs-error guard to match the pattern already
established elsewhere in the project (bare 'if (!partido) notFound()'
previously conflated a genuine query error with a nonexistent match)."
```

---

### Task 10: Captura de partido — goles, tarjetas, MVP, incidencias

**Files:**
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/gol-form.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/tarjeta-form.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/mvp-form.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/partidos/[partidoId]/capturar/incidencias-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: nada nuevo. Estos 4 formularios se dejan siempre visibles (no usan `FormularioColapsable`) — `GolForm`/`TarjetaForm` porque se usan repetidamente durante la captura en vivo de un partido, `MvpForm`/`IncidenciasForm` porque editan un valor único existente, no crean filas.
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `gol-form.tsx`**

```tsx
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
        <span className="text-sm font-medium text-tinta">Jugadora</span>
        <select
          name="jugadoraId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-vino">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Minuto</span>
        <input
          name="minuto"
          className="w-20 rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.minuto && <span className="text-sm text-vino">{state.errors.minuto}</span>}
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar gol"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `tarjeta-form.tsx`**

```tsx
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
        <span className="text-sm font-medium text-tinta">Jugadora</span>
        <select
          name="jugadoraId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-vino">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Tipo</span>
        <select
          name="tipo"
          defaultValue="amarilla"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="amarilla">Amarilla</option>
          <option value="roja">Roja</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-vino">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Minuto</span>
        <input
          name="minuto"
          className="w-20 rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.minuto && <span className="text-sm text-vino">{state.errors.minuto}</span>}
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar tarjeta"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Reemplazar `mvp-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Jugadora del partido</span>
        <select
          name="mvpJugadoraId"
          defaultValue={mvpActual ?? ""}
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Sin asignar</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
      </label>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Reemplazar `incidencias-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Incidencias</span>
        <textarea
          name="incidencias"
          defaultValue={incidenciasActuales ?? ""}
          placeholder="Notas del partido (opcional)"
          className="min-h-24 rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(protected)/partidos/[partidoId]/capturar/gol-form.tsx" "src/app/admin/(protected)/partidos/[partidoId]/capturar/tarjeta-form.tsx" "src/app/admin/(protected)/partidos/[partidoId]/capturar/mvp-form.tsx" "src/app/admin/(protected)/partidos/[partidoId]/capturar/incidencias-form.tsx"
git commit -m "feat: apply Solosé identity to gol/tarjeta/mvp/incidencias forms

These stay always-visible (no alta discreta) — gol/tarjeta are used
repeatedly during live match capture, mvp/incidencias edit a single
existing value rather than creating new rows."
```

---

### Task 11: Suspensiones

**Files:**
- Modify: `src/app/admin/(protected)/suspensiones/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/suspensiones/suspension-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `FormularioColapsable`, `DeleteButton` (Task 1), `Avatar` (Fase 5a).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `suspension-form.tsx`**

```tsx
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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Jugadora</span>
        <select
          name="jugadoraId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jugadoras.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-vino">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Desde jornada</span>
        <select
          name="jornadaDesdeId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaDesdeId && (
          <span className="text-sm text-vino">{state.errors.jornadaDesdeId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Hasta jornada</span>
        <select
          name="jornadaHastaId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaHastaId && (
          <span className="text-sm text-vino">{state.errors.jornadaHastaId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Motivo (opcional)</span>
        <input
          name="motivo"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar suspensión"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { SuspensionForm } from "./suspension-form";
import { eliminarSuspension } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

export default async function SuspensionesPage() {
  const supabase = await createClient();

  const { data: jugadorasRaw, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, equipo_id")
    .order("nombre");

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url");

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );

  // Etiquetas planas para los <select> del formulario (un <option> no puede llevar imagen).
  const jugadoras = (jugadorasRaw ?? []).map((jugadora) => ({
    id: jugadora.id,
    etiqueta: `${jugadora.nombre} (${equipoInfoPorId.get(jugadora.equipo_id)?.nombre ?? "Equipo"})`,
  }));

  // Detalle completo (con avatar) para la tabla de suspensiones ya registradas.
  const jugadoraDetallePorId = new Map(
    (jugadorasRaw ?? []).map((jugadora) => [
      jugadora.id,
      {
        nombre: jugadora.nombre,
        fotoUrl: jugadora.foto_url,
        equipoNombre: equipoInfoPorId.get(jugadora.equipo_id)?.nombre ?? "Equipo",
      },
    ])
  );

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

  const jornadaPorId = new Map(jornadas.map((jornada) => [jornada.id, jornada.etiqueta]));

  const { data: suspensiones, error: suspensionesError } = await supabase
    .from("suspensiones")
    .select("id, jugadora_id, jornada_desde_id, jornada_hasta_id, motivo, created_at")
    .order("created_at", { ascending: false });

  const hayErrorDeApoyo = Boolean(jugadorasError || equiposError || jornadasError || torneosError);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Suspensiones
        </h1>
      </div>
      {hayErrorDeApoyo ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información necesaria para el formulario. Intenta de nuevo.
        </p>
      ) : (
        <FormularioColapsable etiqueta="Nueva suspensión…">
          <SuspensionForm jugadoras={jugadoras} jornadas={jornadas} />
        </FormularioColapsable>
      )}
      {suspensionesError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las suspensiones. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Jugadora
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Desde
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Hasta
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Motivo
                </th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(suspensiones ?? []).map((suspension) => {
                const detalle = jugadoraDetallePorId.get(suspension.jugadora_id);
                return (
                  <tr key={suspension.id} className="border-b border-linea-2">
                    <td className="p-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar
                          src={detalle?.fotoUrl ?? null}
                          nombre={detalle?.nombre ?? "Jugadora"}
                          size={20}
                        />
                        {detalle ? `${detalle.nombre} (${detalle.equipoNombre})` : "Jugadora"}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      {jornadaPorId.get(suspension.jornada_desde_id) ?? "—"}
                    </td>
                    <td className="p-2 text-sm">
                      {jornadaPorId.get(suspension.jornada_hasta_id) ?? "—"}
                    </td>
                    <td className="p-2 text-sm">{suspension.motivo ?? "—"}</td>
                    <td className="p-2">
                      <DeleteButton
                        onDelete={eliminarSuspension.bind(null, suspension.id)}
                        confirmMessage="¿Eliminar esta suspensión? Esto no se puede deshacer."
                      />
                    </td>
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

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/suspensiones/page.tsx" "src/app/admin/(protected)/suspensiones/suspension-form.tsx"
git commit -m "feat: apply Solosé identity to Suspensiones admin, add avatars to table"
```

---

### Task 12: Avisos

**Files:**
- Modify: `src/app/admin/(protected)/avisos/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/avisos/aviso-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `FormularioColapsable`, `DeleteButton` (Task 1).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar `aviso-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { crearAviso, type CrearAvisoState } from "./actions";

const estadoInicial: CrearAvisoState = { errors: {} };

export function AvisoForm() {
  const [state, formAction, pending] = useActionState(crearAviso, estadoInicial);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Título</span>
        <input
          name="titulo"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.titulo && <span className="text-sm text-vino">{state.errors.titulo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Cuerpo</span>
        <textarea
          name="cuerpo"
          className="min-h-24 rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.cuerpo && <span className="text-sm text-vino">{state.errors.cuerpo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Imagen (link, opcional)</span>
        <input
          name="imagenUrl"
          placeholder="https://…"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Publicando…" : "Publicar aviso"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { AvisoForm } from "./aviso-form";
import { eliminarAviso } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";

export default async function AvisosPage() {
  const supabase = await createClient();

  const { data: avisos, error: avisosError } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, fecha_publicacion")
    .order("fecha_publicacion", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Avisos</h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo aviso…">
        <AvisoForm />
      </FormularioColapsable>
      {avisosError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar los avisos. Intenta de nuevo.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(avisos ?? []).map((aviso) => (
            <li key={aviso.id} className="flex flex-col gap-1 border-b border-linea-2 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{aviso.titulo}</span>
                <DeleteButton
                  onDelete={eliminarAviso.bind(null, aviso.id)}
                  confirmMessage={`¿Eliminar el aviso "${aviso.titulo}"? Esto no se puede deshacer.`}
                />
              </div>
              <p className="text-sm text-tinta-2">{aviso.cuerpo}</p>
              <span className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
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

- [ ] **Step 3: Verificar build y tests**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

Run: `npm test -- --run`
Expected: `Test Files 17 passed (17)`, `Tests 75 passed (75)`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/avisos/page.tsx" "src/app/admin/(protected)/avisos/aviso-form.tsx"
git commit -m "feat: apply Solosé identity to Avisos admin, collapse creation form"
```

---

### Task 13: Reglamento (admin)

**Files:**
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/reglamento/page.tsx` (reemplazo completo)
- Modify: `src/app/admin/(protected)/torneos/[torneoId]/reglamento/reglamento-form.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: nada nuevo (no usa `FormularioColapsable` — es un editor de un solo archivo existente, no una lista con alta).
- Produces: nada consumido por otras tareas. Última tarea de la Fase 5c y de todo el proyecto de rediseño.

- [ ] **Step 1: Reemplazar `reglamento-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { subirReglamento } from "./actions";

async function accion(torneoId: string, _prevState: { error?: string }, formData: FormData) {
  return subirReglamento(torneoId, formData);
}

export function ReglamentoForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(accion.bind(null, torneoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Archivo PDF</span>
        <input
          type="file"
          name="archivo"
          accept="application/pdf"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-azul file:px-3 file:py-1.5 file:text-sm file:text-white focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Subiendo…" : "Subir reglamento"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const { data: reglamento, error: reglamentoError } = await supabase
    .from("reglamentos")
    .select("pdf_url, actualizado_en")
    .eq("torneo_id", torneoId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/torneos"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Torneos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Reglamento — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>
      {reglamentoError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el reglamento actual. Intenta de nuevo.
        </p>
      ) : reglamento?.pdf_url ? (
        <p className="text-sm">
          Reglamento actual:{" "}
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-azul underline"
          >
            ver PDF
          </a>
        </p>
      ) : (
        <p className="text-sm text-tinta-2">Todavía no se ha subido un reglamento.</p>
      )}
      <ReglamentoForm torneoId={torneoId} />
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
git add "src/app/admin/(protected)/torneos/[torneoId]/reglamento/page.tsx" "src/app/admin/(protected)/torneos/[torneoId]/reglamento/reglamento-form.tsx"
git commit -m "feat: apply Solosé identity to Reglamento admin

Last task of Fase 5c — the entire Copa Solose redesign (Fase 5a/5b/5c)
is now complete."
```

---

## Fin de Fase 5c — Fin del proyecto de rediseño

Al terminar la Tarea 13, toda la app (público + admin) tiene la identidad visual completa de Solosé. Esto cierra la Fase 5 y, con ella, el proyecto completo descrito en la conversación original: el MVP funcional (Fundación–Fase 4c) más su rediseño visual (Fase 5a–5c). Sigue el proceso de `finishing-a-development-branch` (merge a master, verificar build/tests, limpiar worktree, push, verificar producción — este merge cambia visiblemente TODA la sección admin, hacer una revisión visual real de al menos: login, lista de torneos con el formulario colapsable, y la pantalla de captura de partido, antes de dar por cerrado el proyecto).
