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
		const r = serviceListBinding({
			userId: "u1",
			status: ["pending", "invalid", "completed"] as any,
		});
		expect(Object.values(r.params)).toContain("pending");
		expect(Object.values(r.params)).toContain("completed");
		expect(Object.values(r.params)).not.toContain("invalid");
		expect(r.filter).not.toContain("invalid");
		expect(r.filter).toContain("status =");
	});
	it("compose search + status + location", async () => {
		const { serviceListBinding } = await import("../lib/pocketbase-filter");
		const r = serviceListBinding({
			userId: "u1",
			search: "foo",
			status: ["ready"],
			locationId: "loc1",
		});
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
		const r = serviceEventListBinding({
			userId: "u1",
			locationId: "l1",
			startDate: "2024-01-01",
			endDate: "2024-12-31",
		});
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
	it("service event operationKey reconciliation binding uses placeholders no interpolation", async () => {
		const { serviceEventOperationKeyBinding } = await import("../lib/pocketbase-filter");
		const r = serviceEventOperationKeyBinding({
			userId: "u1",
			serviceId: "s1",
			operationKey: "op_abc-123_XYZ",
		});
		expect(r.filter).toBe("userId = {:uid} && ServiceId = {:sid} && operationKey = {:key}");
		expect(r.params.uid).toBe("u1");
		expect(r.params.sid).toBe("s1");
		expect(r.params.key).toBe("op_abc-123_XYZ");
	});
	it("operationKey metacharacters do not change template", async () => {
		const { serviceEventOperationKeyBinding } = await import("../lib/pocketbase-filter");
		const a = serviceEventOperationKeyBinding({
			userId: "u1",
			serviceId: "s1",
			operationKey: "normalKey_123",
		});
		const b = serviceEventOperationKeyBinding({
			userId: "u1",
			serviceId: "s1",
			operationKey: 'a" || b || c',
		});
		expect(a.filter).toBe(b.filter);
		expect(a.filter).toBe("userId = {:uid} && ServiceId = {:sid} && operationKey = {:key}");
		expect(b.params.key).toBe('a" || b || c');
	});
	it("operationKey binding is pure and triangulates different inputs", async () => {
		const { serviceEventOperationKeyBinding } = await import("../lib/pocketbase-filter");
		const r1 = serviceEventOperationKeyBinding({
			userId: "alice",
			serviceId: "svc1",
			operationKey: "key_one",
		});
		const r2 = serviceEventOperationKeyBinding({
			userId: "bob",
			serviceId: "svc2",
			operationKey: "key_two",
		});
		expect(r1.filter).toBe(r2.filter);
		expect(r1.params.uid).toBe("alice");
		expect(r2.params.uid).toBe("bob");
		expect(r1.params.sid).toBe("svc1");
		expect(r2.params.sid).toBe("svc2");
		expect(r1.params.key).toBe("key_one");
		expect(r2.params.key).toBe("key_two");
	});

	describe("RUT search normalization — Unit 6 RED 6.1 (pocketbase-filter)", () => {
		it("RUT-shaped search binds separate {:rutSearch} normalized and keeps raw for name/invoice", async () => {
			const { serviceListBinding } = await import("../lib/pocketbase-filter");
			const raw = "20.884.087-K";
			const r = serviceListBinding({ userId: "u1", search: raw });
			expect(r.filter).toContain("clientName ~ {:search}");
			expect(r.filter).toContain("invoiceNumber ~ {:search}");
			expect(r.filter).toContain("rut ~ {:rutSearch}");
			expect(r.filter).not.toContain("rut ~ {:search}");
			expect(r.params.search).toBe(raw);
			expect(r.params.rutSearch).toBe("20884087K");
			// All values bound, never interpolated into filter string
			expect(r.filter).not.toContain(raw);
			expect(r.filter).not.toContain("20884087");
		});

		it("RUT-shaped variants normalize equivalently and share filter template", async () => {
			const { serviceListBinding } = await import("../lib/pocketbase-filter");
			const a = serviceListBinding({ userId: "u1", search: "20.884.087-K" });
			const b = serviceListBinding({ userId: "u1", search: "20884087-k" });
			const c = serviceListBinding({ userId: "u1", search: "20884087k" });
			const d = serviceListBinding({ userId: "u1", search: " 20.884.087 - K " });
			expect(a.params.rutSearch).toBe("20884087K");
			expect(b.params.rutSearch).toBe("20884087K");
			expect(c.params.rutSearch).toBe("20884087K");
			expect(d.params.rutSearch).toBe("20884087K");
			expect(a.filter).toBe(b.filter);
			expect(b.filter).toBe(c.filter);
			expect(c.filter).toBe(d.filter);
			// valid RUT also equivalence
			const e = serviceListBinding({ userId: "u1", search: "12.345.678-5" });
			const f = serviceListBinding({ userId: "u1", search: "123456785" });
			expect(e.params.rutSearch).toBe("123456785");
			expect(f.params.rutSearch).toBe("123456785");
			expect(e.filter).toBe(f.filter);
		});

		it("non-RUT-shaped text stays raw name/invoice search without rutSearch", async () => {
			const { serviceListBinding } = await import("../lib/pocketbase-filter");
			const r = serviceListBinding({ userId: "u1", search: "20Ab" });
			expect(r.filter).toContain("clientName ~ {:search}");
			expect(r.filter).toContain("invoiceNumber ~ {:search}");
			expect(r.filter).toContain("rut ~ {:search}");
			expect(r.filter).not.toContain("{:rutSearch}");
			expect(r.params.search).toBe("20Ab");
			expect((r.params as any).rutSearch).toBeUndefined();
			const r2 = serviceListBinding({ userId: "u1", search: "Juan Perez" });
			expect(r2.filter).not.toContain("{:rutSearch}");
			expect(r2.params.search).toBe("Juan Perez");
		});

		it("empty search is unfiltered", async () => {
			const { serviceListBinding } = await import("../lib/pocketbase-filter");
			const empty = serviceListBinding({ userId: "u1", search: "" });
			expect(empty.filter).not.toContain("clientName ~");
			expect(empty.filter).not.toContain("rut ~");
			expect(empty.params.search).toBeUndefined();
			expect((empty.params as any).rutSearch).toBeUndefined();
			const undef = serviceListBinding({ userId: "u1" });
			expect(undef.filter).not.toContain("clientName ~");
			expect((undef.params as any).rutSearch).toBeUndefined();
			const wsp = serviceListBinding({ userId: "u1", search: "   " });
			// whitespace-only treated as RUT-shaped? stripped empty → not RUT-shaped, stays raw but whitespace still bound raw? empty after? The spec says empty remains unfiltered only for truly empty; whitespace raw is still a search term but not RUT-shaped
			// For whitespace-only, filter should still contain search (raw) but not rutSearch, unless we treat empty as unfiltered. The current contract reserves unfiltered only for zero-length; whitespace-only is raw search (non-RUT)
			// So we assert it does not create rutSearch
			expect((wsp.params as any).rutSearch).toBeUndefined();
		});

		it("search + status + location compose with RUT-shaped binding", async () => {
			const { serviceListBinding } = await import("../lib/pocketbase-filter");
			const r = serviceListBinding({
				userId: "u1",
				search: "20.884.087-K",
				status: ["ready"],
				locationId: "loc1",
			});
			expect(r.filter).toContain("userId = {:uid}");
			expect(r.filter).toContain("clientName ~ {:search}");
			expect(r.filter).toContain("rut ~ {:rutSearch}");
			expect(r.filter).toContain("status =");
			expect(r.filter).toContain("locationId = {:locationId}");
			expect(r.params.uid).toBe("u1");
			expect(r.params.search).toBe("20.884.087-K");
			expect(r.params.rutSearch).toBe("20884087K");
			expect(r.params.locationId).toBe("loc1");
		});

		it("RUT search metacharacters do not change template — bound only", async () => {
			const { serviceListBinding } = await import("../lib/pocketbase-filter");
			const a = serviceListBinding({ userId: "u1", search: "20.884.087-K" });
			const b = serviceListBinding({ userId: "u1", search: '20.884.087-K" || userId != "" || "' });
			// Filter template is same for any RUT-shaped input (since both are RUT-shaped via stripped digits)
			// But injection payload contains letters, so may not be RUT-shaped; still filter must not contain raw
			expect(a.filter).not.toContain("20.884");
			expect(a.filter).not.toContain('" ||');
			expect(b.filter).not.toContain('" ||');
			expect(b.params.search).toBe('20.884.087-K" || userId != "" || "');
			// If b stripped contains non-RUT chars, it stays raw rut ~ {:search}, but still no interpolation
			// Ensure no raw appears in filter
			expect(b.filter).not.toContain("userId !=");
		});

		it("preserves status allowlist and pagination contract", async () => {
			const { serviceListBinding } = await import("../lib/pocketbase-filter");
			const r = serviceListBinding({
				userId: "u1",
				search: "20884087k",
				status: ["pending", "invalid", "completed"] as any,
			});
			expect(Object.values(r.params)).toContain("pending");
			expect(Object.values(r.params)).toContain("completed");
			expect(Object.values(r.params)).not.toContain("invalid");
			expect(r.filter).not.toContain("invalid");
			expect(r.filter).toContain("status =");
			expect(r.filter).toContain("rut ~ {:rutSearch}");
		});
	});
});
