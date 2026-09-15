# Fase 5a — Fundación del diseño visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establecer los tokens de diseño, la tipografía real, la dependencia de iconos y dos componentes de UI compartidos (`Logo`, `Avatar`) de la identidad visual de Solosé, sin modificar ninguna página existente.

**Architecture:** Todo valor visual vive como variables CSS en `src/app/globals.css`, mapeadas a utilidades Tailwind vía `@theme inline` (patrón ya usado en el proyecto para `--color-background`/`--color-foreground`). Las fuentes se cargan con `next/font/google` en `src/app/layout.tsx`, igual que Geist hoy. `Logo` y `Avatar` son componentes nuevos bajo `src/components/ui/`, sin dependencias de ninguna página — quedan listos para que Fase 5b/5c los importen.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 (`@theme inline`), `next/font/google`, `lucide-react` (nueva dependencia), Vitest.

## Global Constraints

- Paleta exacta (de `IDENTIDAD-VISUAL-SOLOSE.md` sección 2): `--crema:#F4EDE0`, `--papel:#FFFCF6`, `--azul:#1B3FD1`, `--vino:#5A2A22`, `--tinta:#241D14`, `--tinta-2:#6B5F50`, `--tinta-3:#9A8F80`, `--linea:rgba(36,29,20,.14)`, `--linea-2:rgba(36,29,20,.07)`. No inventar tonos fuera de esta paleta.
- Radios (sección 7): 3px tags de texto, 7px botones/inputs, 8px campos grandes, 12px hojas/logo, 50% casillas/avatares.
- Tipografías (sección 6): Oswald 500/600 para títulos, Work Sans 400/500/600 (+ italic 400) para cuerpo, IBM Plex Mono 400/500 para datos.
- La identidad es de un solo modo (crema) — nunca oscuro. El `@media (prefers-color-scheme: dark)` de create-next-app se elimina.
- Esta sub-fase NO modifica ninguna página existente bajo `src/app/**/page.tsx` ni ningún `actions.ts`. Solo toca `globals.css`, `layout.tsx`, `package.json`/`package-lock.json` (vía `npm install`), y crea archivos nuevos bajo `src/components/ui/`.
- Los 140 tests existentes (`npm test -- --run`) deben seguir pasando sin cambios después de cada tarea.
- `Avatar` usa `<img>` nativo, nunca `next/image` (las URLs son arbitrarias, pegadas por el admin desde cualquier host — `next/image` exigiría lista blanca de dominios en `next.config.ts`, no aplicable aquí).
- Spec completo: `docs/superpowers/specs/2026-09-14-fase5-identidad-visual-design.md`.

---

### Task 1: Tokens de diseño, tipografía real y dependencia de iconos

**Files:**
- Modify: `src/app/globals.css` (reemplazo completo del archivo)
- Modify: `src/app/layout.tsx` (reemplazo completo del archivo)
- Modify: `package.json` / `package-lock.json` (vía `npm install lucide-react`)

**Interfaces:**
- Consumes: nada de tareas anteriores (primera tarea de la fase).
- Produces: variables CSS `--crema`, `--papel`, `--azul`, `--vino`, `--tinta`, `--tinta-2`, `--tinta-3`, `--linea`, `--linea-2` disponibles en `:root`; utilidades Tailwind `bg-crema`, `text-tinta`, `text-tinta-2`, `text-tinta-3`, `border-linea`, `border-linea-2`, `font-tit`, `font-cuerpo`, `font-mono`, `rounded-xs` (3px), `rounded-sm` (7px), `rounded-md` (8px), `rounded-lg` (12px); paquete `lucide-react` instalado e importable. Tareas 2 y 3 de esta fase consumen estas utilidades.

- [ ] **Step 1: Instalar lucide-react**

Run: `npm install lucide-react`
Expected: el comando termina sin error y `package.json` gana `"lucide-react"` bajo `dependencies`.

- [ ] **Step 2: Verificar que el paquete es importable**

Run: `node -e "require.resolve('lucide-react')"`
Expected: termina sin error (código de salida 0, sin output).

- [ ] **Step 3: Reemplazar `src/app/globals.css` completo**

