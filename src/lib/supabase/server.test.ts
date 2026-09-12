import { afterEach, describe, expect, it, vi } from "vitest";

const cookieStoreMock = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ mocked: true })),
}));

import { createServerClient } from "@supabase/ssr";
import { createClient } from "./server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("createClient (server)", () => {
  it("calls createServerClient with the configured Supabase URL and anon key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );
  });
});
