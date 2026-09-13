import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminUser } from "./is-admin-user";

function makeSupabaseMock(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn(async () => result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from } as unknown as SupabaseClient;
}

describe("isAdminUser", () => {
  it("returns true when a matching perfiles_admin row exists", async () => {
    const supabase = makeSupabaseMock({ data: { id: "user-1" }, error: null });
    await expect(isAdminUser(supabase, "user-1")).resolves.toBe(true);
  });

  it("returns false when no matching row exists", async () => {
    const supabase = makeSupabaseMock({ data: null, error: null });
    await expect(isAdminUser(supabase, "user-1")).resolves.toBe(false);
  });

  it("returns false when the query errors", async () => {
    const supabase = makeSupabaseMock({
      data: null,
      error: { message: "boom" },
    });
    await expect(isAdminUser(supabase, "user-1")).resolves.toBe(false);
  });
});
