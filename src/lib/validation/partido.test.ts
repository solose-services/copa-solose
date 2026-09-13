import { describe, expect, it } from "vitest";
import { validatePartidoForm } from "./partido";

describe("validatePartidoForm", () => {
  it("returns no errors for valid input", () => {
    expect(
      validatePartidoForm({
        equipoLocalId: "equipo-1",
        equipoVisitanteId: "equipo-2",
        fecha: "2026-03-01",
      })
    ).toEqual({});
  });

  it("requires equipoLocalId", () => {
    expect(
      validatePartidoForm({ equipoLocalId: "", equipoVisitanteId: "equipo-2", fecha: "2026-03-01" })
        .equipoLocalId
    ).toBe("Selecciona el equipo local.");
  });

  it("requires equipoVisitanteId", () => {
    expect(
      validatePartidoForm({ equipoLocalId: "equipo-1", equipoVisitanteId: "", fecha: "2026-03-01" })
        .equipoVisitanteId
    ).toBe("Selecciona el equipo visitante.");
  });

  it("rejects the same team as local and visitante", () => {
    expect(
      validatePartidoForm({
        equipoLocalId: "equipo-1",
        equipoVisitanteId: "equipo-1",
        fecha: "2026-03-01",
      }).equipoVisitanteId
    ).toBe("El equipo visitante debe ser distinto al local.");
  });

  it("requires a non-empty fecha", () => {
    expect(
      validatePartidoForm({ equipoLocalId: "equipo-1", equipoVisitanteId: "equipo-2", fecha: "" })
        .fecha
    ).toBe("La fecha es obligatoria.");
  });
});
