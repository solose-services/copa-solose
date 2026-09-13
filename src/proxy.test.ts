import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

vi.mock("@/lib/auth/is-admin-user", () => ({
  isAdminUser: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getSupabaseEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    anonKey: "test-anon-key",
  })),
}));

import { isAdminUser } from "@/lib/auth/is-admin-user";
import { proxy } from "./proxy";

afterEach(() => {
  vi.clearAllMocks();
});

function makeRequest(pathname: string) {
  return new NextRequest(new URL(`https://copasolose.example${pathname}`));
}

describe("proxy", () => {
  it("redirects an unauthenticated visitor away from a protected path", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await proxy(makeRequest("/admin/equipos"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("redirects an authenticated but non-admin visitor away from a protected path", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    vi.mocked(isAdminUser).mockResolvedValue(false);

    const response = await proxy(makeRequest("/admin/equipos"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("lets an authenticated admin through to a protected path", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    vi.mocked(isAdminUser).mockResolvedValue(true);

    const response = await proxy(makeRequest("/admin/equipos"));

    expect(response.status).toBe(200);
  });

  it("does not check admin membership for an unprotected path like /admin/login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await proxy(makeRequest("/admin/login"));

    expect(response.status).toBe(200);
    expect(isAdminUser).not.toHaveBeenCalled();
  });
});
