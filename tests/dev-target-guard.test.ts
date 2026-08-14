import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  parseArgs,
  assertDevTarget,
  DEV_ENDPOINT_ALLOWLIST,
} from "../scripts/dev-target-guard";

describe("DEV_ENDPOINT_ALLOWLIST", () => {
  it("contains only loopback hostnames", () => {
    expect(DEV_ENDPOINT_ALLOWLIST).toEqual([
      "localhost",
      "127.0.0.1",
      "::1",
    ]);
  });
});

describe("assertDevTarget", () => {
  const ORIGINAL_DEV_PROJECT_IDS = process.env.APPWRITE_DEV_PROJECT_IDS;

  afterEach(() => {
    if (ORIGINAL_DEV_PROJECT_IDS === undefined) {
      delete process.env.APPWRITE_DEV_PROJECT_IDS;
    } else {
      process.env.APPWRITE_DEV_PROJECT_IDS = ORIGINAL_DEV_PROJECT_IDS;
    }
  });

  it("accepts a loopback endpoint with an allowed project", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = "dev-project";
    expect(() =>
      assertDevTarget("http://localhost/v1", "dev-project"),
    ).not.toThrow();
  });

  it("accepts 127.0.0.1 and ::1 loopback endpoints", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = "dev-project";
    expect(() =>
      assertDevTarget("http://127.0.0.1/v1", "dev-project"),
    ).not.toThrow();
    expect(() =>
      assertDevTarget("http://[::1]:8080/v1", "dev-project"),
    ).not.toThrow();
  });

  it("accepts whitespace-padded entries in the project allowlist", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = " dev-project , shadow-dev ";
    expect(() =>
      assertDevTarget("http://localhost/v1", "dev-project"),
    ).not.toThrow();
  });

  it("rejects a production endpoint", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = "dev-project";
    expect(() =>
      assertDevTarget("https://cloud.appwrite.io/v1", "dev-project"),
    ).toThrow(/not on the development allowlist/);
  });

  it("rejects a malformed endpoint URL", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = "dev-project";
    expect(() =>
      assertDevTarget("cloud.appwrite.io/v1", "dev-project"),
    ).toThrow(/not a valid URL/);
  });

  it("rejects a missing endpoint", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = "dev-project";
    expect(() => assertDevTarget(undefined, "dev-project")).toThrow(
      /NEXT_PUBLIC_APPWRITE_ENDPOINT/,
    );
  });

  it("rejects a missing project identifier", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = "dev-project";
    expect(() => assertDevTarget("http://localhost/v1", undefined)).toThrow(
      /NEXT_PUBLIC_APPWRITE_PROJECT/,
    );
  });

  it("rejects when APPWRITE_DEV_PROJECT_IDS is unset", () => {
    delete process.env.APPWRITE_DEV_PROJECT_IDS;
    expect(() =>
      assertDevTarget("http://localhost/v1", "dev-project"),
    ).toThrow(/APPWRITE_DEV_PROJECT_IDS is not set/);
  });

  it("rejects a project outside the development allowlist", () => {
    process.env.APPWRITE_DEV_PROJECT_IDS = "dev-project";
    expect(() =>
      assertDevTarget("http://localhost/v1", "prod-project"),
    ).toThrow(/not in APPWRITE_DEV_PROJECT_IDS/);
  });
});

describe("parseArgs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to dryRun=true when no flags", () => {
    vi.spyOn(process, "argv", "get").mockReturnValue([
      "node",
      "script.ts",
    ]);
    expect(parseArgs().dryRun).toBe(true);
  });

  it("returns dryRun=false with --apply flag", () => {
    vi.spyOn(process, "argv", "get").mockReturnValue([
      "node",
      "script.ts",
      "--apply",
    ]);
    expect(parseArgs().dryRun).toBe(false);
  });

  it("returns dryRun=true with explicit --dry-run flag", () => {
    vi.spyOn(process, "argv", "get").mockReturnValue([
      "node",
      "script.ts",
      "--dry-run",
    ]);
    expect(parseArgs().dryRun).toBe(true);
  });

  it("throws on unknown flags instead of process.exit", () => {
    vi.spyOn(process, "argv", "get").mockReturnValue([
      "node",
      "script.ts",
      "--unknown",
    ]);
    expect(() => parseArgs()).toThrow(/Unknown/);
  });

  it("--apply alone does not confirm the run", () => {
    expect(parseArgs(["--apply"])).toEqual({
      dryRun: false,
      confirmed: false,
    });
  });

  it("--apply with --yes confirms the run", () => {
    expect(parseArgs(["--apply", "--yes"])).toEqual({
      dryRun: false,
      confirmed: true,
    });
  });

  it("--yes alone keeps the dry-run default", () => {
    expect(parseArgs(["--yes"])).toEqual({ dryRun: true, confirmed: true });
  });

  it("defaults to dry-run and unconfirmed with no flags", () => {
    expect(parseArgs([])).toEqual({ dryRun: true, confirmed: false });
  });

  it("throws on unknown flags passed through argv", () => {
    expect(() => parseArgs(["--yes", "--force"])).toThrow(/Unknown/);
  });
});
