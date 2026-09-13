import { describe, expect, it } from "vitest";
import { validateJornadaForm } from "./jornada";

describe("validateJornadaForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "regular", orden: "1" })
    ).toEqual({});
  });

  it("requires a non-empty etiqueta", () => {
    expect(
      validateJornadaForm({ etiqueta: "", tipo: "regular", orden: "1" }).etiqueta
    ).toBe("La etiqueta es obligatoria.");
  });

  it("rejects an invalid tipo", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "otro", orden: "1" }).tipo
    ).toBe("Selecciona un tipo válido.");
  });

  it("accepts tipo liguilla", () => {
    expect(
      validateJornadaForm({ etiqueta: "Semifinal", tipo: "liguilla", orden: "9" })
    ).toEqual({});
  });

  it("rejects a non-numeric orden", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "regular", orden: "abc" }).orden
    ).toBe("El orden debe ser un número entero positivo.");
  });

  it("rejects a negative orden", () => {
    expect(
      validateJornadaForm({ etiqueta: "Jornada 1", tipo: "regular", orden: "-1" }).orden
    ).toBe("El orden debe ser un número entero positivo.");
  });
});
