# Diseño: Aplicación de gestión de torneos de fútbol (MVP)

**Fecha:** 2026-09-12
**Estado:** Aprobado por el usuario, pendiente de plan de implementación

## Contexto y problema

Se necesita una aplicación para llevar el registro, control y consulta de torneos de
fútbol amateur organizados en una sola cancha. Actualmente son 2 torneos corriendo en
paralelo (femenil y mixto), con 8 equipos cada uno (16 equipos en total) y hasta 15
jugadoras por equipo (~240 jugadoras en total). El diseño debe permitir agregar más
torneos en el futuro sin cambios estructurales.

Hay dos tipos de usuarias:
- **Jugadoras / público en general**: solo consultan información, sin login.
- **Administradoras del torneo**: entre 2 y 4 personas máximo, con login, capturan y
  mantienen toda la información (equipos, jugadoras, partidos, resultados, avisos,
  reglamento).

Toda la interfaz de la aplicación usa lenguaje femenino.

## Fuera de alcance en este MVP

Explícitamente pospuesto para versiones futuras (no debe colarse en esta fase):

- Login y ficha personal para jugadoras, con notificaciones push antes de su partido.
- Avisos específicos por torneo (en este MVP los avisos son generales para todo el club).
- Estadísticas de temporadas anteriores (límite futuro: 2 temporadas atrás).
- Guardar partidos en el calendario del celular.
- Apps nativas publicadas en App Store / Google Play.
- Funcionamiento sin internet (modo offline con última información cargada).

## Stack técnico

**Next.js (React) + Supabase (Postgres, Auth, Storage) + Vercel.**

Razones:
- Costo $0/mes al volumen actual (16 equipos, ~240 jugadoras); los tiers gratuitos de
  Supabase (500MB de base de datos, 1GB de storage) y Vercel cubren esto de sobra. Un
  dominio propio, si se quiere más adelante, cuesta ~$12 USD/año — costo que se debe
  comunicar antes de aplicarlo.
- Postgres (relacional) es el modelo natural para calcular posiciones y goleo cruzando
  varias tablas (partidos, goles, tarjetas) con criterios de desempate en cascada.
- Reutiliza el stack que el usuario ya conoce de su proyecto `control-gastos`.
- Camino de crecimiento natural: Supabase Auth ya sirve para login de administración
  ahora y para login de jugadoras en el futuro; la app puede convertirse en PWA para
  modo sin internet; si más adelante se requiere app nativa, React Native/Expo puede
  reusar el mismo backend de Supabase.

**Entornos:** dos proyectos de Supabase (pruebas y producción). Vercel genera
automáticamente una URL de vista previa por cada cambio antes de aprobarlo y subirlo a
producción.

**Diseño visual:** existe un mockup ya aprobado por el equipo, hecho en Claude Design.
Se retoma su estilo (colores, tipografía, layout) al construir la interfaz; las
capturas se comparten en esa etapa, no en este documento.

## Modelo de datos

### Entidades capturadas manualmente (administración)

| Tabla | Campos clave | Notas |
|---|---|---|
| `torneos` | nombre, categoría (femenil/mixto), temporada, activo | Permite agregar más torneos sin cambios de estructura. |
| `equipos` | torneo_id, nombre, logo_url | |
| `jugadoras` | equipo_id, nombre, foto_url, número de camiseta | |
| `jornadas` | torneo_id, etiqueta ("Jornada 5", "Semifinal", "Final"), tipo (regular/liguilla), orden | La liguilla se arma a mano: no hay lógica automática de clasificación. |
| `partidos` | jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora, mvp_jugadora_id (nullable), incidencias (texto libre) | El marcador **no** se captura como número: se deriva de contar los goles capturados (ver abajo), para que nunca se desincronice. |
| `alineaciones` | partido_id, jugadora_id, equipo_id | Solo indica que la jugadora jugó ese partido — no distingue titular/suplente. |
| `goles` | partido_id, jugadora_id, minuto | |
| `tarjetas` | partido_id, jugadora_id, tipo (amarilla/roja), minuto | |
| `suspensiones` | jugadora_id, tarjeta_id (nullable), jornada_desde, jornada_hasta, motivo | Capturada manualmente por la administradora — la duración varía según decisión del comité disciplinario, no se calcula sola. |
| `avisos` | título, cuerpo, imagen_url (nullable), fecha_publicación | Generales para todo el club en este MVP (no por torneo). |
| `reglamentos` | torneo_id, pdf_url, actualizado_en | Uno por torneo. Es un PDF subido a Supabase Storage, no texto editable; la pantalla pública lo embebe con opción de abrir/descargar. |

### Datos calculados (no se guardan, se derivan en consulta)

