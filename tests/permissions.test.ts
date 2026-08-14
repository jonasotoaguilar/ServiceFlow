import { describe, it, expect, vi } from "vitest";
import type { Models } from "node-appwrite";

const { mockClientCtor, mockDatabasesCtor } = vi.hoisted(() => ({
  mockClientCtor: vi.fn(),
  mockDatabasesCtor: vi.fn(),
}));

vi.mock("node-appwrite", () => ({
  Client: mockClientCtor,
  Databases: mockDatabasesCtor,
}));

import {
  buildMigrationPlan,
  processCollections,
} from "../scripts/migrate-appwrite-permissions";

function col(
  overrides: Partial<Models.Collection> = {},
): Models.Collection {
  return {
    $id: "test",
    $createdAt: "2024-01-01T00:00:00.000Z",
    $updatedAt: "2024-01-01T00:00:00.000Z",
    $permissions: [],
    databaseId: "serviceflow-db",
    name: "Test",
    enabled: true,
    documentSecurity: false,
    attributes: [],
    indexes: [],
    ...overrides,
  };
}

describe("import side-effects", () => {
  it("does not construct Client or Databases on import", () => {
    expect(mockClientCtor).not.toHaveBeenCalled();
    expect(mockDatabasesCtor).not.toHaveBeenCalled();
  });
});

describe("buildMigrationPlan", () => {
  it("preserves documentSecurity from live collection", () => {
    const collections = [
      col({
        $id: "Services",
        name: "Services",
        $permissions: ['read("any")'],
        documentSecurity: true,
      }),
    ];
    const plan = buildMigrationPlan(collections);
    expect(plan[0].documentSecurity).toBe(true);
  });

  it("preserves enabled from live collection", () => {
    const collections = [
      col({
        $id: "Services",
        name: "Services",
        $permissions: ['read("any")'],
        enabled: false,
      }),
    ];
    const plan = buildMigrationPlan(collections);
    expect(plan[0].enabled).toBe(false);
  });

  it("target permissions are always empty", () => {
    const collections = [
      col({ $permissions: ['read("any")', 'write("any")'] }),
    ];
    const plan = buildMigrationPlan(collections);
    expect(plan[0].targetPermissions).toEqual([]);
  });

  it("marks collection needing update when permissions are non-empty", () => {
    const collections = [
      col({
        $id: "Services",
        $permissions: ['read("any")'],
      }),
    ];
    const plan = buildMigrationPlan(collections);
    expect(plan[0].needsUpdate).toBe(true);
  });

  it("marks collection compliant when permissions are already empty", () => {
    const collections = [
      col({
        $id: "locations",
        name: "Locations",
        $permissions: [],
      }),
    ];
    const plan = buildMigrationPlan(collections);
    expect(plan[0].needsUpdate).toBe(false);
  });

  it("handles multiple collections with mixed states", () => {
    const collections = [
      col({ $id: "Services", $permissions: ['read("any")'] }),
      col({ $id: "locations", $permissions: [] }),
      col({
        $id: "location-logs",
        $permissions: [
          'read("any")',
          'write("any")',
          'update("any")',
          'delete("any")',
        ],
      }),
    ];
    const plan = buildMigrationPlan(collections);
    expect(plan[0].needsUpdate).toBe(true);
    expect(plan[1].needsUpdate).toBe(false);
    expect(plan[2].needsUpdate).toBe(true);
  });
});

