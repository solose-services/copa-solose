# Fase 5 — Identidad visual de Solosé — Design Spec

## Contexto

El MVP funcional de Copa Solose está completo y en producción (Fundación → Fase 4c). Toda la app usa el CSS por defecto de `create-next-app`: sin colores propios, sin tipografía propia, y con el modo oscuro automático de Tailwind todavía activo. Esta fase aplica la identidad visual real de Solosé a las ~20 rutas ya construidas (10 públicas + ~12 admin), sin cambiar ninguna funcionalidad.

Dos fuentes de verdad, ya aprobadas, alimentan este diseño:

1. **`IDENTIDAD-VISUAL-SOLOSE.md`** (raíz del repo) — sistema de diseño completo (colores, tipografía, forma, componentes) extraído de la app "Workflow Casita Solosé", ya en producción. Es la fuente de verdad para todo valor visual (color, fuente, radio, espaciado).
2. **Mockup de Claude Design aprobado por Fer** (`Diseño Copa Solose App.html`, fuera del repo) — 10 pantallas mockeadas que definen estructura e interacción, pero con una paleta y tipografía genéricas (`#f3f2f2` / `Cormorant Garamond` + `Lora`) que **no** son las de Solosé. Se usa solo como referencia de layout, nunca de color/tipografía.

Ambas fuentes se validaron juntas con el usuario mediante mockups reales en el navegador (identidad de marca vs. tipografía del mockup, con avatares incluidos) — el usuario eligió la identidad de marca (Oswald + Work Sans + IBM Plex Mono) y aprobó el patrón de avatar con inicial de respaldo.

## Objetivo

Repintar las ~20 rutas existentes con los tokens reales de Solosé, y mostrar por primera vez el logo de equipo / foto de jugadora (campos `logo_url` / `foto_url` que ya existen en el esquema pero nunca se renderizan) junto a cada nombre enlazado.

## No-objetivos (fuera de alcance)

- No se agrega ningún feature nuevo de negocio. El único cambio funcional es puramente visual: mostrar `logo_url`/`foto_url` donde ya existen.
- No se cambia el flujo de captura de `logo_url`/`foto_url` — sigue siendo un campo de texto donde el admin pega un link ya hosteado (como ya funciona hoy en Editar equipo). Subir el archivo directo a Supabase Storage (como se hizo con el reglamento) es una mejora futura, no parte de esta fase.
- No se usa el logo real de Solosé todavía (pendiente de que el usuario comparta el archivo SVG/PNG) — se implementa como componente `Logo` aislado con un wordmark de texto temporal en Oswald, para sustituirlo por una imagen sin tocar ningún otro archivo cuando el archivo llegue.
- No se introducen colores de "categoría" (`--cat-*` de la sección 3 del doc de identidad) — ese sistema existe para distinguir tipos de tarjeta en Workflow; Copa Solose no tiene un concepto equivalente. Un solo acento (`--azul`) cubre toda la app; `--vino` queda reservado para error/destructivo, tal como ya se usa hoy en los mensajes de error.
- No hay pruebas visuales automatizadas (screenshot testing). La verificación es manual: build, tests existentes (que no deben tronar por clases CSS) y revisión visual en navegador antes de cada merge.
- No se toca la lógica de negocio, las Server Actions, ni el esquema de base de datos. Ningún archivo `actions.ts` cambia.

## Tokens de diseño

Se agregan a `src/app/globals.css`, reemplazando el bloque `@theme inline` actual (que solo mapea `background`/`foreground` de Geist) y eliminando el `@media (prefers-color-scheme: dark)` — la identidad de Solosé es de un solo modo, nunca oscuro.

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

Esto habilita utilidades Tailwind directas: `bg-crema`, `text-tinta`, `text-tinta-2`, `border-linea`, `font-tit`, `font-mono`, `rounded-sm` (7px), etc. — sin tocar ningún archivo de página todavía.

**Radios (sección 7 del doc de identidad):** 2px etiquetas cuadradas, 3px tags de texto, 6–7px botones/inputs (`rounded-sm` = 7px), 8px campos grandes (`rounded-md`), 10–12px hojas/logo (`rounded-lg`), 50% casillas/avatares. Nada por encima de 14px.

**Bordes y sombras:** 1px `--linea` en controles; 2px sólido del acento debajo de encabezados de sección; 1px `--linea-2` entre filas; prácticamente sin sombras (excepción: avisos flotantes, que esta app no usa).

## Tipografía

`src/app/layout.tsx` reemplaza `Geist`/`Geist_Mono` por:

```ts
import { Oswald, Work_Sans, IBM_Plex_Mono } from "next/font/google";

const oswald = Oswald({ variable: "--font-oswald", weight: ["500", "600"], subsets: ["latin"] });
const workSans = Work_Sans({ variable: "--font-work-sans", weight: ["400", "500", "600"], style: ["normal", "italic"], subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ variable: "--font-ibm-plex-mono", weight: ["400", "500"], subsets: ["latin"] });
```

`next/font/google` descarga y sirve las fuentes localmente (sin llamada a Google Fonts en producción), consistente con cómo ya se cargaba Geist.

**Regla de uso (la que más define el look, sección 6 del doc):** todo lo que es *dato* (fechas, marcadores, conteos, etiquetas de categoría) va en `font-mono`, tamaño chico (`.62–.72rem`), casi siempre mayúsculas con `letter-spacing`. Todo lo que es *rótulo* (encabezados de sección, títulos de pantalla) va en `font-tit`, mayúsculas, `letter-spacing` de `.02em` a `.13em`. El cuerpo normal usa `font-cuerpo` (Work Sans).

## Iconografía

Se agrega `lucide-react` como dependencia (paquete gratuito, tree-shakeable — cada ícono importado añade unos pocos KB). Todo ícono usa `strokeWidth={1.7}` y `size` acorde al contexto, nunca relleno sólido. Iconos necesarios para esta fase: flecha atrás (reemplaza los `← Volver` de texto donde tenga sentido visualmente sin quitar el texto), editar, eliminar (ya cubierto por `DeleteButton`, se le agrega el ícono), cerrar sesión, adjuntar/subir (reglamento).

## Componentes compartidos

### `Logo` — `src/components/ui/logo.tsx` (nuevo)

Wordmark de texto: `<span className="font-tit font-semibold tracking-wide text-azul">SOLOSÉ</span>`. Aislado en su propio componente para que, cuando el usuario comparta el archivo real del logo, sustituirlo por `<Image src="/logo.svg" ... />` sea un cambio de un solo archivo.

### `Avatar` — `src/components/ui/avatar.tsx` (nuevo)

```ts
interface AvatarProps {
  src: string | null;
  nombre: string;
  size?: number; // default 24
}
```

Si `src` existe, renderiza `<img>` con `onError` que oculta la imagen y muestra el fallback (no hay control de imagen rota visible). Si `src` es `null` o falla, renderiza un círculo con la primera letra de `nombre` en mayúscula, fondo `color-mix(in srgb, var(--azul) 14%, var(--papel))`, texto `--azul`, `font-mono`. `border-radius: 50%` siempre. Se usa `<img>` nativo (no `next/image`) porque las URLs son arbitrarias (pegadas por el admin desde cualquier host) y `next/image` exige lista blanca de dominios en `next.config.ts` — no aplicable a contenido admin-controlado de origen variable.

### `NombreEquipo` / `NombreJugadora` (modificados)

Ganan un prop opcional (`logoUrl` / `fotoUrl`). Cuando se provee, renderizan `<Avatar>` + el link, en un `<span className="inline-flex items-center gap-1.5">`. Cuando no se provee (por compatibilidad, ningún call site se rompe), se comportan exactamente como hoy — solo el nombre. Cada call site de Fase 5b/5c decide si pasa el prop, según si la consulta Supabase de esa página ya trae la columna.

### Componentes de formulario y layout (aplicados vía clases Tailwind directas, sin nuevo componente)

- **Botón:** `rounded-sm border border-linea bg-papel px-3 py-1.5 text-sm font-medium hover:border-azul hover:text-azul`; variante primaria `bg-azul border-azul text-white hover:brightness-110`.
- **Input/select/textarea:** `bg-papel border border-azul rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20` (ver excepción de login abajo).
- **Campo de login:** sin caja — solo línea inferior (`border-0 border-b border-linea rounded-none`), tal como especifica la sección 8 del doc para la "pantalla de acceso", aplicado a `/admin/login`.
- **Encabezado de sección:** `<div className="flex items-baseline gap-2 border-b-2 border-azul pb-2"><h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">…</h2></div>`.
- **Mensaje/aviso:** `border-l-2 border-azul bg-azul/[.07] rounded-sm px-3 py-2.5 text-sm` (variante error: `border-vino bg-vino/[.09]`, variante ok: `border-[#0F6E68] bg-[#0F6E68]/[.09]`) — reemplaza los `text-red-600` sueltos usados hoy para errores.

