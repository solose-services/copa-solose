import { describe, expect, it } from "vitest";
import { contarMarcador } from "./marcador";

describe("contarMarcador", () => {
  it("counts goals for the local team", () => {
    const resultado = contarMarcador(
      [{ jugadoraId: "j1" }, { jugadoraId: "j1" }],
      new Set(["j1"]),
      new Set(["j2"])
    );
    expect(resultado).toEqual({ golesLocal: 2, golesVisitante: 0 });
  });

  it("counts goals for the visitante team", () => {
    const resultado = contarMarcador([{ jugadoraId: "j2" }], new Set(["j1"]), new Set(["j2"]));
    expect(resultado).toEqual({ golesLocal: 0, golesVisitante: 1 });
  });

  it("returns 0-0 when there are no goles", () => {
    expect(contarMarcador([], new Set(["j1"]), new Set(["j2"]))).toEqual({
      golesLocal: 0,
      golesVisitante: 0,
    });
  });

  it("ignores a gol from a jugadora on neither roster", () => {
    const resultado = contarMarcador([{ jugadoraId: "j3" }], new Set(["j1"]), new Set(["j2"]));
    expect(resultado).toEqual({ golesLocal: 0, golesVisitante: 0 });
  });
});