describe("processCollections", () => {
  function apiError(code: number, message: string): Error {
    return Object.assign(new Error(message), {
      code,
      type: "database_collection_not_found",
    });
  }

  function mockDb(overrides?: {
    getCollection?: typeof vi.fn;
    updateCollection?: typeof vi.fn;
  }) {
    return {
      getCollection: overrides?.getCollection ?? vi.fn(),
      updateCollection: overrides?.updateCollection ?? vi.fn(),
    } as any;
  }

  it("dry-run never calls updateCollection", async () => {
    const getCollection = vi.fn().mockResolvedValue(
      col({
        $id: "Services",
        $permissions: ['read("any")'],
      }),
    );
    const updateCollection = vi.fn();
    const databases = mockDb({ getCollection, updateCollection });
    const results = await processCollections(databases, true);
    expect(updateCollection).not.toHaveBeenCalled();
    expect(results.some((r) => r.status === "applied")).toBe(false);
  });

  it("apply passes permissions=[] and original documentSecurity", async () => {
    const getCollection = vi.fn().mockImplementation(
      async (_dbId: string, colId: string) =>
        col({
          $id: colId,
          name: colId,
          $permissions: ['read("any")'],
          documentSecurity: true,
          enabled: true,
        }),
    );
    const updateCollection = vi.fn();
    const databases = mockDb({ getCollection, updateCollection });
    const results = await processCollections(databases, false);
    const applied = results.filter((r) => r.status === "applied");
    expect(applied.length).toBeGreaterThan(0);
    for (const call of updateCollection.mock.calls) {
      expect(call[3]).toEqual([]);
      expect(call[4]).toBe(true);
      expect(call[5]).toBe(true);
    }
  });

  it("continues on partial failure and reports failure", async () => {
    let callIndex = 0;
    const getCollection = vi.fn().mockImplementation(
      async (_dbId: string, colId: string) =>
        col({
          $id: colId,
          $permissions: ['read("any")'],
        }),
    );
    const updateCollection = vi.fn().mockImplementation(async () => {
      callIndex++;
      if (callIndex === 2) throw new Error("Simulated failure");
    });
    const databases = mockDb({ getCollection, updateCollection });
    const results = await processCollections(databases, false);
    expect(results).toHaveLength(3);
    const failed = results.filter((r) => r.status === "failed");
    expect(failed).toHaveLength(1);
    expect(failed[0].error).toContain("Simulated failure");
    expect(updateCollection).toHaveBeenCalledTimes(3);
  });

  it("reports skipped for already-compliant collections", async () => {
    const getCollection = vi.fn().mockImplementation(
      async (_dbId: string, colId: string) =>
        col({
          $id: colId,
          $permissions: [],
        }),
    );
    const updateCollection = vi.fn();
    const databases = mockDb({ getCollection, updateCollection });
    const results = await processCollections(databases, false);
    const skipped = results.filter((r) => r.status === "skipped");
    expect(skipped).toHaveLength(3);
    expect(updateCollection).not.toHaveBeenCalled();
  });

  it("skips without failed results when getCollection 404s for every collection", async () => {
    const getCollection = vi
      .fn()
      .mockRejectedValue(
        apiError(404, "Collection with the requested ID could not be found."),
      );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const databases = mockDb({ getCollection });
    const results = await processCollections(databases, false);
    const warnedNotFound = warn.mock.calls.flat().join(" ");
    warn.mockRestore();
    expect(results).toEqual([]);
    expect(warnedNotFound).toContain("not found, skipping");
  });

  it("reports failed results and never logs not-found when getCollection fails with non-404", async () => {
    const getCollection = vi
      .fn()
      .mockRejectedValue(apiError(401, "Unauthorized: invalid API key"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const databases = mockDb({ getCollection });
    const results = await processCollections(databases, false);
    const warnedNotFound = warn.mock.calls.flat().join(" ");
    warn.mockRestore();
    expect(results).toHaveLength(3);
    const failed = results.filter((r) => r.status === "failed");
    expect(failed).toHaveLength(3);
    expect(failed[0].id).toBe("Services");
    expect(failed[0].error).toContain("Unauthorized");
    expect(warnedNotFound).not.toContain("not found, skipping");
  });

  it("skips a 404 collection while failing a non-404 fetch in the same run", async () => {
    const getCollection = vi.fn().mockImplementation(
      async (_dbId: string, colId: string) => {
        if (colId === "Services") {
          throw apiError(404, "Collection with the requested ID could not be found.");
        }
        throw apiError(500, "Simulated server error");
      },
    );
    const databases = mockDb({ getCollection });
    const results = await processCollections(databases, false);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === "failed")).toBe(true);
    expect(results.map((r) => r.id).sort()).toEqual(["location-logs", "locations"]);
  });
});
