# Fase 4b — Posiciones, fichas y goleadoras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the standings table, team and player profile pages, and the top-scorers table to the public site — the most data-derived, most scrutinized screens in the whole app (this is literally "who's winning").

**Architecture:** Same Server Component + RLS-enforced `createClient()` pattern as Fase 4a. The standings calculation (`calcularPosiciones`) is extracted as a pure, heavily-tested function — following the precedent `contarMarcador` set in Fase 4a, and directly answering a theme raised in three prior phases' final reviews (critical derived logic needs real test coverage, not just careful reading).

**Tech Stack:** Same as prior phases (Next.js 16, React 19, TypeScript, Tailwind, Vitest, `@supabase/ssr`). No new dependencies.

## Decision carried over from Fase 4a's final review (documented, not re-litigated here)

Fase 4a's calendario page renders equipo names as **plain text**, not wrapped in `NombreEquipo` — because the entire match row is already a `<Link>` to the partido detail, and nesting an `<a>` inside an `<a>` is invalid HTML. This is the **one deliberate exception** to the "every name is a link" rule. **Every screen in this plan uses `NombreEquipo`/`NombreJugadora` for every name**, with no row-level link wrapping anything — so this exception does not recur here.

## Global Constraints

- Toda la interfaz usa lenguaje femenino.
- La tabla de posiciones solo considera partidos de jornadas con `tipo = 'regular'` que ya se jugaron (misma regla de fecha que el Calendario: `fecha` existe y no es posterior a hoy, calculado en la zona horaria de la liga — ver la nota de zona horaria abajo). Las fichas de equipo y de jugadora, en cambio, consideran **todos** los partidos en los que participaron (regular y liguilla) — es un resumen de temporada, no la tabla competitiva.
- Orden de desempate de posiciones, en este orden: puntos → diferencia de goles → goles a favor → resultado directo (calculado por pares, solo entre los equipos empatados) → menor cantidad de tarjetas (amarillas + rojas) → `orden_desempate_manual` (campo ya existente en `equipos` desde la Fundación, para el caso de sorteo).
- **Simplificación explícita y documentada:** el resultado directo se calcula por comparación de pares (cuántos puntos sacó el equipo A contra el equipo B en los partidos entre ellos dos). Para un empate de más de 2 equipos, esto es una aproximación razonable y no la "mini-tabla" completa que usan las ligas profesionales — dado el tamaño de esta liga (8 equipos), es la opción más simple que cubre el caso común (empate entre 2 equipos) sin construir un algoritmo de sub-tablas recursivo. Si esto resulta insuficiente en la práctica, es un problema conocido para revisar después, no un error no documentado.
- **Zona horaria:** cualquier cálculo de "hoy" para decidir si un partido ya se jugó usa `America/Mexico_City` (vía `Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" })`), igual que se corrigió en la revisión final de Fase 4a — nunca `new Date().toISOString()` (esa es UTC).
- Cualquier nombre de equipo o de jugadora en las pantallas de este plan es un link a su ficha, vía `NombreEquipo`/`NombreJugadora` (Fase 4a) — sin excepciones en este plan.
- Toda query de lista (incluidas las de apoyo) revisa su `error` y bloquea/oculta lo que dependa de ella con un mensaje visible.
- Costo $0/mes, sin dependencias nuevas.

---

## File Structure

```
src/
├── lib/
│   ├── posiciones.ts / posiciones.test.ts     # NEW: calcularPosiciones (pure, heavily tested)
├── app/
│   ├── equipos/
│   │   └── [equipoId]/
│   │       └── page.tsx                        # NEW: ficha de equipo
│   ├── jugadoras/
│   │   └── [jugadoraId]/
│   │       └── page.tsx                        # NEW: ficha de jugadora
│   └── torneos/
│       └── [torneoId]/
│           ├── posiciones/
│           │   └── page.tsx                    # NEW
│           └── goleadoras/
│               └── page.tsx                    # NEW
```

---

### Task 1: `calcularPosiciones` — cálculo puro de la tabla de posiciones

**Files:**
- Create: `src/lib/posiciones.ts`
- Test: `src/lib/posiciones.test.ts`

**Interfaces:**
- Produces: `calcularPosiciones(equipoIds: string[], partidos: PartidoParaPosiciones[], ordenDesempateManualPorEquipo: Map<string, number | null>): EstadisticaEquipo[]` — used by Task 2 (posiciones page).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/posiciones.test.ts
import { describe, expect, it } from "vitest";
import { calcularPosiciones, type PartidoParaPosiciones } from "./posiciones";

