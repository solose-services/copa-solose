import { describe, expect, it } from "vitest";
import { validateAvisoForm } from "./aviso";

describe("validateAvisoForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateAvisoForm({
        titulo: "Se pospone la jornada 5",
        cuerpo: "Por lluvia, la jornada 5 se pospone una semana.",
        imagenUrl: "",
      })
    ).toEqual({});
  });

  it("requires a non-empty titulo", () => {
    expect(
      validateAvisoForm({ titulo: "", cuerpo: "Texto", imagenUrl: "" }).titulo
    ).toBe("El título es obligatorio.");
  });

  it("requires a non-empty cuerpo", () => {
    expect(
      validateAvisoForm({ titulo: "Aviso", cuerpo: "", imagenUrl: "" }).cuerpo
    ).toBe("El cuerpo es obligatorio.");
  });

  it("allows an empty imagenUrl", () => {
    expect(
      validateAvisoForm({ titulo: "Aviso", cuerpo: "Texto", imagenUrl: "" }).imagenUrl
    ).toBeUndefined();
  });
});
