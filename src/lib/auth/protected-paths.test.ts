import { describe, expect, it } from "vitest";
import { shouldProtectPath } from "./protected-paths";

describe("shouldProtectPath", () => {
  it("protects /admin routes", () => {
    expect(shouldProtectPath("/admin")).toBe(true);
    expect(shouldProtectPath("/admin/equipos")).toBe(true);
  });

  it("does not protect the login page", () => {
    expect(shouldProtectPath("/admin/login")).toBe(false);
  });

  it("does not protect public routes", () => {
    expect(shouldProtectPath("/")).toBe(false);
    expect(shouldProtectPath("/calendario")).toBe(false);
  });
});