function partido(overrides: Partial<PartidoParaPosiciones> & {
  equipoLocalId: string;
  equipoVisitanteId: string;
}): PartidoParaPosiciones {
  return {
    golesLocal: 0,
    golesVisitante: 0,
    tarjetasAmarillasLocal: 0,
    tarjetasRojasLocal: 0,
    tarjetasAmarillasVisitante: 0,
    tarjetasRojasVisitante: 0,
    ...overrides,
  };
}

describe("calcularPosiciones", () => {
  it("gives 3 points to the winner and 0 to the loser", () => {
    const tabla = calcularPosiciones(
      ["a", "b"],
      [partido({ equipoLocalId: "a", equipoVisitanteId: "b", golesLocal: 2, golesVisitante: 0 })],
      new Map()
    );
    const a = tabla.find((fila) => fila.equipoId === "a")!;
    const b = tabla.find((fila) => fila.equipoId === "b")!;
    expect(a.puntos).toBe(3);
    expect(a.ganados).toBe(1);
    expect(b.puntos).toBe(0);
    expect(b.perdidos).toBe(1);
  });

  it("gives 1 point to each team on a draw", () => {
    const tabla = calcularPosiciones(
      ["a", "b"],
      [partido({ equipoLocalId: "a", equipoVisitanteId: "b", golesLocal: 1, golesVisitante: 1 })],
      new Map()
    );
    expect(tabla.every((fila) => fila.puntos === 1 && fila.empatados === 1)).toBe(true);
  });

  it("sorts by points descending", () => {
    const tabla = calcularPosiciones(
      ["a", "b", "c"],
      [
        partido({ equipoLocalId: "a", equipoVisitanteId: "b", golesLocal: 3, golesVisitante: 0 }),
        partido({ equipoLocalId: "c", equipoVisitanteId: "b", golesLocal: 1, golesVisitante: 1 }),
      ],
      new Map()
    );
    expect(tabla.map((fila) => fila.equipoId)).toEqual(["a", "c", "b"]);
  });

  it("breaks a points tie by diferencia de goles", () => {
    const tabla = calcularPosiciones(
      ["a", "b", "x", "y"],
      [
        partido({ equipoLocalId: "a", equipoVisitanteId: "x", golesLocal: 5, golesVisitante: 0 }),
        partido({ equipoLocalId: "b", equipoVisitanteId: "y", golesLocal: 2, golesVisitante: 0 }),
      ],
      new Map()
    );
    // both "a" and "b" have 3 points; "a" has a better goal difference
    const a = tabla.find((fila) => fila.equipoId === "a")!;
    const b = tabla.find((fila) => fila.equipoId === "b")!;
    expect(a.puntos).toBe(b.puntos);
    expect(tabla.findIndex((fila) => fila.equipoId === "a")).toBeLessThan(
      tabla.findIndex((fila) => fila.equipoId === "b")
    );
  });

  it("breaks a points+DG tie by goles a favor", () => {
    const tabla = calcularPosiciones(
      ["a", "b", "x", "y"],
      [
        partido({ equipoLocalId: "a", equipoVisitanteId: "x", golesLocal: 4, golesVisitante: 1 }),
        partido({ equipoLocalId: "b", equipoVisitanteId: "y", golesLocal: 3, golesVisitante: 0 }),
      ],
      new Map()
    );
    // both "a" and "b" have 3 points and +3 diferencia; "a" scored more goals (4 vs 3)
    const a = tabla.find((fila) => fila.equipoId === "a")!;
    const b = tabla.find((fila) => fila.equipoId === "b")!;
    expect(a.puntos).toBe(b.puntos);
    expect(a.diferenciaGoles).toBe(b.diferenciaGoles);
    expect(tabla.findIndex((fila) => fila.equipoId === "a")).toBeLessThan(
      tabla.findIndex((fila) => fila.equipoId === "b")
    );
  });

  it("breaks a points+DG+GF tie by resultado directo", () => {
    // Constructed so "a" and "b" finish with identical puntos (3), diferenciaGoles (0),
    // and golesFavor (2) in aggregate, but "a" beat "b" 2-1 head-to-head:
    //   a: beats b 2-1 (3 pts, DG +1, GF 2), loses to x 0-1 (0 pts, DG -1, GF 0) => 3 pts, DG 0, GF 2
    //   b: loses to a 1-2 (0 pts, DG -1, GF 1), beats y 1-0 (3 pts, DG +1, GF 1) => 3 pts, DG 0, GF 2
    const tabla = calcularPosiciones(
      ["a", "b", "x", "y"],
      [
        partido({ equipoLocalId: "a", equipoVisitanteId: "b", golesLocal: 2, golesVisitante: 1 }),
        partido({ equipoLocalId: "x", equipoVisitanteId: "a", golesLocal: 1, golesVisitante: 0 }),
        partido({ equipoLocalId: "b", equipoVisitanteId: "y", golesLocal: 1, golesVisitante: 0 }),
      ],
      new Map()
    );
    const a = tabla.find((fila) => fila.equipoId === "a")!;
    const b = tabla.find((fila) => fila.equipoId === "b")!;
    expect(a.puntos).toBe(3);
    expect(b.puntos).toBe(3);
    expect(a.diferenciaGoles).toBe(0);
    expect(b.diferenciaGoles).toBe(0);
    expect(a.golesFavor).toBe(2);
    expect(b.golesFavor).toBe(2);
    // puntos/DG/GF are all tied, so resultado directo (a beat b head-to-head) decides it
    expect(tabla.findIndex((fila) => fila.equipoId === "a")).toBeLessThan(
      tabla.findIndex((fila) => fila.equipoId === "b")
    );
  });

  it("breaks a full tie (points, DG, GF, resultado directo all equal) by fewer tarjetas", () => {
    const tabla = calcularPosiciones(
      ["a", "b", "x", "y"],
      [
        partido({
          equipoLocalId: "a",
          equipoVisitanteId: "x",
          golesLocal: 2,
          golesVisitante: 1,
          tarjetasAmarillasLocal: 0,
        }),
        partido({
          equipoLocalId: "b",
          equipoVisitanteId: "y",
          golesLocal: 2,
          golesVisitante: 1,
          tarjetasAmarillasLocal: 3,
        }),
      ],
      new Map()
    );
    // both "a" and "b": 3 pts, +1 DG, 2 GF, no direct meeting (0-0 direct) — "a" has fewer tarjetas
    const a = tabla.find((fila) => fila.equipoId === "a")!;
    const b = tabla.find((fila) => fila.equipoId === "b")!;
    expect(a.puntos).toBe(b.puntos);
    expect(a.diferenciaGoles).toBe(b.diferenciaGoles);
    expect(a.golesFavor).toBe(b.golesFavor);
    expect(a.tarjetasAmarillas + a.tarjetasRojas).toBeLessThan(
      b.tarjetasAmarillas + b.tarjetasRojas
    );
    expect(tabla.findIndex((fila) => fila.equipoId === "a")).toBeLessThan(
      tabla.findIndex((fila) => fila.equipoId === "b")
    );
  });

  it("breaks a complete tie by orden_desempate_manual", () => {
    const tabla = calcularPosiciones(
      ["a", "b", "x", "y"],
      [
        partido({ equipoLocalId: "a", equipoVisitanteId: "x", golesLocal: 2, golesVisitante: 1 }),
        partido({ equipoLocalId: "b", equipoVisitanteId: "y", golesLocal: 2, golesVisitante: 1 }),
      ],
      new Map([
        ["a", 2],
        ["b", 1],
      ])
    );
    // identical on every automatic criterion; orden_desempate_manual: "b" (1) ranks above "a" (2)
    const a = tabla.find((fila) => fila.equipoId === "a")!;
    const b = tabla.find((fila) => fila.equipoId === "b")!;
    expect(a.puntos).toBe(b.puntos);
    expect(a.diferenciaGoles).toBe(b.diferenciaGoles);
    expect(a.golesFavor).toBe(b.golesFavor);
    expect(a.tarjetasAmarillas + a.tarjetasRojas).toBe(b.tarjetasAmarillas + b.tarjetasRojas);
    expect(tabla.findIndex((fila) => fila.equipoId === "a")).toBeGreaterThan(
      tabla.findIndex((fila) => fila.equipoId === "b")
    );
  });

  it("computes GF/GC/DG and PJ/PG/PE/PP correctly across multiple matches", () => {
    const tabla = calcularPosiciones(
      ["a", "x", "y", "z"],
      [
        partido({ equipoLocalId: "a", equipoVisitanteId: "x", golesLocal: 3, golesVisitante: 1 }),
        partido({ equipoLocalId: "y", equipoVisitanteId: "a", golesLocal: 2, golesVisitante: 2 }),
        partido({ equipoLocalId: "a", equipoVisitanteId: "z", golesLocal: 0, golesVisitante: 1 }),
      ],
      new Map()
    );
    const a = tabla.find((fila) => fila.equipoId === "a")!;
    expect(a.partidosJugados).toBe(3);
    expect(a.ganados).toBe(1);
    expect(a.empatados).toBe(1);
    expect(a.perdidos).toBe(1);
    expect(a.golesFavor).toBe(5);
    expect(a.golesContra).toBe(4);
    expect(a.diferenciaGoles).toBe(1);
    expect(a.puntos).toBe(4);
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run src/lib/posiciones.test.ts`
Expected: FAIL — `Cannot find module './posiciones'`.

- [ ] **Step 3: Implementation**

```ts
// src/lib/posiciones.ts
export interface PartidoParaPosiciones {
  equipoLocalId: string;
  equipoVisitanteId: string;
  golesLocal: number;
  golesVisitante: number;
  tarjetasAmarillasLocal: number;
  tarjetasRojasLocal: number;
  tarjetasAmarillasVisitante: number;
  tarjetasRojasVisitante: number;
}

export interface EstadisticaEquipo {
  equipoId: string;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  ordenDesempateManual: number | null;
}

export function calcularPosiciones(
  equipoIds: string[],
  partidos: PartidoParaPosiciones[],
  ordenDesempateManualPorEquipo: Map<string, number | null>
): EstadisticaEquipo[] {
  const stats = new Map<string, EstadisticaEquipo>();
  for (const equipoId of equipoIds) {
    stats.set(equipoId, {
      equipoId,
      partidosJugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0,
      diferenciaGoles: 0,
      puntos: 0,
      tarjetasAmarillas: 0,
      tarjetasRojas: 0,
      ordenDesempateManual: ordenDesempateManualPorEquipo.get(equipoId) ?? null,
    });
  }

  for (const partido of partidos) {
    const local = stats.get(partido.equipoLocalId);
    const visitante = stats.get(partido.equipoVisitanteId);
    if (!local || !visitante) continue;

    local.partidosJugados += 1;
    visitante.partidosJugados += 1;
    local.golesFavor += partido.golesLocal;
    local.golesContra += partido.golesVisitante;
    visitante.golesFavor += partido.golesVisitante;
    visitante.golesContra += partido.golesLocal;
    local.tarjetasAmarillas += partido.tarjetasAmarillasLocal;
    local.tarjetasRojas += partido.tarjetasRojasLocal;
    visitante.tarjetasAmarillas += partido.tarjetasAmarillasVisitante;
    visitante.tarjetasRojas += partido.tarjetasRojasVisitante;

    if (partido.golesLocal > partido.golesVisitante) {
      local.ganados += 1;
      local.puntos += 3;
      visitante.perdidos += 1;
    } else if (partido.golesLocal < partido.golesVisitante) {
      visitante.ganados += 1;
      visitante.puntos += 3;
      local.perdidos += 1;
    } else {
      local.empatados += 1;
      visitante.empatados += 1;
      local.puntos += 1;
      visitante.puntos += 1;
    }
  }

  for (const estadistica of stats.values()) {
    estadistica.diferenciaGoles = estadistica.golesFavor - estadistica.golesContra;
  }

  const resultadoDirecto = calcularResultadoDirecto(partidos);
  const lista = Array.from(stats.values());

  lista.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
    if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;

    const directoA = resultadoDirecto.get(`${a.equipoId}:${b.equipoId}`) ?? 0;
    const directoB = resultadoDirecto.get(`${b.equipoId}:${a.equipoId}`) ?? 0;
    if (directoA !== directoB) return directoB - directoA;

    const tarjetasA = a.tarjetasAmarillas + a.tarjetasRojas;
    const tarjetasB = b.tarjetasAmarillas + b.tarjetasRojas;
    if (tarjetasA !== tarjetasB) return tarjetasA - tarjetasB;

    const ordenA = a.ordenDesempateManual ?? Number.MAX_SAFE_INTEGER;
    const ordenB = b.ordenDesempateManual ?? Number.MAX_SAFE_INTEGER;
    return ordenA - ordenB;
  });

  return lista;
}

function calcularResultadoDirecto(partidos: PartidoParaPosiciones[]): Map<string, number> {
  const puntosDirectos = new Map<string, number>();

  const sumar = (equipoId: string, rivalId: string, puntos: number) => {
    const clave = `${equipoId}:${rivalId}`;
    puntosDirectos.set(clave, (puntosDirectos.get(clave) ?? 0) + puntos);
  };

  for (const partido of partidos) {
    if (partido.golesLocal > partido.golesVisitante) {
      sumar(partido.equipoLocalId, partido.equipoVisitanteId, 3);
    } else if (partido.golesLocal < partido.golesVisitante) {
      sumar(partido.equipoVisitanteId, partido.equipoLocalId, 3);
    } else {
      sumar(partido.equipoLocalId, partido.equipoVisitanteId, 1);
      sumar(partido.equipoVisitanteId, partido.equipoLocalId, 1);
    }
  }

  return puntosDirectos;
}
```

- [ ] **Step 4: Verify it passes**

Run: `npm test`
Expected: all tests pass, including the 10 new ones.

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully` (this module isn't imported anywhere yet — Task 2 does that).

- [ ] **Step 6: Commit**

```bash
git add src/lib/posiciones.ts src/lib/posiciones.test.ts
git commit -m "feat: add calcularPosiciones — pure, tested standings calculation"
```

---

### Task 2: Posiciones

**Files:**
- Create: `src/app/torneos/[torneoId]/posiciones/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `calcularPosiciones` (Task 1), `NombreEquipo` (Fase 4a).
- Produces: the page Fase 4a's nav shell already links to.

- [ ] **Step 1: Page**

```tsx
// src/app/torneos/[torneoId]/posiciones/page.tsx
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { calcularPosiciones, type PartidoParaPosiciones } from "@/lib/posiciones";

export default async function PosicionesPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, orden_desempate_manual")
    .eq("torneo_id", torneoId);

  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);
  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));
  const ordenDesempateManualPorEquipo = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, equipo.orden_desempate_manual])
  );

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase.from("jugadoras").select("id, equipo_id").in("equipo_id", equipoIds)
      : { data: [] as { id: string; equipo_id: string }[], error: null };

  const idsPorEquipo = new Map<string, Set<string>>();
  for (const jugadora of jugadoras ?? []) {
    const set = idsPorEquipo.get(jugadora.equipo_id) ?? new Set<string>();
    set.add(jugadora.id);
    idsPorEquipo.set(jugadora.equipo_id, set);
  }

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id")
    .eq("torneo_id", torneoId)
    .eq("tipo", "regular");

  const jornadaIds = (jornadas ?? []).map((jornada) => jornada.id);

  const { data: partidosRaw, error: partidosError } =
    jornadaIds.length > 0
      ? await supabase
          .from("partidos")
          .select("id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIds)
      : {
          data: [] as {
            id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        };

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const partidosJugados = (partidosRaw ?? []).filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIds = partidosJugados.map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("partido_id, jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string; tipo: string }[], error: null };

  const partidosParaCalculo: PartidoParaPosiciones[] = partidosJugados.map((partido) => {
    const idsLocal = idsPorEquipo.get(partido.equipo_local_id) ?? new Set<string>();
    const idsVisitante = idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set<string>();

    let golesLocal = 0;
    let golesVisitante = 0;
    for (const gol of goles ?? []) {
      if (gol.partido_id !== partido.id) continue;
      if (idsLocal.has(gol.jugadora_id)) golesLocal += 1;
      else if (idsVisitante.has(gol.jugadora_id)) golesVisitante += 1;
    }

    let tarjetasAmarillasLocal = 0;
    let tarjetasRojasLocal = 0;
    let tarjetasAmarillasVisitante = 0;
    let tarjetasRojasVisitante = 0;
    for (const tarjeta of tarjetas ?? []) {
      if (tarjeta.partido_id !== partido.id) continue;
      const esLocal = idsLocal.has(tarjeta.jugadora_id);
      const esVisitante = idsVisitante.has(tarjeta.jugadora_id);
      if (esLocal && tarjeta.tipo === "amarilla") tarjetasAmarillasLocal += 1;
      else if (esLocal && tarjeta.tipo === "roja") tarjetasRojasLocal += 1;
      else if (esVisitante && tarjeta.tipo === "amarilla") tarjetasAmarillasVisitante += 1;
      else if (esVisitante && tarjeta.tipo === "roja") tarjetasRojasVisitante += 1;
    }

    return {
      equipoLocalId: partido.equipo_local_id,
      equipoVisitanteId: partido.equipo_visitante_id,
      golesLocal,
      golesVisitante,
      tarjetasAmarillasLocal,
      tarjetasRojasLocal,
      tarjetasAmarillasVisitante,
      tarjetasRojasVisitante,
    };
  });

  const tabla = calcularPosiciones(equipoIds, partidosParaCalculo, ordenDesempateManualPorEquipo);

  const hayError = Boolean(
    equiposError ||
      jugadorasError ||
      jornadasError ||
      partidosError ||
      golesError ||
      tarjetasError
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Posiciones</h1>
      {hayError ? (
        <p className="text-red-600">No se pudieron cargar las posiciones. Intenta de nuevo.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Equipo</th>
              <th className="p-2">PJ</th>
              <th className="p-2">Pts</th>
              <th className="p-2">GF</th>
              <th className="p-2">GC</th>
              <th className="p-2">DG</th>
              <th className="p-2">TA</th>
              <th className="p-2">TR</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((fila) => (
              <tr key={fila.equipoId} className="border-t">
                <td className="p-2">
                  <NombreEquipo
                    id={fila.equipoId}
                    nombre={nombrePorEquipo.get(fila.equipoId) ?? "Equipo"}
                  />
                </td>
                <td className="p-2">{fila.partidosJugados}</td>
                <td className="p-2">{fila.puntos}</td>
                <td className="p-2">{fila.golesFavor}</td>
                <td className="p-2">{fila.golesContra}</td>
                <td className="p-2">{fila.diferenciaGoles}</td>
                <td className="p-2">{fila.tarjetasAmarillas}</td>
                <td className="p-2">{fila.tarjetasRojas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/torneos/[torneoId]/posiciones` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/torneos/[torneoId]/posiciones"
git commit -m "feat: add public posiciones screen"
```

---

### Task 3: Ficha de equipo

**Files:**
- Create: `src/app/equipos/[equipoId]/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `NombreJugadora` (Fase 4a).
- Produces: the page every `NombreEquipo` link across the whole public site points to.

- [ ] **Step 1: Page**

```tsx
// src/app/equipos/[equipoId]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";

export default async function FichaEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("id", equipoId)
    .maybeSingle();

  if (!equipo) {
    notFound();
  }

  const { data: jugadoras, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, numero_camiseta")
    .eq("equipo_id", equipoId)
    .order("nombre");

  const idsPropias = new Set((jugadoras ?? []).map((jugadora) => jugadora.id));

  const { data: partidosLocal, error: partidosLocalError } = await supabase
    .from("partidos")
    .select("id")
    .eq("equipo_local_id", equipoId);

  const { data: partidosVisitante, error: partidosVisitanteError } = await supabase
    .from("partidos")
    .select("id")
    .eq("equipo_visitante_id", equipoId);

  const partidos = [...(partidosLocal ?? []), ...(partidosVisitante ?? [])];
  const partidoIds = partidos.map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { jugadora_id: string; tipo: string }[], error: null };

  const golesPorPartido = new Map<string, { propios: number; rivales: number }>();
  for (const partido of partidos) {
    golesPorPartido.set(partido.id, { propios: 0, rivales: 0 });
  }
  for (const gol of goles ?? []) {
    const entrada = golesPorPartido.get(gol.partido_id);
    if (!entrada) continue;
    if (idsPropias.has(gol.jugadora_id)) {
      entrada.propios += 1;
    } else {
      entrada.rivales += 1;
    }
  }

  let ganados = 0;
  let empatados = 0;
  let perdidos = 0;
  let golesFavor = 0;
  let golesContra = 0;
  for (const { propios, rivales } of golesPorPartido.values()) {
    golesFavor += propios;
    golesContra += rivales;
    if (propios > rivales) ganados += 1;
    else if (propios < rivales) perdidos += 1;
    else empatados += 1;
  }

  let tarjetasAmarillas = 0;
  let tarjetasRojas = 0;
  for (const tarjeta of tarjetas ?? []) {
    if (!idsPropias.has(tarjeta.jugadora_id)) continue;
    if (tarjeta.tipo === "amarilla") tarjetasAmarillas += 1;
    else if (tarjeta.tipo === "roja") tarjetasRojas += 1;
  }

  const partidosJugados = partidos.length;
  const puntos = ganados * 3 + empatados;
  const diferenciaGoles = golesFavor - golesContra;

  const hayError = Boolean(
    jugadorasError ||
      partidosLocalError ||
      partidosVisitanteError ||
      golesError ||
      tarjetasError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        {equipo.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={equipo.logo_url}
            alt={equipo.nombre}
            className="h-16 w-16 rounded object-cover"
          />
        )}
        <h1 className="text-xl font-semibold">{equipo.nombre}</h1>
      </div>

      {hayError ? (
        <p className="text-red-600">
          No se pudo cargar la información del equipo. Intenta de nuevo.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div>
              <dt className="text-sm text-gray-600">PJ</dt>
              <dd className="text-lg font-semibold">{partidosJugados}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">PG</dt>
              <dd className="text-lg font-semibold">{ganados}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">PE</dt>
              <dd className="text-lg font-semibold">{empatados}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">PP</dt>
              <dd className="text-lg font-semibold">{perdidos}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Pts</dt>
              <dd className="text-lg font-semibold">{puntos}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">GF</dt>
              <dd className="text-lg font-semibold">{golesFavor}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">GC</dt>
              <dd className="text-lg font-semibold">{golesContra}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">DG</dt>
              <dd className="text-lg font-semibold">{diferenciaGoles}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">TA / TR</dt>
              <dd className="text-lg font-semibold">
                {tarjetasAmarillas} / {tarjetasRojas}
              </dd>
            </div>
          </dl>

          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">Jugadoras</h2>
            <ul className="flex flex-col gap-1">
              {(jugadoras ?? []).map((jugadora) => (
                <li key={jugadora.id}>
                  <NombreJugadora id={jugadora.id} nombre={jugadora.nombre} />
                  {jugadora.numero_camiseta != null && ` (#${jugadora.numero_camiseta})`}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/equipos/[equipoId]` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/equipos"
git commit -m "feat: add public ficha de equipo screen"
```

---

### Task 4: Ficha de jugadora

**Files:**
- Create: `src/app/jugadoras/[jugadoraId]/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `NombreEquipo` (Fase 4a).
- Produces: the page every `NombreJugadora` link across the whole public site points to. This is the last "ficha" page — after this, every link created since the start of Fase 4a resolves to something real.

- [ ] **Step 1: Page**

```tsx
// src/app/jugadoras/[jugadoraId]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";

export default async function FichaJugadoraPage({
  params,
}: {
  params: Promise<{ jugadoraId: string }>;
}) {
  const { jugadoraId } = await params;
  const supabase = await createClient();

  const { data: jugadora } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta, equipo_id")
    .eq("id", jugadoraId)
    .maybeSingle();

  if (!jugadora) {
    notFound();
  }

  const { data: equipo } = await supabase
    .from("equipos")
    .select("id, nombre")
    .eq("id", jugadora.equipo_id)
    .maybeSingle();

  const { data: companeras, error: companerasError } = await supabase
    .from("jugadoras")
    .select("id")
    .eq("equipo_id", jugadora.equipo_id);

  const idsCompaneras = new Set((companeras ?? []).map((fila) => fila.id));

  const { data: alineaciones, error: alineacionesError } = await supabase
    .from("alineaciones")
    .select("partido_id")
    .eq("jugadora_id", jugadoraId);

  const partidoIds = (alineaciones ?? []).map((fila) => fila.partido_id);

  const { data: partidos, error: partidosError } =
    partidoIds.length > 0
      ? await supabase.from("partidos").select("id").in("id", partidoIds)
      : { data: [] as { id: string }[], error: null };

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { jugadora_id: string; tipo: string }[], error: null };

  const { count: vecesMvp, error: mvpError } = await supabase
    .from("partidos")
    .select("id", { count: "exact", head: true })
    .eq("mvp_jugadora_id", jugadoraId);

  const golesPorPartido = new Map<string, { propios: number; rivales: number }>();
  for (const partido of partidos ?? []) {
    golesPorPartido.set(partido.id, { propios: 0, rivales: 0 });
  }
  for (const gol of goles ?? []) {
    const entrada = golesPorPartido.get(gol.partido_id);
    if (!entrada) continue;
    if (idsCompaneras.has(gol.jugadora_id)) {
      entrada.propios += 1;
    } else {
      entrada.rivales += 1;
    }
  }

  let ganados = 0;
  let empatados = 0;
  let perdidos = 0;
  for (const { propios, rivales } of golesPorPartido.values()) {
    if (propios > rivales) ganados += 1;
    else if (propios < rivales) perdidos += 1;
    else empatados += 1;
  }

  const totalGoles = (goles ?? []).filter((gol) => gol.jugadora_id === jugadoraId).length;
  const totalAmarillas = (tarjetas ?? []).filter(
    (tarjeta) => tarjeta.jugadora_id === jugadoraId && tarjeta.tipo === "amarilla"
  ).length;
  const totalRojas = (tarjetas ?? []).filter(
    (tarjeta) => tarjeta.jugadora_id === jugadoraId && tarjeta.tipo === "roja"
  ).length;

  const hayError = Boolean(
    companerasError ||
      alineacionesError ||
      partidosError ||
      golesError ||
      tarjetasError ||
      mvpError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        {jugadora.foto_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={jugadora.foto_url}
            alt={jugadora.nombre}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-xl font-semibold">{jugadora.nombre}</h1>
          {equipo && <NombreEquipo id={equipo.id} nombre={equipo.nombre} />}
        </div>
      </div>

      {hayError ? (
        <p className="text-red-600">
          No se pudo cargar la información de la jugadora. Intenta de nuevo.
        </p>
      ) : (
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-sm text-gray-600">PJ</dt>
            <dd className="text-lg font-semibold">{partidoIds.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">PG</dt>
            <dd className="text-lg font-semibold">{ganados}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">PE</dt>
            <dd className="text-lg font-semibold">{empatados}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">PP</dt>
            <dd className="text-lg font-semibold">{perdidos}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Goles</dt>
            <dd className="text-lg font-semibold">{totalGoles}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">TA / TR</dt>
            <dd className="text-lg font-semibold">
              {totalAmarillas} / {totalRojas}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Veces MVP</dt>
            <dd className="text-lg font-semibold">{vecesMvp ?? 0}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/jugadoras/[jugadoraId]` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/jugadoras"
git commit -m "feat: add public ficha de jugadora screen"
```

---

### Task 5: Goleadoras

**Files:**
- Create: `src/app/torneos/[torneoId]/goleadoras/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `NombreJugadora`, `NombreEquipo` (Fase 4a).
- Produces: the page Fase 4a's nav shell already links to. This is the last task of Fase 4b.

- [ ] **Step 1: Page**

```tsx
// src/app/torneos/[torneoId]/goleadoras/page.tsx
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { NombreEquipo } from "@/components/public/nombre-equipo";

export default async function GoleadorasPage({
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

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, equipo_id")
          .in("equipo_id", equipoIds)
      : { data: [] as { id: string; nombre: string; equipo_id: string }[], error: null };

  const jugadoraIds = (jugadoras ?? []).map((jugadora) => jugadora.id);

  const { data: goles, error: golesError } =
    jugadoraIds.length > 0
      ? await supabase.from("goles").select("jugadora_id").in("jugadora_id", jugadoraIds)
      : { data: [] as { jugadora_id: string }[], error: null };

  const golesPorJugadora = new Map<string, number>();
  for (const gol of goles ?? []) {
    golesPorJugadora.set(gol.jugadora_id, (golesPorJugadora.get(gol.jugadora_id) ?? 0) + 1);
  }

  const tabla = (jugadoras ?? [])
    .map((jugadora) => ({
      id: jugadora.id,
      nombre: jugadora.nombre,
      equipoId: jugadora.equipo_id,
      goles: golesPorJugadora.get(jugadora.id) ?? 0,
    }))
    .filter((fila) => fila.goles > 0)
    .sort((a, b) => b.goles - a.goles);

  const hayError = Boolean(equiposError || jugadorasError || golesError);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Goleadoras</h1>
      {hayError ? (
        <p className="text-red-600">No se pudieron cargar las goleadoras. Intenta de nuevo.</p>
      ) : tabla.length === 0 ? (
        <p className="text-gray-600">Todavía no hay goles registrados.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Jugadora</th>
              <th className="p-2">Equipo</th>
              <th className="p-2">Goles</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((fila) => (
              <tr key={fila.id} className="border-t">
                <td className="p-2">
                  <NombreJugadora id={fila.id} nombre={fila.nombre} />
                </td>
                <td className="p-2">
                  <NombreEquipo
                    id={fila.equipoId}
                    nombre={nombrePorEquipo.get(fila.equipoId) ?? "Equipo"}
                  />
                </td>
                <td className="p-2">{fila.goles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, with `/torneos/[torneoId]/goleadoras` listed as a dynamic route.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/torneos/[torneoId]/goleadoras"
git commit -m "feat: add public goleadoras screen, completing Fase 4b"
```

---

## Al terminar

Con esto, el sitio público está completo en su núcleo: Principal, selector de torneo, Calendario, Detalle de partido, Posiciones, Ficha de equipo, Ficha de jugadora, y Goleadoras — todos los nombres enlazados entre sí, todo derivado de los mismos datos que la administración ya captura. El siguiente y último plan (**Fase 4c — Suspendidas y reglamento**) agrega las dos pantallas restantes del menú secundario, cerrando el MVP completo descrito en el diseño original.
