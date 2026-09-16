import { describe, expect, it } from "vitest";
import { formatearHora, formatearFechaCorta } from "./fecha";

describe("formatearHora", () => {
  it("strips seconds", () => {
    expect(formatearHora("09:00:00")).toBe("9:00");
  });

  it("drops a leading zero on the hour", () => {
    expect(formatearHora("09:05:00")).toBe("9:05");
  });

  it("keeps a two-digit hour as-is", () => {
    expect(formatearHora("14:30:00")).toBe("14:30");
  });
});

describe("formatearFechaCorta", () => {
  it("formats a date as weekday + day + short month, in Spanish", () => {
    expect(formatearFechaCorta("2026-09-12")).toBe("sábado 12 sep");
  });

  it("does not shift the day backward near a timezone boundary", () => {
    expect(formatearFechaCorta("2026-01-01")).toBe("jueves 1 ene");
  });
});
