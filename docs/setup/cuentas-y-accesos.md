# Guía de cuentas y accesos — Copa Solose

Este documento es para que alguien de **Solose** cree las cuentas necesarias para
alojar la aplicación. No requiere conocimientos técnicos, son formularios web. Todas
las cuentas deben crearse a nombre/correo de Solose (no de una persona externa), para
que la organización sea dueña del proyecto, sus datos y su facturación.

Tiempo estimado: 15-20 minutos. Costo en este paso: **$0** (los 3 servicios tienen
plan gratuito).

## 1. GitHub (guarda el código fuente)

1. Entra a [github.com](https://github.com) y crea una cuenta (o usa una ya existente
   de Solose) con un correo de la organización.
2. Crea un repositorio **privado** nuevo, por ejemplo `solose/copa-solose`.
3. Ve a **Settings → Collaborators** del repositorio y agrega como colaborador al
   correo que te indique quien está desarrollando la aplicación, con permiso de
   **Write** (o Admin si también va a configurar el despliegue).

## 2. Vercel (aloja el sitio web)

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta **"Sign up with
   GitHub"**, usando la cuenta de GitHub del paso 1. Esto evita tener que sincronizar
   contraseñas por separado.
2. Cuando te pregunte, autoriza a Vercel a acceder al repositorio `copa-solose` (no
   hace falta dar acceso a todos los repositorios).
3. No hace falta "importar" el proyecto todavía — eso se hace en el siguiente paso del
   plan de implementación, una vez que haya código en el repositorio.

## 3. Supabase (base de datos, login de administración, y almacenamiento de fotos/PDFs)

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta **"Sign up with
   GitHub"**, con la misma cuenta de GitHub del paso 1.
2. Crea una **organización** (te la va a pedir al entrar), nómbrala `Solose`.
3. Dentro de esa organización, crea **dos proyectos** (New Project):
   - `copasolose-staging` — el ambiente de pruebas.
   - `copasolose-production` — el ambiente real, donde va a estar la información
     oficial del torneo.
4. Al crear cada proyecto te va a pedir una **contraseña de base de datos**: genera
   una fuerte (el botón "Generate a password" sirve) y **guárdala en un lugar seguro**
   (un gestor de contraseñas de Solose). No se comparte por correo ni chat.
5. Espera 1-2 minutos a que cada proyecto termine de aprovisionarse.
6. Por cada uno de los 2 proyectos, entra a **Project Settings → API** y copia estos
   3 valores a un documento privado (no lo pegues en un chat ni lo subas a ningún
   lugar público):
   - `Project URL`
   - `anon public` key
   - `service_role` key — **esta es secreta**, nunca debe quedar visible en el
     navegador ni en el código del sitio público. Solo se usa del lado del servidor.

## 4. Entregar las credenciales de forma segura

Cuando termines los 3 pasos anteriores, comparte lo siguiente con quien está
desarrollando la aplicación **por un canal privado** (no por correo sin cifrar ni
chat abierto — idealmente un gestor de contraseñas compartido o una nota que se
autodestruya):

- Confirmación de que ya se creó el repositorio de GitHub y se dio acceso.
- Los 6 valores de Supabase (URL + anon key + service_role key, de cada uno de los 2
  proyectos).

Con eso, se puede continuar con el resto del plan de implementación (conectar la base
de datos, configurar el despliegue en Vercel, y publicar el sitio).

## Nota sobre costos

Mientras el torneo se mantenga en el volumen actual (16 equipos, ~240 jugadoras),
tanto Vercel como Supabase se mantienen en $0/mes en sus planes gratuitos. Si en el
futuro se necesita un dominio propio (ej. `copasolose.com`) o se supera el volumen
gratuito, se avisará con anticipación el costo exacto antes de contratarlo.