## Flujo de datos: avatares

El esquema ya tiene `equipos.logo_url` y `jugadoras.foto_url` (migración `0001_init_schema.sql`), y el admin ya puede escribirlos (`Editar equipo` para logo; el equivalente de jugadora ya expone un campo similar). No hay migración nueva. El cambio es exclusivamente de lectura/render:

- Cada `select(...)` sobre `equipos` que hoy pide `"id, nombre"` pasa a `"id, nombre, logo_url"`.
- Cada `select(...)` sobre `jugadoras` que hoy pide `"id, nombre"` (o `"id, nombre, equipo_id"`, etc.) agrega `foto_url`.
- Cada `Map` construido a partir de esos resultados (patrón ya establecido en todo el proyecto) pasa a guardar `{ nombre, logoUrl }` / `{ nombre, fotoUrl }` en vez de solo el string.
- Cada uso de `<NombreEquipo>`/`<NombreJugadora>` en JSX pasa el prop nuevo.

Páginas afectadas (Fase 5b): Principal (si lista equipos), Calendario, Detalle de partido, Posiciones, Ficha de equipo (foto de cada jugadora del roster), Ficha de jugadora (su propia foto, y el logo del equipo), Goleadoras, Suspendidas. Páginas afectadas (Fase 5c): cualquier listado admin que muestre nombre de equipo/jugadora (selects de jornadas/partidos, captura de partido).

## Manejo de errores

- Imagen rota → `onError` oculta el `<img>` y revela el fallback de inicial (nunca un ícono de imagen rota visible). Esto es puramente de cliente (`useState` local en `Avatar`), no requiere cambios de servidor.
- Ningún cambio a los patrones ya establecidos de manejo de errores de Supabase (`if (error) {...}`, `notFound()` guardado) — esta fase no toca lógica de datos, solo la forma en que se pintan los datos que ya se traían (o se agrega una columna más a un select existente).

## Layout y responsividad (sección 9 del doc de identidad)

- Mobile-first. `max-width: 1160px` centrado, padding lateral `1rem`.
- Encabezado de torneo (`src/app/torneos/[torneoId]/layout.tsx`) se vuelve `sticky` con `backdrop-filter: saturate(1.4) blur(8px)` sobre `rgba(244,237,224,.94)`.
- Safe areas: `viewport-fit=cover` en el meta viewport (`layout.tsx` raíz vía `export const viewport`), `padding-top: calc(.55rem + env(safe-area-inset-top))` en la barra superior sticky.
- Two-column solo donde ya existe suficiente contenido para justificarlo (ninguna pantalla actual lo requiere de forma obvia; se evalúa página por página en Fase 5b/5c sin forzarlo).

## Fases de implementación

- **Fase 5a — Fundación:** tokens en `globals.css`, fuentes en `layout.tsx`, `lucide-react` instalado, componentes `Logo` y `Avatar` nuevos, sin modificar ninguna página existente. Verificable de forma aislada (build pasa, tokens disponibles, componentes con tests unitarios de renderizado si aplica).
- **Fase 5b — Sitio público:** aplicar 5a a las 10 rutas públicas + wiring de avatares en todos los `NombreEquipo`/`NombreJugadora` del lado público.
- **Fase 5c — Admin:** aplicar 5a al resto de rutas admin (mismo nivel de cuidado que 5b) + wiring de avatares donde el admin también muestra nombres (ej. selects de captura de partido).

Cada sub-fase sigue el mismo proceso ya usado en Fase 4: plan escrito → subagentes implementadores → review por tarea → review final de rama → merge → push → verificación en producción.

## Testing

- Los 140 tests existentes (Vitest) no deben tronar — ninguno depende de clases CSS ni de la tipografía. Se ejecutan sin cambios como gate de cada tarea.
- No se agregan tests nuevos de snapshot visual (fuera de alcance, ver No-objetivos). El componente `Avatar` sí puede llevar un test unitario simple de "renderiza fallback cuando `src` es null" ya que es lógica, no solo estilo.
- Verificación real es visual: cada sub-fase se revisa en navegador (desktop + móvil) antes de mergear, igual que se hizo con los mockups de esta misma conversación.

## Pendiente externo

El usuario compartirá el archivo real del logo de Solosé (SVG o PNG con fondo transparente del wordmark "SOLOSÉ©" en azul). Esto no bloquea ninguna fase: se implementa `Logo` con el texto de respaldo ahora, y se sustituye por la imagen en un solo archivo cuando llegue.
