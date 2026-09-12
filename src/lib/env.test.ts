import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseEnv } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabaseEnv", () => {
  it("returns url and anonKey when both are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});
