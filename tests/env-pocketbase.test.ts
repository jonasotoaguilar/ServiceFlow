import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("getPocketBaseUrl", () => {
  const orig = process.env.POCKETBASE_URL;
  beforeEach(() => {
    delete process.env.POCKETBASE_URL;
  });
  afterEach(() => {
    if (orig === undefined) delete process.env.POCKETBASE_URL;
    else process.env.POCKETBASE_URL = orig;
  });

  it("throws when missing", async () => {
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(() => getPocketBaseUrl()).toThrow();
  });
  it("throws when empty", async () => {
    process.env.POCKETBASE_URL = "";
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(() => getPocketBaseUrl()).toThrow();
  });
  it("throws on whitespace only", async () => {
    process.env.POCKETBASE_URL = "   ";
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(() => getPocketBaseUrl()).toThrow();
  });
  it("throws on non-absolute", async () => {
    process.env.POCKETBASE_URL = "/relative";
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(() => getPocketBaseUrl()).toThrow();
  });
  it("throws on ftp:", async () => {
    process.env.POCKETBASE_URL = "ftp://example.com";
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(() => getPocketBaseUrl()).toThrow();
  });
  it("throws on invalid URL", async () => {
    process.env.POCKETBASE_URL = "not-a-url";
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(() => getPocketBaseUrl()).toThrow();
  });
  it("returns valid http url", async () => {
    process.env.POCKETBASE_URL = "http://127.0.0.1:8090";
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(getPocketBaseUrl()).toBe("http://127.0.0.1:8090");
  });
  it("returns valid https url", async () => {
    process.env.POCKETBASE_URL = "https://example.com";
    const { getPocketBaseUrl } = await import("../lib/env");
    expect(getPocketBaseUrl()).toBe("https://example.com");
  });
  it("does not read admin env names", () => {
    const f = fs.readFileSync(path.join(process.cwd(), "lib/env.ts"), "utf8");
    expect(f).not.toContain("POCKETBASE_ADMIN");
    expect(f).toContain("POCKETBASE_URL");
    expect(f).toContain("PocketBaseEnvSchema");
  });
});