```css
@import "tailwindcss";

:root {
  --crema: #F4EDE0;
  --papel: #FFFCF6;
  --azul: #1B3FD1;
  --vino: #5A2A22;
  --tinta: #241D14;
  --tinta-2: #6B5F50;
  --tinta-3: #9A8F80;
  --linea: rgba(36, 29, 20, .14);
  --linea-2: rgba(36, 29, 20, .07);
}

@theme inline {
  --color-crema: var(--crema);
  --color-papel: var(--papel);
  --color-azul: var(--azul);
  --color-vino: var(--vino);
  --color-tinta: var(--tinta);
  --color-tinta-2: var(--tinta-2);
  --color-tinta-3: var(--tinta-3);
  --color-linea: var(--linea);
  --color-linea-2: var(--linea-2);
  --font-tit: var(--font-oswald);
  --font-cuerpo: var(--font-work-sans);
  --font-mono: var(--font-ibm-plex-mono);
  --radius-xs: 3px;
  --radius-sm: 7px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

body {
  background: var(--crema);
  color: var(--tinta);
  font-family: var(--font-cuerpo), ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-tit), ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  letter-spacing: .02em;
  margin: 0;
}
```

Nota: este archivo reemplaza por completo el `globals.css` actual (que solo tenía los defaults de create-next-app con Geist y el bloque `@media (prefers-color-scheme: dark)`). No queda ningún rastro de esos dos bloques.

- [ ] **Step 4: Reemplazar `src/app/layout.tsx` completo**

```tsx
import type { Metadata } from "next";
import { Oswald, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  weight: ["500", "600"],
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Copa Solose",
  description: "Copa Solose",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${oswald.variable} ${workSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

Nota: se elimina por completo el uso de `Geist`/`Geist_Mono`. Ningún otro archivo del proyecto referencia esos imports ni las clases `font-sans`/`font-mono` con el valor anterior (verificado: `grep -r "font-sans\|Geist" src/` solo encuentra coincidencias en `globals.css` y `layout.tsx`, ambos reemplazados en este mismo paso).

- [ ] **Step 5: Verificar que el build sigue pasando**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sin errores de TypeScript ni de build. Es normal ver una lista de rutas al final, igual que en builds anteriores.

- [ ] **Step 6: Verificar que los tests existentes siguen pasando**

Run: `npm test -- --run`
Expected: `Test Files  32 passed (32)` y `Tests  140 passed (140)` (los mismos números que antes de este cambio — ninguna prueba depende de CSS ni de tipografía).

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx package.json package-lock.json
git commit -m "feat: apply Solosé design tokens, real typography, and lucide-react

Replaces create-next-app defaults (Geist fonts, auto dark mode) with
the approved brand identity: crema/azul/vino/tinta palette and
Oswald/Work Sans/IBM Plex Mono typography."
```

---

### Task 2: Componente `Logo`

**Files:**
- Create: `src/components/ui/logo.tsx`

**Interfaces:**
- Consumes: utilidades Tailwind `font-tit`, `text-azul` (de Task 1).
- Produces: `Logo` — componente sin props, exportado como `export function Logo()`. Se usará en Fase 5b/5c dentro del encabezado de navegación (`src/app/torneos/[torneoId]/layout.tsx` y el header de admin), pero esta tarea no toca esas páginas.

- [ ] **Step 1: Crear el componente**

```tsx
export function Logo() {
  return (
    <span className="font-tit text-lg font-semibold uppercase tracking-wide text-azul">
      Solosé
    </span>
  );
}
```

Nota: este es el wordmark de texto temporal descrito en el spec (sección "Pendiente externo") — se sustituirá por una imagen (`<Image src="/logo.svg" ... />`) cuando el usuario comparta el archivo real del logo, sin que ningún otro archivo del proyecto necesite cambiar (todo el que use `<Logo />` sigue funcionando igual).

- [ ] **Step 2: Verificar que el build sigue pasando**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sin errores. `Logo` no se importa desde ninguna página todavía, así que TypeScript solo debe validar que el archivo compila de forma aislada (no hay "unused export" que rompa el build en este proyecto — verificado: `eslint` no corre como parte de `npm run build`).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/logo.tsx
git commit -m "feat: add Logo component with temporary text wordmark"
```

---

### Task 3: Componente `Avatar`

**Files:**
- Create: `src/components/ui/avatar-helpers.ts`
- Create: `src/components/ui/avatar-helpers.test.ts`
- Create: `src/components/ui/avatar.tsx`

**Interfaces:**
- Consumes: utilidades Tailwind `font-mono` (de Task 1).
- Produces:
  - `inicialDe(nombre: string): string` — exportado desde `src/components/ui/avatar-helpers.ts`. Devuelve la primera letra del nombre en mayúscula, o `"?"` si el nombre está vacío o solo tiene espacios.
  - `Avatar` — componente exportado desde `src/components/ui/avatar.tsx`, props `{ src: string | null; nombre: string; size?: number }` (`size` en píxeles, default `24`). Fase 5b/5c lo usarán dentro de `NombreEquipo`/`NombreJugadora`, pero esta tarea no toca esos archivos.

- [ ] **Step 1: Escribir el test que debe fallar**

Crear `src/components/ui/avatar-helpers.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { inicialDe } from "./avatar-helpers";

