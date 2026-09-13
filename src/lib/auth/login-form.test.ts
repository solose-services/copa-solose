import { describe, expect, it } from "vitest";
import { validateLoginForm } from "./login-form";

describe("validateLoginForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateLoginForm({ email: "admin@solose.mx", password: "unaClave123" })
    ).toEqual({});
  });

  it("requires a non-empty email", () => {
    expect(
      validateLoginForm({ email: "", password: "unaClave123" }).email
    ).toBe("El correo es obligatorio.");
  });

  it("rejects an invalid email format", () => {
    expect(
      validateLoginForm({ email: "no-es-correo", password: "x" }).email
    ).toBe("Escribe un correo válido.");
  });

  it("requires a non-empty password", () => {
    expect(
      validateLoginForm({ email: "admin@solose.mx", password: "" }).password
    ).toBe("La contraseña es obligatoria.");
  });
});
