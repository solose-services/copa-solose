import { describe, expect, it } from "vitest";
import { validateTorneoForm } from "./torneo";

describe("validateTorneoForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateTorneoForm({ nombre: "Torneo Femenil", categoria: "femenil", temporada: "2026" })
    ).toEqual({});
  });

  it("requires a non-empty nombre", () => {
    expect(
      validateTorneoForm({ nombre: "", categoria: "femenil", temporada: "2026" }).nombre
    ).toBe("El nombre es obligatorio.");
  });

  it("requires a non-empty categoria", () => {
    expect(
      validateTorneoForm({ nombre: "Torneo", categoria: "", temporada: "2026" }).categoria
    ).toBe("La categoría es obligatoria.");
  });

  it("requires a non-empty temporada", () => {
    expect(
      validateTorneoForm({ nombre: "Torneo", categoria: "femenil", temporada: "" }).temporada
    ).toBe("La temporada es obligatoria.");
  });
});
