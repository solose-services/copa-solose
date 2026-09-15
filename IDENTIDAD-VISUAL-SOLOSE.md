# Identidad visual Casita Solosé — referencia para construir

> **Para Claude Code:** este archivo define la identidad visual de Casita Solosé.
> Úsalo como fuente única de verdad para colores, tipografía, forma y componentes.
> No inventes colores ni fuentes fuera de esta paleta. Si necesitas un tono que no
> está aquí, derívalo de uno existente con `color-mix()` en lugar de agregar un hex nuevo.
> Guárdalo en la raíz del repo o pégalo en `CLAUDE.md`.

Extraído del tablero **Workflow Casita Solosé** (Supabase + Vercel), ya en producción.
Los valores son los que corren hoy, no una propuesta.

---

## 1. El principio

Editorial y plano, no "app de dashboard". La sensación viene de tres decisiones:

1. **Fondo crema cálido, nunca blanco puro.** El blanco se reserva para superficies
   elevadas (campos, tarjetas) y aun así es un crema muy claro, no `#FFF`.
2. **Reglas finas en vez de tarjetas con sombra.** La jerarquía la dan las líneas de
   1px y el color del encabezado, no cajas flotantes.
3. **Un acento por categoría.** Cada sección/entidad tiene su color y ese color tiñe
   su encabezado, su regla, sus casillas y su barra lateral. Eso es lo que evita que
   todo se lea como una lista gris infinita.

**Se siente mal cuando:** aparecen sombras grandes, esquinas muy redondeadas, gradientes,
morados de plantilla, emojis como iconos, o todas las tarjetas con el mismo padding.

---

## 2. Paleta base

| Token | Hex | Rol |
|---|---|---|
| `--crema` | `#F4EDE0` | Fondo de la app. Nunca texto. |
| `--papel` | `#FFFCF6` | Superficie elevada: inputs, hojas modales, tarjetas. |
| `--azul` | `#1B3FD1` | Acento principal de marca. Acciones primarias, logo. |
| `--vino` | `#5A2A22` | Secundario. Destructivo, alertas, categorías cálidas. |
| `--tinta` | `#241D14` | Texto principal. Café muy oscuro, **no negro**. |
| `--tinta-2` | `#6B5F50` | Texto secundario, descripciones, iconos en reposo. |
| `--tinta-3` | `#9A8F80` | Metadatos, placeholders, conteos. Solo texto pequeño de apoyo. |
| `--linea` | `rgba(36,29,20,.14)` | Bordes de controles. |
| `--linea-2` | `rgba(36,29,20,.07)` | Separadores entre filas. |

**Regla:** los grises salen de la tinta con alfa, nunca de `#808080`. Todo el gris del
sistema es café desaturado — por eso conviven con el crema.

---

## 3. Acentos por categoría

Cada sección expone su color como `--ac` y los componentes hijos lo consumen. Así un
mismo botón o casilla se pinta solo según dónde viva.

| Categoría | Hex | Carácter |
|---|---|---|
| Registro / acuerdos | `#1B3FD1` | Azul de marca — autoridad |
| Pendiente / por hacer | `#B26A12` | Ocre — atención |
| En curso | `#0F6E68` | Teal — movimiento |
| Terminado / archivo | `#6B5F50` | Neutro tinta — se hace a un lado a propósito |
| Nota / referencia | `#5A2A22` | Vino |
| Futuro / ideas | `#7A3F5D` | Ciruela |

```css
.s-acuerdo { --ac:#1B3FD1 }   .s-todo       { --ac:#B26A12 }
.s-curso   { --ac:#0F6E68 }   .s-hecho      { --ac:#6B5F50 }
.s-nota    { --ac:#5A2A22 }   .s-largo      { --ac:#7A3F5D }
```

**Para otra app:** conserva azul, vino y tinta como columna vertebral, y reasigna los
otros cuatro a tus categorías. Lo que importa es que sean seis tonos desaturados que
convivan con el crema, no seis colores saturados de semáforo.

---

## 4. Paleta de personas

Para distinguir a quién pertenece algo. Se asigna **por posición en la lista de usuarios**,
no por nombre, para que los colores no se recorran cuando entra alguien nuevo.

```js
const PALETA_PERSONA = ['#1B3FD1','#A63D2A','#8A6A12','#6B3A6E','#0F6E68'];
const COLOR_AMBOS = '#1F7A4C';   // asignado a varios
const COLOR_NADIE = '#8B8073';   // sin asignar — apagado a propósito
```

El color de la persona pinta: el cuadrito y el nombre del encabezado del grupo, la barra
lateral de 3px de sus filas, y su casilla. No pinta el texto del contenido.

---

## 5. Contraste (verificado, WCAG 2.1)

Calculado contra `--crema #F4EDE0`. Todo lo marcado AA pasa 4.5:1 para texto normal.

