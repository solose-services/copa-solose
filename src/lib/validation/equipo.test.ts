import { describe, expect, it } from "vitest";
import { validateEquipoForm } from "./equipo";

describe("validateEquipoForm", () => {
  it("returns no errors for valid input", () => {
    expect(validateEquipoForm({ nombre: "Las Águilas", logoUrl: "" })).toEqual({});
  });

  it("requires a non-empty nombre", () => {
    expect(validateEquipoForm({ nombre: "", logoUrl: "" }).nombre).toBe(
      "El nombre es obligatorio."
    );
  });

  it("allows an empty logoUrl", () => {
    expect(validateEquipoForm({ nombre: "Las Águilas", logoUrl: "" }).logoUrl).toBeUndefined();
  });
});
