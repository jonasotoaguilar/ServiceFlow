import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSave = vi.fn();
const mockCtor = vi.fn(function (this: any, url: string) {
  this.url = url;
  this.authStore = { save: mockSave, isValid: false, token: "", model: null };
});

vi.mock("pocketbase", () => ({ default: mockCtor }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";

describe("createPocketBaseClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.POCKETBASE_URL = "http://127.0.0.1:8090";
  });

  it("new instance per call", async () => {
    (cookies as any).mockResolvedValue({ get: () => undefined });
    const { createPocketBaseClient } = await import("../lib/pocketbase");
    const a = await createPocketBaseClient();
    const b = await createPocketBaseClient();
    expect(a).not.toBe(b);
    expect(mockCtor).toHaveBeenCalledTimes(2);
  });

  it("hydrates only pb_auth via save", async () => {
    const token = "tok123";
    const record = { id: "u1", email: "a@b.com" };
    (cookies as any).mockResolvedValue({
      get: (n: string) => (n === "pb_auth" ? { value: JSON.stringify({ token, record }) } : undefined),
    });
    const { createPocketBaseClient } = await import("../lib/pocketbase");
    await createPocketBaseClient();
    expect(mockSave).toHaveBeenCalledWith(token, record);
  });

  it("malformed pb_auth -> unauthenticated no throw", async () => {
    (cookies as any).mockResolvedValue({ get: () => ({ value: "not-json" }) });
    const { createPocketBaseClient } = await import("../lib/pocketbase");
    await expect(createPocketBaseClient()).resolves.toBeDefined();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("session-only -> unauthenticated", async () => {
    (cookies as any).mockResolvedValue({
      get: (n: string) => (n === "session" ? { value: "legacy" } : undefined),
    });
    const { createPocketBaseClient } = await import("../lib/pocketbase");
    await createPocketBaseClient();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("both cookies -> identity from pb_auth only", async () => {
    const token = "tok2";
    const record = { id: "u2" };
    (cookies as any).mockResolvedValue({
      get: (n: string) => {
        if (n === "pb_auth") return { value: JSON.stringify({ token, record }) };
        if (n === "session") return { value: "legacy" };
        return undefined;
      },
    });
    const { createPocketBaseClient } = await import("../lib/pocketbase");
    await createPocketBaseClient();
    expect(mockSave).toHaveBeenCalledWith(token, record);
  });

  it("missing URL fails closed without authenticated", async () => {
    delete process.env.POCKETBASE_URL;
    (cookies as any).mockResolvedValue({ get: () => undefined });
    const { createPocketBaseClient } = await import("../lib/pocketbase");
    await expect(createPocketBaseClient()).rejects.toThrow();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("uses getPocketBaseUrl and awaits cookies", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase.ts"), "utf8");
    expect(src).toContain("await cookies()");
    expect(src).toContain("getPocketBaseUrl");
    expect(src).not.toContain("loadFromCookie");
  });
});
