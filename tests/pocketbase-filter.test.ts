import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("pocketbase-filter", () => {
  it("search metacharacters do not change template", async () => {
    const { serviceListBinding } = await import("../lib/pocketbase-filter");
    const a = serviceListBinding({ userId: "u1", search: "normal" });
    const b = serviceListBinding({ userId: "u1", search: 'a" || b || c' });
    expect(a.filter).toBe(b.filter);
    expect(b.params.search).toBe('a" || b || c');
  });
  it("status allowlist", async () => {
    const { serviceListBinding } = await import("../lib/pocketbase-filter");
    const r = serviceListBinding({ userId: "u1", status: ["pending", "invalid", "completed"] as any });
    expect(Object.values(r.params)).toContain("pending");
    expect(Object.values(r.params)).toContain("completed");
    expect(Object.values(r.params)).not.toContain("invalid");
    expect(r.filter).not.toContain("invalid");
    expect(r.filter).toContain("status =");
  });
  it("compose search + status + location", async () => {
    const { serviceListBinding } = await import("../lib/pocketbase-filter");
    const r = serviceListBinding({ userId: "u1", search: "foo", status: ["ready"], locationId: "loc1" });
    expect(r.filter).toContain("userId = {:uid}");
    expect(r.filter).toContain("clientName ~ {:search}");
    expect(r.filter).toContain("status =");
    expect(r.filter).toContain("locationId = {:locationId}");
    expect(r.params.uid).toBe("u1");
  });
  it("onlyActive location binding", async () => {
    const { locationListBinding } = await import("../lib/pocketbase-filter");
    const all = locationListBinding({ userId: "u1", onlyActive: false });
    const active = locationListBinding({ userId: "u1", onlyActive: true });
    expect(all.filter).toContain("userId = {:uid}");
    expect(all.filter).not.toContain("isActive");
    expect(active.filter).toContain("isActive = true");
  });
  it("service event from/to and date bounds", async () => {
    const { serviceEventListBinding } = await import("../lib/pocketbase-filter");
    const r = serviceEventListBinding({ userId: "u1", locationId: "l1", startDate: "2024-01-01", endDate: "2024-12-31" });
    expect(r.filter).toContain("fromLocationId = {:lid} || toLocationId = {:lid}");
    expect(r.filter).toContain("changedAt >=");
    expect(r.params.lid).toBe("l1");
  });
  it("applyBinding is sole pb.filter site", () => {
    const f = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase-filter.ts"), "utf8");
    const matches = f.match(/pb\.filter/g) ?? [];
    expect(matches.length).toBe(1);
    expect(f).toContain("applyBinding");
  });
});
