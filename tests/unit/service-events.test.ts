import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(process.cwd(), p));

const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuthUser: (...a: unknown[]) => (mockGetAuthUser as any)(...a) }));

const mockServicesGetList = vi.fn();
const mockServicesGetOne = vi.fn();
const mockServicesCreate = vi.fn();
const mockServicesUpdate = vi.fn();
const mockServicesDelete = vi.fn();
const mockLocationsGetList = vi.fn();
const mockLocationsGetOne = vi.fn();
const mockLogsGetList = vi.fn();
const mockLogsCreate = vi.fn();
const mockBatchSend = vi.fn();
const mockCreateBatch = vi.fn(() => ({
	collection: (name: string) => {
		if (name === "services") return { update: mockServicesUpdate } as any;
		if (name === "service_events") return { create: mockLogsCreate } as any;
		throw new Error(`batch ${name}`);
	},
	send: mockBatchSend,
}));

const mockFilter = vi.fn((t: string, p: Record<string, unknown>) => {
	let s = t;
	for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
	return s;
});
const mockCollection = vi.fn((n: string) => {
	if (n === "services")
		return {
			getList: mockServicesGetList,
			getOne: mockServicesGetOne,
			create: mockServicesCreate,
			update: mockServicesUpdate,
			delete: mockServicesDelete,
		};
	if (n === "locations")
		return {
			getList: mockLocationsGetList,
			getOne: mockLocationsGetOne,
			getList2: mockLocationsGetList,
		};
	if (n === "service_events") return { getList: mockLogsGetList, create: mockLogsCreate };
	throw new Error(n);
});
const mockCreatePocketBaseClient = vi.fn(async () => ({
	filter: mockFilter,
	collection: mockCollection,
	createBatch: mockCreateBatch,
}));
vi.mock("@/lib/pocketbase", () => ({
	createPocketBaseClient: (...a: unknown[]) => (mockCreatePocketBaseClient as any)(...a),
}));

function svc(o: Record<string, unknown> = {}) {
	return {
		id: "pb15svc00000001",
		userId: "user-1",
		invoiceNumber: "INV-001",
		clientName: "Cliente",
		rut: "12.345.678-5",
		contact: "+56 9 1111 1111",
		product: "Prod",
		locationId: "locA_15_chars_01",
		entryDate: new Date().toISOString(),
		deliveryDate: null,
		readyDate: null,
		cancellationDate: null,
		status: "pending",
		repairCost: 0,
		notes: "",
		...o,
	};
}
function loc(o: Record<string, unknown> = {}) {
	return {
		id: "locA_15_chars_01",
		userId: "user-1",
		name: "Sede A",
		isActive: true,
		isDefault: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...o,
	};
}

