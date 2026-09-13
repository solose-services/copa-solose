import { describe, expect, it } from "vitest";
import { validateSuspensionForm } from "./suspension";

describe("validateSuspensionForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "jornada-1",
        motivo: "Roja directa",
      })
    ).toEqual({});
  });

  it("allows an empty motivo", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "jornada-1",
        motivo: "",
      })
    ).toEqual({});
  });

  it("requires jugadoraId", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "jornada-1",
        motivo: "",
      }).jugadoraId
    ).toBe("Selecciona a la jugadora.");
  });

  it("requires jornadaDesdeId", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "",
        jornadaHastaId: "jornada-1",
        motivo: "",
      }).jornadaDesdeId
    ).toBe("Selecciona la jornada de inicio.");
  });

  it("requires jornadaHastaId", () => {
    expect(
      validateSuspensionForm({
        jugadoraId: "jugadora-1",
        jornadaDesdeId: "jornada-1",
        jornadaHastaId: "",
        motivo: "",
      }).jornadaHastaId
    ).toBe("Selecciona la jornada final.");
  });
});