describe("inicialDe", () => {
  test("devuelve la primera letra en mayúscula", () => {
    expect(inicialDe("Halcones")).toBe("H");
  });

  test("convierte a mayúscula una primera letra minúscula", () => {
    expect(inicialDe("águilas")).toBe("Á");
  });

  test("ignora espacios en blanco al inicio", () => {
    expect(inicialDe("  Rayadas")).toBe("R");
  });

  test("devuelve '?' cuando el nombre está vacío", () => {
    expect(inicialDe("")).toBe("?");
  });

  test("devuelve '?' cuando el nombre es solo espacios", () => {
    expect(inicialDe("   ")).toBe("?");
  });
});
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npx vitest run src/components/ui/avatar-helpers.test.ts`
Expected: FAIL — `Cannot find module './avatar-helpers'` (el archivo todavía no existe).

- [ ] **Step 3: Implementar `avatar-helpers.ts`**

Crear `src/components/ui/avatar-helpers.ts`:

```ts
export function inicialDe(nombre: string): string {
  const primerCaracter = nombre.trim().charAt(0);
  return primerCaracter ? primerCaracter.toLocaleUpperCase("es") : "?";
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `npx vitest run src/components/ui/avatar-helpers.test.ts`
Expected: PASS — `Test Files  1 passed (1)`, `Tests  5 passed (5)`.

- [ ] **Step 5: Implementar el componente `Avatar`**

Crear `src/components/ui/avatar.tsx`:

```tsx
"use client";

import { useState } from "react";
import { inicialDe } from "./avatar-helpers";

interface AvatarProps {
  src: string | null;
  nombre: string;
  size?: number;
}

export function Avatar({ src, nombre, size = 24 }: AvatarProps) {
  const [fallo, setFallo] = useState(false);

  if (!src || fallo) {
    return (
      <span
        className="inline-flex flex-none items-center justify-center rounded-full font-mono font-medium"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.45,
          background: "color-mix(in srgb, var(--azul) 14%, var(--papel))",
          color: "var(--azul)",
        }}
      >
        {inicialDe(nombre)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias pegadas por el admin, next/image exigiría lista blanca de dominios
    <img
      src={src}
      alt=""
      onError={() => setFallo(true)}
      className="flex-none rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
```

Nota: `alt=""` es intencional — el nombre ya se muestra como texto enlazado junto al avatar en todo lugar donde se use (`NombreEquipo`/`NombreJugadora`), así que la imagen es decorativa y un `alt` vacío evita que lectores de pantalla lean el nombre dos veces.

- [ ] **Step 6: Verificar que el build sigue pasando**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sin errores.

- [ ] **Step 7: Verificar la suite completa de tests**

Run: `npm test -- --run`
Expected: `Test Files  33 passed (33)`, `Tests  145 passed (145)` (140 anteriores + 5 nuevos de `avatar-helpers.test.ts`).

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/avatar-helpers.ts src/components/ui/avatar-helpers.test.ts src/components/ui/avatar.tsx
git commit -m "feat: add Avatar component with initial fallback

inicialDe() is unit-tested directly; the onError-driven fallback
switch is exercised visually in Fase 5b/5c once Avatar is wired into
real pages."
```

---

## Fin de Fase 5a

Al terminar la Tarea 3, la fundación visual está lista: tokens, tipografía, `lucide-react`, `Logo` y `Avatar`. Ninguna página existente cambió — la app en producción se ve exactamente igual hasta que Fase 5b (sitio público) y Fase 5c (admin) consuman estos componentes y clases. Sigue el proceso de `finishing-a-development-branch` (merge a master, verificar build/tests en master, limpiar worktree, push, verificar producción) antes de empezar Fase 5b.
