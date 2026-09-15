import { describe, expect, test } from "vitest";
import { inicialDe } from "./avatar-helpers";

describe("inicialDe", () => {
  test("devuelve la primera letra en mayúscula", () => {
    expect(inicialDe("Halcones")).toBe("H");
  });

  test("convierte a mayúscula una primera letra minúscula", () => {
    expect(inicialDe("águilas")).toBe("Á");
  });

  test("ignora espacios en blanco al inicio", () => {
    expect(inicialDe("  Rayadas")).toBe("R");
  });

  test("devuelve '?' cuando el nombre está vacío", () => {
    expect(inicialDe("")).toBe("?");
  });

  test("devuelve '?' cuando el nombre es solo espacios", () => {
    expect(inicialDe("   ")).toBe("?");
  });
});
