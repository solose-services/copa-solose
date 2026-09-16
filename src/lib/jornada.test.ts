import { describe, expect, it } from "vitest";
import { formatearEtiquetaJornada, tituloJornada } from "./jornada";

describe("formatearEtiquetaJornada", () => {
  it("prefixes a purely numeric etiqueta with J", () => {
    expect(formatearEtiquetaJornada("1")).toBe("J1");
    expect(formatearEtiquetaJornada("12")).toBe("J12");
  });

  it("trims whitespace before checking and prefixing", () => {
    expect(formatearEtiquetaJornada("  3  ")).toBe("J3");
  });

  it("leaves a non-numeric etiqueta unchanged", () => {
    expect(formatearEtiquetaJornada("Final")).toBe("Final");
    expect(formatearEtiquetaJornada("Jornada 1")).toBe("Jornada 1");
  });
});

describe("tituloJornada", () => {
  it("spells out a purely numeric etiqueta as 'Jornada N'", () => {
    expect(tituloJornada("7")).toBe("Jornada 7");
  });

  it("leaves a non-numeric etiqueta unchanged", () => {
    expect(tituloJornada("Final")).toBe("Final");
  });
});
