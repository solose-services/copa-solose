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
    ).toBe("El número debe ser un número entero positivo.");
  });

  it("rejects a decimal numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "10.5", fotoUrl: "" })
        .numeroCamiseta
    ).toBe("El número debe ser un número entero positivo.");
  });

  it("rejects a negative numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "-3", fotoUrl: "" })
        .numeroCamiseta
    ).toBe("El número debe ser un número entero positivo.");
  });

  it("rejects scientific notation for numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "1e9", fotoUrl: "" })
        .numeroCamiseta
    ).toBe("El número debe ser un número entero positivo.");
  });

  it("rejects hex notation for numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "0x10", fotoUrl: "" })
        .numeroCamiseta
    ).toBe("El número debe ser un número entero positivo.");
  });

  it("accepts a plain digit numeroCamiseta like 7", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "7", fotoUrl: "" })
        .numeroCamiseta
    ).toBeUndefined();
  });

  it("accepts zero as a valid numeroCamiseta", () => {
    expect(
      validateJugadoraForm({ nombre: "María López", numeroCamiseta: "0", fotoUrl: "" })
        .numeroCamiseta
    ).toBeUndefined();
  });
});
