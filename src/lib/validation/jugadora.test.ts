import { describe, expect, it } from "vitest";
import { validateJugadoraForm } from "./jugadora";

describe("validateJugadoraForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "10", fotoUrl: "" })
    ).toEqual({});
  });

  it("requires a non-empty nombre", () => {
    expect(
      validateJugadoraForm({ nombre: "", numeroCamiseta: "10", fotoUrl: "" }).nombre
    ).toBe("El nombre es obligatorio.");
  });

  it("allows an empty numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "", fotoUrl: "" })
        .numeroCamiseta
    ).toBeUndefined();
  });

  it("rejects a non-numeric numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "abc", fotoUrl: "" })
        .numeroCamiseta
    ).toBe("El número debe ser un valor numérico.");
  });
});