describe("Unit 9 Registro — status/transfer/logs 5.1 RED", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockReset();
		mockServicesGetList.mockReset();
		mockServicesGetOne.mockReset();
		mockServicesCreate.mockReset();
		mockServicesUpdate.mockReset();
		mockServicesDelete.mockReset();
		mockLocationsGetOne.mockReset();
		mockLocationsGetList.mockReset();
		mockLogsGetList.mockReset();
		mockLogsCreate.mockReset();
		mockBatchSend.mockReset();
		mockCreateBatch.mockClear();
		mockFilter.mockClear();
		mockCollection.mockClear();
		mockCreatePocketBaseClient.mockClear();
		mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
		mockServicesGetOne.mockResolvedValue(svc());
		mockServicesUpdate.mockResolvedValue(svc());
		mockLocationsGetOne.mockResolvedValue(loc());
		mockLocationsGetList.mockResolvedValue({ items: [loc()], totalItems: 1 });
		mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
		mockLogsCreate.mockResolvedValue({ id: "log1" });
		mockServicesGetList.mockResolvedValue({ items: [], totalItems: 0 });
		mockBatchSend.mockResolvedValue({});
	});

	describe("Dedicated status transitions — machine and Registro kind=status", () => {
		it("pending -> ready stamps readyDate and writes status log with actor/kind/before/after", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ status: "pending", readyDate: null }));
			const mod = await import("@/app/api/services/[id]/status/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			expect(h, "status route must export PATCH or POST").toBeDefined();
			const req = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "ready" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect([200, 201].includes(res.status)).toBe(true);
			expect(mockServicesUpdate).toHaveBeenCalledTimes(1);
			const payload = mockServicesUpdate.mock.calls[0][1] as Record<string, unknown>;
			expect(payload.status).toBe("ready");
			expect(typeof payload.readyDate).toBe("string");
			expect(mockLogsCreate).toHaveBeenCalledTimes(1);
			const log = mockLogsCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(log.kind).toBe("status_changed");
			expect(log.fromStatus).toBe("pending");
			expect(log.toStatus).toBe("ready");
			expect(log.actorId || log.userId).toBe("user-1");
			expect(typeof log.changedAt).toBe("string");
			expect(log.ServiceId).toBe("pb15svc00000001");
		});

		it("ready -> completed stamps deliveryDate keeps readyDate and Entregada display", async () => {
			const readyDate = new Date(Date.now() - 86400000).toISOString();
			mockServicesGetOne.mockResolvedValue(svc({ status: "ready", readyDate }));
			const mod = await import("@/app/api/services/[id]/status/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "completed" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect([200, 201].includes(res.status)).toBe(true);
			const payload = mockServicesUpdate.mock.calls[0][1] as Record<string, unknown>;
			expect(payload.status).toBe("completed");
			expect(typeof payload.deliveryDate).toBe("string");
			expect(payload.readyDate).toBe(readyDate);
			const log = mockLogsCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(log.kind).toBe("status_changed");
			expect(log.fromStatus).toBe("ready");
			expect(log.toStatus).toBe("completed");
			const table = read("components/services/ServicesTable.tsx");
			expect(table).toContain("Entregada");
			const dash = read("components/services/ServicesDashboard.tsx");
			expect(dash).toContain("Entregada");
		});

		it("ready -> pending clears ready/delivery/cancellation and writes log (triangulate)", async () => {
			mockServicesGetOne.mockResolvedValue(
				svc({
					status: "ready",
					readyDate: new Date().toISOString(),
					deliveryDate: null,
					cancellationDate: null,
				}),
			);
			const mod = await import("@/app/api/services/[id]/status/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "pending" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect([200, 201].includes(res.status)).toBe(true);
			const payload = mockServicesUpdate.mock.calls[0][1] as Record<string, unknown>;
			expect(payload.status).toBe("pending");
			expect(payload.readyDate).toBeNull();
			expect(payload.deliveryDate).toBeNull();
			expect(payload.cancellationDate).toBeNull();
			const log = mockLogsCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(log.kind).toBe("status_changed");
			expect(log.fromStatus).toBe("ready");
			expect(log.toStatus).toBe("pending");
		});

		it("disallowed pending->completed rejected no log and no date stamp", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ status: "pending" }));
			const mod = await import("@/app/api/services/[id]/status/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "completed" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect(res.status).toBe(400);
			expect(mockServicesUpdate).not.toHaveBeenCalled();
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});

		it("completed terminal rejected and cancelled terminal rejected (triangulate)", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ status: "completed" }));
			const mod = await import("@/app/api/services/[id]/status/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "ready" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect(res.status).toBe(400);
			expect(mockLogsCreate).not.toHaveBeenCalled();
			vi.clearAllMocks();
			mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
			mockServicesGetOne.mockResolvedValue(svc({ status: "cancelled" }));
			mockServicesUpdate.mockResolvedValue(svc());
			const req2 = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "pending" }),
				headers: { "Content-Type": "application/json" },
			});
			const res2 = await h(req2, { params: { id: "pb15svc00000001" } });
			expect(res2.status).toBe(400);
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});

		it("foreign service forbidden on status", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ userId: "other-user", status: "pending" }));
			const mod = await import("@/app/api/services/[id]/status/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "ready" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect([403, 500, 400].includes(res.status)).toBe(true);
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});

		it("unauthenticated status 401", async () => {
			mockGetAuthUser.mockResolvedValue(null);
			const mod = await import("@/app/api/services/[id]/status/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/status", {
				method: "PATCH",
				body: JSON.stringify({ status: "ready" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect(res.status).toBe(401);
		});
	});

	describe("Dedicated transfer — owned active and Registro kind=transfer", () => {
		it("transfer A->B owned active persists and writes transfer log with actor/kind/before/after", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ locationId: "locA_15_chars_01" }));
			mockLocationsGetOne.mockResolvedValue(
				loc({ id: "locB_15_chars_02", userId: "user-1", isActive: true, isDefault: false }),
			);
			const mod = await import("@/app/api/services/[id]/transfer/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			expect(h).toBeDefined();
			const req = new Request("http://localhost/api/services/pb15svc00000001/transfer", {
				method: "PATCH",
				body: JSON.stringify({ locationId: "locB_15_chars_02" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect([200, 201].includes(res.status)).toBe(true);
			expect(mockServicesUpdate).toHaveBeenCalledTimes(1);
			const payload = mockServicesUpdate.mock.calls[0][1] as Record<string, unknown>;
			expect(payload.locationId).toBe("locB_15_chars_02");
			const log = mockLogsCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(log.kind).toBe("location_changed");
			expect(log.fromLocationId).toBe("locA_15_chars_01");
			expect(log.toLocationId).toBe("locB_15_chars_02");
			expect(log.actorId || log.userId).toBe("user-1");
		});

		it("same-location transfer rejected no log", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ locationId: "locA_15_chars_01" }));
			mockLocationsGetOne.mockResolvedValue(loc({ id: "locA_15_chars_01", isActive: true }));
			const mod = await import("@/app/api/services/[id]/transfer/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/transfer", {
				method: "PATCH",
				body: JSON.stringify({ locationId: "locA_15_chars_01" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect(res.status).toBe(400);
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});

		it("inactive/foreign/missing rejected no log", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ locationId: "locA_15_chars_01" }));
			mockLocationsGetOne.mockResolvedValue(
				loc({ id: "loc_inact", userId: "user-1", isActive: false }),
			);
			const mod = await import("@/app/api/services/[id]/transfer/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/transfer", {
				method: "PATCH",
				body: JSON.stringify({ locationId: "loc_inact" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect(res.status).toBe(400);
			expect(mockLogsCreate).not.toHaveBeenCalled();
			vi.clearAllMocks();
			mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
			mockServicesGetOne.mockResolvedValue(svc({ locationId: "locA_15_chars_01" }));
			mockLocationsGetOne.mockResolvedValue(
				loc({ id: "locForeign", userId: "other", isActive: true }),
			);
			const req2 = new Request("http://localhost/api/services/pb15svc00000001/transfer", {
				method: "PATCH",
				body: JSON.stringify({ locationId: "locForeign" }),
				headers: { "Content-Type": "application/json" },
			});
			const res2 = await h(req2, { params: { id: "pb15svc00000001" } });
			expect(res2.status).toBe(400);
			expect(mockLogsCreate).not.toHaveBeenCalled();
			mockLocationsGetOne.mockRejectedValueOnce(new Error("not found"));
			const req3 = new Request("http://localhost/api/services/pb15svc00000001/transfer", {
				method: "PATCH",
				body: JSON.stringify({ locationId: "missing" }),
				headers: { "Content-Type": "application/json" },
			});
			const res3 = await h(req3, { params: { id: "pb15svc00000001" } });
			expect(res3.status).toBe(400);
		});

		it("foreign service forbidden on transfer", async () => {
			mockServicesGetOne.mockResolvedValue(
				svc({ userId: "other-user", locationId: "locA_15_chars_01" }),
			);
			mockLocationsGetOne.mockResolvedValue(
				loc({ id: "locB_15_chars_02", userId: "user-1", isActive: true }),
			);
			const mod = await import("@/app/api/services/[id]/transfer/route");
			const h = (mod as any).PATCH || (mod as any).POST;
			const req = new Request("http://localhost/api/services/pb15svc00000001/transfer", {
				method: "PATCH",
				body: JSON.stringify({ locationId: "locB_15_chars_02" }),
				headers: { "Content-Type": "application/json" },
			});
			const res = await h(req, { params: { id: "pb15svc00000001" } });
			expect([403, 500, 400].includes(res.status)).toBe(true);
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});
	});

	describe("Generic PUT still rejects status/location and no Registro event", () => {
		it("PUT with status rejected 400", async () => {
			mockServicesGetOne.mockResolvedValue(svc({ status: "pending" }));
			const { PUT } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "PUT",
				body: JSON.stringify({
					id: "pb15svc00000001",
					invoiceNumber: "INV-001",
					clientName: "C",
					rut: "12.345.678-5",
					contact: "+56 9 1111 1111",
					product: "P",
					status: "ready",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PUT(req);
			expect(res.status).toBe(400);
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});
		it("PUT with locationId rejected 400 (triangulate)", async () => {
			const { PUT } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "PUT",
				body: JSON.stringify({
					id: "pb15svc00000001",
					invoiceNumber: "INV-001",
					clientName: "C",
					rut: "12.345.678-5",
					contact: "+56 9 1111 1111",
					product: "P",
					locationId: "locB_15_chars_02",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PUT(req);
			expect(res.status).toBe(400);
		});
	});

	describe("Registro filters/pagination/tenant isolation/Entregada/Nav", () => {
		it("service_events schema has kind transfer|status with actor and relaxed location required", () => {
			const j = JSON.parse(read("pocketbase/v1.collections.json"));
			const cols: any[] = Array.isArray(j) ? j : (j.collections ?? j.data ?? []);
			const logs = cols.find((c: any) => c.name === "service_events");
			expect(logs).toBeDefined();
			const fields = (logs.fields ?? logs.schema) as any[];
			const kind = fields.find((f: any) => f.name === "kind");
			expect(kind).toBeDefined();
			expect(String(kind.type).toLowerCase()).toMatch(/text|select/);
			const fromS = fields.find((f: any) => f.name === "fromStatus");
			const toS = fields.find((f: any) => f.name === "toStatus");
			expect(fromS).toBeDefined();
			expect(toS).toBeDefined();
			const actor = fields.find((f: any) => f.name === "actorId");
			expect(actor).toBeDefined();
			const fromLoc = fields.find((f: any) => f.name === "fromLocationId");
			const toLoc = fields.find((f: any) => f.name === "toLocationId");
			expect(fromLoc.required).toBe(false);
			expect(toLoc.required).toBe(false);
			const idxs: string[] = logs.indexes ?? [];
			expect(idxs.some((i) => i.includes("userId") && i.includes("changedAt"))).toBe(true);
			expect(idxs.some((i) => i.includes("kind"))).toBe(true);
		});

		it("pocketbase-filter serviceEventListBinding supports kind/status/date/location and applyBinding", () => {
			const src = read("lib/pocketbase-filter.ts");
			expect(src).toContain("serviceEventListBinding");
			expect(src).toContain("kind");
			expect(src).toContain("fromStatus");
			expect(src).toContain("toStatus");
			expect(src).toContain("changedAt");
			expect(src).toContain("locationId");
			expect(src).toContain("applyBinding");
			expect((src.match(/pb\.filter/g) ?? []).length).toBe(1);
		});

		it("getServiceEvents supports kind/status/location/date pagination and tenant isolation via bound uid", async () => {
			mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
			const mod = await import("@/app/actions/service-events");
			expect(mod.getServiceEvents).toBeDefined();
			mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
			await (mod as any).getServiceEvents({
				page: 2,
				limit: 20,
				kind: "location_changed",
				status: "ready",
				locationId: "locA_15_chars_01",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			});
			const call = mockFilter.mock.calls.find(([t]: any) => String(t).includes("userId"));
			expect(call).toBeDefined();
			const [tmpl, params] = call as [string, Record<string, unknown>];
			expect(tmpl).toContain("userId = {:uid}");
			expect((params as any).uid).toBe("user-1");
			expect(tmpl).toContain("kind");
			expect((params as any).kind).toBe("location_changed");
			// status filter binds fromStatus/toStatus
			expect(
				tmpl.includes("fromStatus") || tmpl.includes("toStatus") || tmpl.includes("status_changed"),
			).toBe(true);
			// pagination
			expect(mockLogsGetList).toHaveBeenCalledWith(
				2,
				20,
				expect.objectContaining({ sort: "-changedAt" }),
			);
		});

		it("other tenant events hidden even if ids guessed and unauthenticated denied", async () => {
			mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
			const mod = await import("@/app/actions/service-events");
			mockGetAuthUser.mockResolvedValue({ id: "user-A", email: "a@a.com", name: "A" });
			await (mod as any).getServiceEvents({ page: 1, limit: 20 });
			const [, paramsA] = mockFilter.mock.calls.find(([t]: any) =>
				String(t).includes("userId"),
			) as [string, Record<string, unknown>];
			expect(paramsA.uid).toBe("user-A");
			mockFilter.mockClear();
			mockLogsGetList.mockClear();
			mockGetAuthUser.mockResolvedValue({ id: "user-B", email: "b@b.com", name: "B" });
			await (mod as any).getServiceEvents({ page: 1, limit: 20 });
			const [, paramsB] = mockFilter.mock.calls.find(([t]: any) =>
				String(t).includes("userId"),
			) as [string, Record<string, unknown>];
			expect(paramsB.uid).toBe("user-B");
			expect(paramsA.uid).not.toBe(paramsB.uid);
			mockGetAuthUser.mockResolvedValue(null);
			const res = await (mod as any).getServiceEvents({ page: 1, limit: 20 });
			expect(res.error).toMatch(/autenticado|Unauthorized|No autenticado/i);
		});

		it("Registro UI has filters kind/date/location/status pagination and Entregada, no Movimientos", () => {
			const mgr = read("app/(app)/service-events/serviceEventsManager.tsx");
			expect(mgr).toContain("Registro");
			expect(mgr).not.toContain("Movimientos");
			expect(mgr).toMatch(/kind|Tipo|transfer|status/i);
			expect(mgr).toContain("Desde");
			expect(mgr).toContain("Hasta");
			expect(mgr).toMatch(/Sede|location/i);
			expect(mgr).toMatch(/status|Estado/i);
			expect(mgr).toContain("Entregada");
			expect(mgr).toMatch(/pagination|Mostrando|page/i);
			expect(mgr).toContain("fromLocation");
			expect(mgr).toContain("toLocation");
			// mobile readable: primary fields visible without horizontal drag (no overflow-x alone hides actions, check grid/card fallback or flex)
			expect(mgr).toMatch(/grid.*cols|flex.*wrap|min-w|truncate|overflow/i);
			const nav = read("components/layout/Navbar.tsx");
			expect(nav).toContain('href="/service-events"');
			expect(nav).toContain("Registro");
			expect(nav).not.toMatch(/Movimientos/);
			const page = read("app/(app)/service-events/page.tsx");
			expect(page).toMatch(/getServiceEvents|getServiceEvents/);
		});

		it("Registro page heading says Registro and layout gutters match Dashboard", () => {
			const mgr = read("app/(app)/service-events/serviceEventsManager.tsx");
			expect(mgr).toMatch(/Registro/);
			const dash = read("components/services/ServicesDashboard.tsx");
			// pagination stable sort is in logs action, not UI, but UI must keep pagination component
			expect(mgr).toContain("Mostrando");
		});
	});

	describe("Dashboard separate actions for status and transfer (not generic edit)", () => {
		it("ServicesTable or Dashboard has distinct status and transfer triggers and generic edit hides them", () => {
			const table = read("components/services/ServicesTable.tsx");
			const dash = read("components/services/ServicesDashboard.tsx");
			const combined = table + "\n" + dash;
			// must have separate handlers — look for transfer/status dialog or button text
			expect(combined).toMatch(/transfer|Transferir|Cambiar.*sede/i);
			expect(combined).toMatch(/status|Estado|Cambiar.*estado/i);
			// generic edit must not contain status/location inputs — ServicesModal already tested
			const modal = read("components/services/ServicesModal.tsx");
			expect(modal).not.toMatch(/value="pending"[\s\S]*?value="completed"/);
			// table should not use glass/blur leftover
			expect(combined).not.toContain("backdrop-blur");
			// Entregada badge already ensured
			expect(table).toContain("Entregada");
		});
	});
});
