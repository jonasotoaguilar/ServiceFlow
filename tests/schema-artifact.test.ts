import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function load() {
	const raw = fs.readFileSync(path.join(process.cwd(), "pocketbase/v1.collections.json"), "utf8");
	const json = JSON.parse(raw);
	const cols = Array.isArray(json) ? json : (json.collections ?? json.data ?? []);
	return { raw, json, cols };
}
describe("schema artifact", () => {
	it("declares four collections", () => {
		const { cols } = load();
		const names = cols.map((c: any) => c.name);
		expect(names).toEqual(
			expect.arrayContaining(["users", "services", "locations", "service_events"]),
		);
		expect(names).toHaveLength(4);
	});
	it("locations.address optional", () => {
		const { cols } = load();
		const loc = cols.find((c: any) => c.name === "locations");
		const addr = (loc.fields ?? loc.schema ?? []).find((f: any) => f.name === "address");
		expect(addr).toBeDefined();
		expect(addr.required).toBe(false);
	});
	it("service_events.userId required", () => {
		const { cols } = load();
		const ll = cols.find((c: any) => c.name === "service_events");
		const f = (ll.fields ?? ll.schema ?? []).find((x: any) => x.name === "userId");
		expect(f.required).toBe(true);
	});
	it("tenant rule string on business collections", () => {
		const { cols } = load();
		for (const n of ["services", "locations", "service_events"]) {
			const c = cols.find((x: any) => x.name === n);
			const rules = [c.listRule, c.viewRule, c.createRule, c.updateRule, c.deleteRule];
			for (const r of rules) expect(r).toBe("userId = @request.auth.id");
		}
	});
	it("users create public and list/delete locked", () => {
		const { cols } = load();
		const u = cols.find((c: any) => c.name === "users");
		expect(u.createRule).toBe("");
		expect(u.listRule).toBe(null);
		expect(u.deleteRule).toBe(null);
		expect(u.viewRule).toBe("id = @request.auth.id");
		expect(u.updateRule).toBe("id = @request.auth.id");
	});
	it("creates no business rows", () => {
		const { raw, cols } = load();
		expect(raw).not.toContain('"rows"');
		for (const c of cols) expect(c.rows ?? c.records ?? c.data).toBeUndefined();
	});
	it("has required field names", () => {
		const { cols } = load();
		const svc = cols.find((c: any) => c.name === "services");
		const sfields = (svc.fields ?? svc.schema ?? []).map((f: any) => f.name);
		for (const req of ["userId", "clientName", "product", "locationId", "entryDate"])
			expect(sfields).toContain(req);
		const loc = cols.find((c: any) => c.name === "locations");
		const lfields = (loc.fields ?? loc.schema ?? []).map((f: any) => f.name);
		for (const req of ["name", "userId", "isActive", "createdAt", "updatedAt"])
			expect(lfields).toContain(req);
		const ll = cols.find((c: any) => c.name === "service_events");
		const llfields = (ll.fields ?? ll.schema ?? []).map((f: any) => f.name);
		for (const req of ["userId", "ServiceId", "fromLocationId", "toLocationId", "changedAt"])
			expect(llfields).toContain(req);
	});
	it("indexes are PocketBase CREATE INDEX statements covering required fields", () => {
		const { cols } = load();
		const required: Record<string, string[]> = {
			locations: ["userId", "name"],
			services: ["userId", "status", "locationId", "clientName", "invoiceNumber", "rut"],
			service_events: ["userId", "ServiceId", "fromLocationId", "toLocationId"],
		};
		for (const [colName, fields] of Object.entries(required)) {
			const col = cols.find((c: any) => c.name === colName);
			expect(col).toBeDefined();
			const indexes: string[] = col.indexes ?? [];
			expect(indexes.length).toBeGreaterThan(0);
			for (const idx of indexes) {
				expect(idx).toMatch(
					/^CREATE\s+(UNIQUE\s+)?INDEX\s+\S+\s+ON\s+\S+\s*\(.*\)(\s+WHERE.*)?\s*$/i,
				);
			}
			for (const field of fields) {
				const covers = indexes.some(
					(idx: string) =>
						idx.includes(`(${field})`) ||
						idx.includes(`(${field},`) ||
						idx.includes(`, ${field})`) ||
						idx.includes(`, ${field},`) ||
						new RegExp(`\\b${field}\\b`).test(idx),
				);
				expect(covers).toBe(true);
			}
		}
	});
	it("no simple-name index remains", () => {
		const { cols, raw } = load();
		const allIndexes: string[] = cols.flatMap((c: any) => c.indexes ?? []);
		for (const idx of allIndexes) {
			expect(idx).not.toMatch(/^[A-Za-z0-9_]+$/);
			expect(idx).toMatch(/^CREATE\s+/i);
		}
		expect(raw).toContain("CREATE INDEX");
	});
	it("service_events optional idempotency fields", () => {
		const { cols } = load();
		const se = cols.find((c: any) => c.name === "service_events");
		const svc = cols.find((c: any) => c.name === "services");
		const op = (se.fields ?? []).find((x: any) => x.name === "operationKey");
		const seq = (se.fields ?? []).find((x: any) => x.name === "lifecycleSeq");
		const svcSeq = (svc.fields ?? []).find((x: any) => x.name === "lifecycleSeq");
		expect(op).toBeDefined(); expect(op.type).toBe("text"); expect(op.required).toBe(false); expect(op.max).toBe(64);
		expect(seq).toBeDefined(); expect(seq.type).toBe("number"); expect(seq.required).toBe(false);
		expect(svcSeq).toBeDefined(); expect(svcSeq.type).toBe("number"); expect(svcSeq.required).toBe(false);
		const kind = (se.fields ?? []).find((x: any) => x.name === "kind");
		expect(kind.required).toBe(false);
	});
	it("service_events unique composite indexes", () => {
		const { cols } = load();
		const se = cols.find((c: any) => c.name === "service_events");
		const idx: string[] = se.indexes ?? [];
		expect(idx).toContain("CREATE UNIQUE INDEX idx_service_events_ServiceId_operationKey ON service_events (ServiceId, operationKey) WHERE operationKey != ''");
		expect(idx).toContain("CREATE UNIQUE INDEX idx_service_events_ServiceId_lifecycleSeq ON service_events (ServiceId, lifecycleSeq) WHERE lifecycleSeq != 0");
		expect(idx).not.toContain("CREATE UNIQUE INDEX idx_service_events_ServiceId_operationKey ON service_events (ServiceId, operationKey)");
		expect(idx).not.toContain("CREATE UNIQUE INDEX idx_service_events_ServiceId_lifecycleSeq ON service_events (ServiceId, lifecycleSeq)");
		expect(se.id).toBe("pbc_2579451501");
		expect(cols.find((c:any)=>c.name==="services").id).toBe("pbc_863811952");
	});
	it("additive preserves existing indexes and no rows", () => {
		const { raw, cols } = load();
		expect(cols).toHaveLength(4); expect(raw).not.toContain('"rows"');
		const idx: string[] = cols.find((c:any)=>c.name==="service_events").indexes ?? [];
		expect(idx).toContain("CREATE INDEX idx_service_events_userId ON service_events (userId)");
		expect(idx).toContain("CREATE INDEX idx_service_events_ServiceId ON service_events (ServiceId)");
	});
});