| Color | Ratio | Uso permitido |
|---|---|---|
| `--tinta` | 14.31 | Cualquier tamaño |
| `--vino` | 10.08 | Cualquier tamaño |
| Ciruela `#7A3F5D` | 6.69 | Cualquier tamaño |
| `--azul` | 6.73 | Cualquier tamaño |
| Terracota `#A63D2A` | 5.43 | Cualquier tamaño |
| `--tinta-2` | 5.34 | Cualquier tamaño |
| Teal `#0F6E68` | 5.23 | Cualquier tamaño |
| Verde `#1F7A4C` | 4.57 | Cualquier tamaño |
| Ocre `#8A6A12` | 4.35 | **Solo ≥18px o negritas** |
| Ocre `#B26A12` | 3.63 | **Solo ≥18px o negritas** |
| Gris `#8B8073` | 3.32 | **Solo texto grande o bordes** |
| `--tinta-3` | 2.73 | **Nunca para texto que importe** — solo metadatos de apoyo |

Texto blanco sobre cualquiera de los acentos pasa AA, salvo `#8B8073` (3.87) y
`#B26A12` (4.23), que solo sirven para botones con texto ≥18px.

---

## 6. Tipografía

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Work+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
```

| Uso | Familia | Reglas |
|---|---|---|
| Títulos | **Oswald** 500/600 | Siempre `text-transform:uppercase` y `letter-spacing` de `.02em` a `.13em`. Condensada: aguanta títulos largos sin romper. |
| Cuerpo | **Work Sans** 400/500/600 | `line-height:1.45`. Base 16px; contenido a `.93rem`. |
| Datos | **IBM Plex Mono** 400/500 | Fechas, conteos, correos, códigos, etiquetas de categoría. Tamaños `.62–.72rem`, `letter-spacing` de `.02em` a `.14em`, casi siempre mayúsculas. |

**La regla que más define el look:** todo lo que es *dato* va en mono y en minúsculas de
tamaño chico; todo lo que es *rótulo* va en Oswald mayúsculas espaciadas. Esa separación
entre dato y rótulo es la mitad de la identidad.

Stacks de respaldo:

```css
--tit:'Oswald',ui-sans-serif,system-ui,sans-serif;
--cuerpo:'Work Sans',ui-sans-serif,system-ui,-apple-system,sans-serif;
--mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
```

---

## 7. Forma y espacio

- **Radios:** 2px etiquetas cuadradas · 3px tags de texto · 6–7px botones e inputs ·
  8px campos grandes · 10–12px logo y hojas modales · 50% casillas e iconos redondos.
  Nada por encima de 14px.
- **Bordes:** 1px `--linea`. Los encabezados de sección llevan **2px sólidos del acento** abajo.
  Las filas se separan con 1px `--linea-2`.
- **Sombras:** prácticamente ninguna. Solo el aviso flotante lleva
  `0 6px 24px rgba(36,29,20,.16)`. Si estás poniendo una sombra, probablemente va una línea.
- **Hover de fila:** un degradado del acento que se desvanece a la derecha, no un bloque de color:
  `linear-gradient(90deg, color-mix(in srgb, var(--ac) 8%, transparent), transparent 72%)`
- **Espacio entre secciones:** `2.2rem` en móvil, `2.4rem` en escritorio. Generoso a propósito.

---

## 8. Componentes

```css
/* Botón secundario / primario */
.b      { border-radius:7px; padding:.36rem .8rem; font-size:.8rem; font-weight:500;
          border:1px solid var(--linea); background:var(--papel); }