- **Marcador de un partido**: conteo de `goles` por equipo en ese partido.
- **Posiciones**: agregando `partidos` + `goles` + `tarjetas` de la fase regular de
  cada torneo. Orden de desempate: puntos → diferencia de goles → goles a favor →
  resultado directo entre los equipos empatados → menor cantidad de tarjetas →
  sorteo. El sorteo es un evento físico fuera del sistema; si dos equipos siguen
  empatados después de todos los criterios anteriores, la administradora captura un
  campo de "orden de desempate manual" por equipo, usado solo en ese caso.
- **Goleadoras**: suma de `goles` agrupada por jugadora dentro del torneo.
- **Ficha de equipo**: partidos jugados/ganados/empatados/perdidos, puntos, goles a
  favor/en contra, diferencia de goles, tarjetas — calculado de sus partidos.
- **Ficha de jugadora**: partidos jugados/ganados/empatados/perdidos, tarjetas, goles,
  veces MVP — derivado de las tablas anteriores.

## Pantallas

### Público (sin login, responsive, prioridad a celular)

1. **Principal**: avisos generales del club + acceso destacado para elegir torneo
   (Femenil / Mixto).
2. **Dentro de un torneo** (menú fijo mientras se navega, con opción de cambiar de
   torneo):
   - **Menú principal**: Calendario, Posiciones, Goleadoras.
   - **Menú secundario** ("más información"): Suspendidas, Reglamento.
3. **Calendario**: partidos agrupados por jornada. Las jornadas ya jugadas muestran el
   marcador directamente en la lista. Click en un partido abre el **Detalle de
   partido**.
4. **Detalle de partido**: marcador, alineaciones de ambos equipos, goles con minuto,
   tarjetas con minuto, jugadora del partido, incidencias.
5. **Posiciones**: tabla general (equipo, PJ, Pts, GF, GC, DG, tarjetas amarillas y
   rojas). Click en un equipo abre su **Ficha de equipo**.
6. **Ficha de equipo**: logo, estadísticas (PJ/PG/PE/PP/Pts/GF/GC/DG/tarjetas), roster
   de jugadoras registradas.
7. **Ficha de jugadora**: foto, partidos jugados/ganados/empatados/perdidos, tarjetas
   amarillas y rojas, goles, veces MVP.
8. **Goleadoras**: tabla ordenada por goles (nombre, equipo, goles).
9. **Suspendidas**: jugadoras suspendidas, por jornada.
10. **Reglamento**: PDF del torneo actual, embebido con opción de descarga.

**Regla transversal de navegación**: cualquier nombre de equipo o de jugadora que
aparezca en cualquier pantalla (Detalle de partido, Goleadoras, Suspendidas, Ficha de
equipo, etc.) es un link a su ficha correspondiente. Se implementa como un componente
reutilizable de "nombre enlazado", no pantalla por pantalla, para que el
comportamiento sea consistente en toda la aplicación.

### Administración (con login, `/admin` dentro del mismo sitio)

- **Login**: correo y contraseña (Supabase Auth). Cuentas creadas manualmente por la
  administradora principal — no hay registro público. Máximo 2–4 cuentas.
- **Gestión de torneos**: crear nuevos, activar/desactivar.
- **Gestión de equipos y jugadoras**: alta, edición, baja, por torneo.
- **Gestión de jornadas y partidos**: crear el calendario (jornadas y partidos).
- **Captura de partido** (pantalla única, sin cambiar de sección):
  1. Al abrir un partido ya se conocen los dos equipos (vienen de la jornada); se
     cargan automáticamente los rosters registrados de cada uno, en dos columnas.
  2. **Alineación**: checkbox por jugadora indicando si jugó o no.
  3. **Goles**: se agregan eligiendo jugadora (solo las marcadas como que jugaron) +
     minuto. El marcador se recalcula solo.
  4. **Tarjetas**: jugadora + tipo (amarilla/roja) + minuto.
  5. **MVP**: selector con las jugadoras que jugaron, de ambos equipos.
  6. **Incidencias**: campo de texto libre.
- **Gestión de suspensiones**: captura manual (jugadora, motivo, jornadas que abarca).
- **Gestión de avisos**: crear, editar, eliminar.
- **Gestión de reglamento**: subir/reemplazar el PDF por torneo.

Prioridad: formularios simples y directos, sin pasos innecesarios.

## Consideraciones de diseño para versiones futuras

Aunque no se implementan ahora, el modelo de datos ya no bloquea estas extensiones:
- Login de jugadoras: se puede añadir sobre la misma tabla `jugadoras` vinculándola a
  un usuario de Supabase Auth.
- Avisos por torneo: agregar un `torneo_id` nullable a `avisos` (nulo = general).
- Temporadas anteriores: agregar un campo de temporada/año a `torneos` y mantener
  histórico en vez de sobrescribir.
- App nativa y modo sin internet: backend de Supabase reusable desde React
  Native/Expo; PWA con caché de la última carga como primer paso hacia offline.
