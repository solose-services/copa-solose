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