.b:hover{ border-color:var(--ac); color:var(--ac) }
.b.pri  { background:var(--ac); border-color:var(--ac); color:#fff }
.b.pri:hover{ filter:brightness(1.1) }

/* Campo de texto */
textarea, input[type=text] {
  background:var(--papel); border:1px solid var(--ac); border-radius:8px;
  padding:.5rem .6rem; font-size:.9rem;
}
:focus { outline:none; box-shadow:0 0 0 3px color-mix(in srgb, var(--ac) 16%, transparent) }

/* Campo de la pantalla de acceso: sin caja, solo línea inferior */
.tarjeta input { border:0; border-bottom:1.5px solid var(--linea); border-radius:0 }

/* Encabezado de sección */
.sec-cab   { display:flex; align-items:baseline; gap:.55rem;
             padding-bottom:.5rem; border-bottom:2px solid var(--ac) }
.sec-cab h2{ font-family:var(--tit); font-size:.82rem; text-transform:uppercase;
             letter-spacing:.13em; color:var(--ac) }

/* Etiqueta de dato */
.et      { font-family:var(--mono); font-size:.64rem; color:var(--tinta-3) }
.et.fuerte{ color:var(--ac); padding:.05rem .34rem; border-radius:3px;
            background:color-mix(in srgb, var(--ac) 11%, transparent) }

/* Casilla */
.box     { width:19px; height:19px; border:1.5px solid var(--linea); border-radius:50%;
           background:var(--papel) }
.box.on  { background:var(--ac); border-color:var(--ac) }

/* Alta discreta: nada de formularios siempre abiertos */
.nuevo       { color:var(--tinta-3); font-size:.85rem; border-top:1px solid var(--linea-2) }
.nuevo .mas  { width:17px; height:17px; border-radius:50%; border:1px dashed currentColor }

/* Aviso */
.msj      { border-left:2px solid var(--azul); background:rgba(27,63,209,.07);
            border-radius:7px; padding:.6rem .75rem; font-size:.83rem }
.msj.error{ border-left-color:var(--vino); background:rgba(90,42,34,.09) }
.msj.ok   { border-left-color:#0F6E68;    background:rgba(15,110,104,.09) }
```

**Patrón clave — el alta colapsada:** los formularios de "agregar" no viven abiertos.
Se muestran como un `+ Nuevo…` tenue al final de la lista y se expanden al tocarlos.
Eso es lo que evita que la pantalla se vea como una granja de campos.

---

## 9. Layout y móvil

- Mobile-first. `max-width:1160px` centrado, padding lateral `1rem`.
- Dos columnas a partir de `980px`, con `gap:0 3rem`. En móvil los contenedores de
  columna usan `display:contents` para aplanarse y conservar el orden del DOM.
- Encabezado pegajoso con `backdrop-filter:saturate(1.4) blur(8px)` sobre
  `rgba(244,237,224,.94)`.
- **Safe areas obligatorias:** `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`
  y `padding-top:calc(.55rem + env(safe-area-inset-top))` en la barra superior;
  `env(safe-area-inset-bottom)` en cualquier cosa fija abajo.
- Índice de navegación: chips con punto del color de la categoría, scroll horizontal sin
  barra visible (`scrollbar-width:none`), y subrayado de 2px en la activa.

---

## 10. Bloque listo para pegar

```css
:root{
  --crema:#F4EDE0;  --papel:#FFFCF6;
  --azul:#1B3FD1;   --vino:#5A2A22;
  --tinta:#241D14;  --tinta-2:#6B5F50;  --tinta-3:#9A8F80;
  --linea:rgba(36,29,20,.14);  --linea-2:rgba(36,29,20,.07);
  --tit:'Oswald',ui-sans-serif,system-ui,sans-serif;
  --cuerpo:'Work Sans',ui-sans-serif,system-ui,-apple-system,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --ac:var(--azul);
}
body{ margin:0; background:var(--crema); color:var(--tinta);
      font-family:var(--cuerpo); font-size:16px; line-height:1.45;
      -webkit-font-smoothing:antialiased; }
h1,h2,h3{ font-family:var(--tit); font-weight:600; letter-spacing:.02em; margin:0 }
```

### Equivalente Tailwind

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      crema:'#F4EDE0', papel:'#FFFCF6',
      azul:'#1B3FD1',  vino:'#5A2A22',
      tinta:{ DEFAULT:'#241D14', 2:'#6B5F50', 3:'#9A8F80' },
      cat:{ registro:'#1B3FD1', pendiente:'#B26A12', curso:'#0F6E68',
            hecho:'#6B5F50', nota:'#5A2A22', futuro:'#7A3F5D' }
    },
    fontFamily: {
      tit:   ['Oswald','ui-sans-serif','system-ui','sans-serif'],
      cuerpo:['Work Sans','ui-sans-serif','system-ui','sans-serif'],
      mono:  ['IBM Plex Mono','ui-monospace','Menlo','monospace']
    },
    borderRadius: { sm:'3px', DEFAULT:'7px', md:'8px', lg:'12px' }
  }
}
```

---

## 11. Marca e iconos

- El logotipo es un cuadro redondeado (`radius` 6px a 11px según tamaño) en `--azul`,
  con las iniciales **CS** en Oswald color crema, y una barrita horizontal tenue debajo.
- Para PWA: icono `192` y `512` normales más una versión **maskable de 512 con ~14% de
  margen**, o Android recorta el logo al hacerlo redondo. `apple-touch-icon` de 180px
  cuadrado sin redondear — iOS le pone el redondeo.
- `theme_color` y `background_color` del manifest: `#F4EDE0`.

---

## 12. Rápido: sí y no

**Sí**
- Fondo crema, texto tinta café, blanco solo en superficies elevadas
- Un acento por categoría, consumido con `--ac` desde el contenedor
- Rótulos en Oswald mayúsculas espaciadas; datos en mono chiquito
- Reglas de 1px y 2px; casi cero sombras
- Formularios colapsados hasta que se necesitan
- Derivar tonos con `color-mix()` sobre los existentes

**No**
- `#FFFFFF` de fondo, o negro `#000` para texto
- Sombras difusas, gradientes decorativos, `border-radius` de 16px+
- Colores fuera de esta paleta, o saturados tipo semáforo
- Emojis como iconos (usa SVG de trazo, `stroke-width:1.7`, `stroke-linecap:round`)
- Tarjetas idénticas apiladas: rompe el ritmo con anatomías distintas por tipo de contenido
- Texto importante en `--tinta-3` u ocre chico — no pasan contraste
