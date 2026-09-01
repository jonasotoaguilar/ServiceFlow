import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const mockGetAuthUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuthUser: (...a: unknown[]) => (mockGetAuthUser as any)(...a) }));

const mockServicesGetList = vi.fn();
const mockServicesCreate = vi.fn();
const mockServicesGetOne = vi.fn();
const mockServicesUpdate = vi.fn();
const mockServicesDelete = vi.fn();
const mockLocationsGetList = vi.fn();
const mockLocationsGetOne = vi.fn();
const mockLogsGetList = vi.fn();
const mockLogsCreate = vi.fn();

const mockFilter = vi.fn((t: string, p: Record<string, unknown>) => {
	let s = t;
	for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{:${k}}`, `"${String(v)}"`);
	return s;
});
const mockCollection = vi.fn((n: string) => {
	if (n === "services")
		return {
			getList: mockServicesGetList,
			create: mockServicesCreate,
			getOne: mockServicesGetOne,
			update: mockServicesUpdate,
			delete: mockServicesDelete,
		};
	if (n === "locations") return { getList: mockLocationsGetList, getOne: mockLocationsGetOne };
	if (n === "service_events") return { getList: mockLogsGetList, create: mockLogsCreate };
	throw new Error(n);
});
const mockCreatePocketBaseClient = vi.fn(async () => ({
	filter: mockFilter,
	collection: mockCollection,
}));
vi.mock("@/lib/pocketbase", () => ({
	createPocketBaseClient: (...a: unknown[]) => (mockCreatePocketBaseClient as any)(...a),
}));

function pbService(o: Record<string, unknown> = {}) {
	return {
		id: "pb15svc00000001",
		userId: "user-1",
		invoiceNumber: "INV-001",
		clientName: "Cliente Test",
		rut: "12.345.678-5",
		contact: "+56 9 1234 5678",
		email: "a@b.com",
		product: "Laptop",
		failureDescription: "No enciende",
		sku: "SKU1",
		locationId: "loc_pb_15_chars1",
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
function locRecord(o: Record<string, unknown> = {}) {
	return {
		id: "loc_pb_15_chars1",
		userId: "user-1",
		name: "Sede Central",
		isActive: true,
		isDefault: true,
		...o,
	};
}

describe("Unit 8 lifecycle — create/edit 4.3 RED (create pending owned location generic edit rejects status location)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthUser.mockReset();
		mockServicesGetList.mockReset();
		mockServicesCreate.mockReset();
		mockServicesGetOne.mockReset();
		mockServicesUpdate.mockReset();
		mockLocationsGetList.mockReset();
		mockLocationsGetOne.mockReset();
		mockLogsGetList.mockReset();
		mockLogsCreate.mockReset();
		mockFilter.mockClear();
		mockCollection.mockClear();
		mockCreatePocketBaseClient.mockClear();
		mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
		mockServicesCreate.mockResolvedValue(pbService({ id: "pb15new00000001" }));
		mockServicesGetOne.mockResolvedValue(
			pbService({
				id: "pb15svc00000001",
				userId: "user-1",
				status: "pending",
				locationId: "loc_pb_15_chars1",
			}),
		);
		mockServicesUpdate.mockResolvedValue(pbService({}));
		mockLocationsGetOne.mockResolvedValue(
			locRecord({ id: "loc_pb_15_chars1", userId: "user-1", isActive: true }),
		);
		mockLocationsGetList.mockResolvedValue({ items: [locRecord()], totalItems: 1 });
		mockLogsGetList.mockResolvedValue({ items: [], totalItems: 0 });
	});

	describe("Create selects initial owned location", () => {
		it("POST with owned active locationId succeeds, stores locationId pending no transfer event", async () => {
			mockLocationsGetOne.mockResolvedValue(
				locRecord({ id: "loc_pb_15_chars1", userId: "user-1", isActive: true }),
			);
			mockServicesCreate.mockResolvedValue(
				pbService({ id: "pb15new00000001", locationId: "loc_pb_15_chars1", status: "pending" }),
			);
			const { POST } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "POST",
				body: JSON.stringify({
					invoiceNumber: "INV-900",
					clientName: "Cliente Uno",
					rut: "12.345.678-5",
					contact: "+56 9 1111 1111",
					product: "Celular",
					locationId: "loc_pb_15_chars1",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await POST(req);
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.locationId).toBe("loc_pb_15_chars1");
			expect(body.status).toBe("pending");
			expect(mockServicesCreate).toHaveBeenCalledTimes(1);
			const payload = mockServicesCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(payload.locationId).toBe("loc_pb_15_chars1");
			expect(payload.status).toBe("pending");
			expect(mockLogsCreate).toHaveBeenCalledTimes(1);
			const evt = mockLogsCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(evt.kind).toBe("created");
			expect(evt.ServiceId).toBeDefined();
		});

		it("POST with other owned active location succeeds (triangulate B)", async () => {
			mockLocationsGetOne.mockResolvedValue(
				locRecord({
					id: "locB_active_001",
					userId: "user-1",
					isActive: true,
					isDefault: false,
					name: "Sede B",
				}),
			);
			mockServicesCreate.mockResolvedValue(
				pbService({ id: "pb15new00000002", locationId: "locB_active_001", status: "pending" }),
			);
			const { POST } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "POST",
				body: JSON.stringify({
					invoiceNumber: "INV-901",
					clientName: "Cliente Dos",
					rut: "12.345.678-5",
					contact: "+56 9 2222 2222",
					product: "Tablet",
					locationId: "locB_active_001",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await POST(req);
			expect(res.status).toBe(201);
			const payload = mockServicesCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(payload.locationId).toBe("locB_active_001");
			expect(payload.status).toBe("pending");
		});

		it("POST with inactive locationId rejected 400 no service", async () => {
			mockLocationsGetOne.mockResolvedValue(
				locRecord({ id: "loc_inactive", userId: "user-1", isActive: false }),
			);
			const { POST } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "POST",
				body: JSON.stringify({
					invoiceNumber: "INV-902",
					clientName: "Cliente Tres",
					rut: "12.345.678-5",
					contact: "+56 9 3333 3333",
					product: "Monitor",
					locationId: "loc_inactive",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await POST(req);
			expect(res.status).toBe(400);
			expect(mockServicesCreate).not.toHaveBeenCalled();
		});

		it("POST with foreign locationId rejected 400 (triangulate)", async () => {
			mockLocationsGetOne.mockResolvedValue(
				locRecord({ id: "loc_foreign", userId: "other-user", isActive: true }),
			);
			// also test getOne throws not found path
			mockLocationsGetOne.mockResolvedValueOnce(
				locRecord({ id: "loc_foreign", userId: "other-user", isActive: true }),
			);
			const { POST } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "POST",
				body: JSON.stringify({
					invoiceNumber: "INV-903",
					clientName: "Cliente Cuatro",
					rut: "12.345.678-5",
					contact: "+56 9 4444 4444",
					product: "Mouse",
					locationId: "loc_foreign",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await POST(req);
			expect(res.status).toBe(400);
			expect(mockServicesCreate).not.toHaveBeenCalled();
			// also test not found throws
			mockLocationsGetOne.mockRejectedValueOnce(new Error("not found"));
			const req2 = new Request("http://localhost/api/services", {
				method: "POST",
				body: JSON.stringify({
					invoiceNumber: "INV-904",
					clientName: "Cliente Cinco",
					rut: "12.345.678-5",
					contact: "+56 9 5555 5555",
					product: "Teclado",
					locationId: "missing_loc",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res2 = await POST(req2);
			expect(res2.status).toBe(400);
			expect(mockServicesCreate).not.toHaveBeenCalled();
		});

		it("ServicesModal default sede preselected — form reset uses LOCATIONS[0] and watches locationId", () => {
			const src = read("components/services/ServicesModal.tsx");
			// must preselect default: LOCATIONS.length >0 ? LOCATIONS[0].id : "" in defaultValues and reset
			expect(src).toContain('LOCATIONS.length > 0 ? LOCATIONS[0].id : ""');
			expect(src).toContain('form.setValue("locationId", LOCATIONS[0].id');
			// locationId remains on create (not gated by isEditing for create path)
			// check that location block is NOT inside isEditing guard — should be visible when !isEditing
			const locationLabelIdx = src.indexOf('htmlFor="locationId"');
			expect(locationLabelIdx).toBeGreaterThan(0);
			// location should be gated to create only (!isEditing) after fix — before fix it's always visible so this will fail for edit check below
			// For this test we check that location control exists at all (preselected)
			expect(src).toContain('htmlFor="locationId"');
		});
	});

	describe("Create always pending", () => {
		it("Form has no status control on create and location control remains (primary RED)", () => {
			const src = read("components/services/ServicesModal.tsx");
			// Status picker must be absent when creating: no status radio with pending/ready/completed/cancelled outside isEditing, and isEditing block must not contain status
			// After fix: status radios should be removed entirely (since edit also hides status), so file should NOT contain status radios at all
			// Current implementation has status radios inside isEditing block — so this test expects NO status radios in create AND NO status radios in edit after fix
			// We assert file does NOT contain status radio block (hidden on create AND edit)
			// The presence of 'value="pending"' for status should be absent after fix
			// Before fix: file contains status radios (inside isEditing) so this fails RED
			expect(src).not.toMatch(/value="pending"[\s\S]*?value="ready"[\s\S]*?value="completed"/);
			// Location control must remain on create: htmlFor locationId must be inside !isEditing block
			// Check that locationId input exists and is gated by !isEditing after fix
			const hasLocation = src.includes('htmlFor="locationId"');
			expect(hasLocation).toBe(true);
			// Check that create path (!isEditing) still shows location: location block before status removal should be inside !isEditing
			// After fix, location block should be inside !isEditing
			const modalSlice = src.slice(
				src.indexOf("export function ServiceModal"),
				src.indexOf("export function ServiceModal") + 12000,
			);
			// location should be within a !isEditing guard
			expect(modalSlice).toMatch(/!isEditing[\s\S]*?htmlFor="locationId"/);
		});

		it("Client status is ignored — POST with completed forces pending and no dates", async () => {
			mockLocationsGetOne.mockResolvedValue(locRecord({ isActive: true }));
			const before = Date.now();
			mockServicesCreate.mockResolvedValue(
				pbService({
					id: "pb15new00000003",
					status: "pending",
					deliveryDate: null,
					readyDate: null,
					cancellationDate: null,
				}),
			);
			const { POST } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "POST",
				body: JSON.stringify({
					invoiceNumber: "INV-905",
					clientName: "Cliente Status",
					rut: "12.345.678-5",
					contact: "+56 9 6666 6666",
					product: "Parlante",
					locationId: "loc_pb_15_chars1",
					status: "completed",
					deliveryDate: new Date().toISOString(),
					readyDate: new Date().toISOString(),
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await POST(req);
			expect(res.status).toBe(201);
			const payload = mockServicesCreate.mock.calls[0][0] as Record<string, unknown>;
			expect(payload.status).toBe("pending");
			expect(payload.deliveryDate).toBeNull();
			expect(payload.readyDate).toBeNull();
			expect(payload.cancellationDate).toBeNull();
			const body = await res.json();
			expect(body.status).toBe("pending");
			// ensure no dates leaked
			expect(payload.deliveryDate as string | null).toBeNull();
			expect(new Date(payload.entryDate as string).getTime()).toBeGreaterThanOrEqual(before);
		});

		it("Client status ready/cancelled also ignored (triangulate)", async () => {
			mockLocationsGetOne.mockResolvedValue(locRecord({ isActive: true }));
			const { POST } = await import("@/app/api/services/route");
			for (const st of ["ready", "cancelled"] as const) {
				vi.clearAllMocks();
				mockLocationsGetOne.mockResolvedValue(locRecord({ isActive: true }));
				mockServicesCreate.mockResolvedValue(pbService({ id: `pb15new${st}`, status: "pending" }));
				mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com", name: "A" });
				const req = new Request("http://localhost/api/services", {
					method: "POST",
					body: JSON.stringify({
						invoiceNumber: `INV-${st}`,
						clientName: "Cliente Tri",
						rut: "12.345.678-5",
						contact: "+56 9 7777 7777",
						product: "Prod",
						locationId: "loc_pb_15_chars1",
						status: st,
						readyDate: new Date().toISOString(),
						cancellationDate: new Date().toISOString(),
					}),
					headers: { "Content-Type": "application/json" },
				});
				const res = await POST(req);
				expect(res.status).toBe(201);
				const payload = mockServicesCreate.mock.calls[0][0] as Record<string, unknown>;
				expect(payload.status).toBe("pending");
				expect(payload.readyDate).toBeNull();
				expect(payload.cancellationDate).toBeNull();
			}
		});
	});

	describe("Generic edit excludes status and location", () => {
		it("Edit form without status/location fields (primary RED)", () => {
			const src = read("components/services/ServicesModal.tsx");
			// After fix: when isEditing true, neither status nor location controls are shown.
			// Current src has status inside isEditing and location always visible, so this fails RED
			// Check that file does NOT contain location or status inside isEditing guard
			// We assert that the isEditing block does not contain htmlFor locationId or status radios
			// Simplest: overall file should not have status radios at all (as above) and locationId only inside !isEditing
			expect(src).not.toMatch(/value="pending"[\s\S]*?value="completed"/);
			// locationId must NOT be inside isEditing block
			const isEditingIdx = src.indexOf("isEditing");
			const locationIdx = src.indexOf('htmlFor="locationId"');
			expect(locationIdx).toBeGreaterThan(0);
			// The location block should be gated by !isEditing, not shown when editing
			const beforeLocation = src.slice(Math.max(0, locationIdx - 1500), locationIdx);
			expect(beforeLocation).toMatch(/!isEditing/);
			expect(beforeLocation).not.toMatch(/isEditing &&[\s\S]*?htmlFor="locationId"/);
		});

		it("Generic write with status is rejected 400 and writes no Registro event", async () => {
			mockServicesGetOne.mockResolvedValue(
				pbService({
					id: "pb15svc00000001",
					userId: "user-1",
					status: "pending",
					locationId: "loc_pb_15_chars1",
				}),
			);
			const { PUT } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "PUT",
				body: JSON.stringify({
					id: "pb15svc00000001",
					invoiceNumber: "INV-001",
					clientName: "Cliente Edit",
					rut: "12.345.678-5",
					contact: "+56 9 8888 8888",
					product: "Prod Edit",
					locationId: "loc_pb_15_chars1",
					status: "ready",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PUT(req);
			expect(res.status).toBe(400);
			expect(mockServicesUpdate).not.toHaveBeenCalled();
			expect(mockLogsCreate).not.toHaveBeenCalled();
			// Check error message mentions lifecycle (Spanish)
			const body = await res.json();
			expect(JSON.stringify(body).toLowerCase()).toMatch(/estado|sede|lifecycle/);
		});

		it("Generic write with locationId is rejected 400 even without status (triangulate)", async () => {
			mockServicesGetOne.mockResolvedValue(
				pbService({
					id: "pb15svc00000002",
					userId: "user-1",
					status: "pending",
					locationId: "locA",
				}),
			);
			const { PUT } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "PUT",
				body: JSON.stringify({
					id: "pb15svc00000002",
					invoiceNumber: "INV-002",
					clientName: "Cliente Edit2",
					rut: "12.345.678-5",
					contact: "+56 9 9999 9999",
					product: "Prod2",
					locationId: "locB",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PUT(req);
			expect(res.status).toBe(400);
			expect(mockServicesUpdate).not.toHaveBeenCalled();
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});

		it("Generic write with status only also rejected 400 (triangulate)", async () => {
			mockServicesGetOne.mockResolvedValue(
				pbService({
					id: "pb15svc00000003",
					userId: "user-1",
					status: "pending",
					locationId: "loc_pb_15_chars1",
				}),
			);
			const { PUT } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "PUT",
				body: JSON.stringify({
					id: "pb15svc00000003",
					invoiceNumber: "INV-003",
					clientName: "Cliente Edit3",
					rut: "12.345.678-5",
					contact: "+56 9 0000 0000",
					product: "Prod3",
					status: "completed",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PUT(req);
			expect(res.status).toBe(400);
			expect(mockServicesUpdate).not.toHaveBeenCalled();
		});

		it("Generic edit without status/location succeeds and leaves those unchanged (triangulate)", async () => {
			mockServicesGetOne.mockResolvedValue(
				pbService({
					id: "pb15svc00000004",
					userId: "user-1",
					status: "pending",
					locationId: "loc_pb_15_chars1",
				}),
			);
			mockServicesUpdate.mockResolvedValue(pbService({ id: "pb15svc00000004" }));
			const { PUT } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "PUT",
				body: JSON.stringify({
					id: "pb15svc00000004",
					invoiceNumber: "INV-004",
					clientName: "Cliente Edit4",
					rut: "12.345.678-5",
					contact: "+56 9 1212 1212",
					product: "Prod4",
					notes: "Nota nueva",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PUT(req);
			expect(res.status).toBe(200);
			expect(mockServicesUpdate).toHaveBeenCalledTimes(1);
			expect(mockLogsCreate).not.toHaveBeenCalled();
		});

		it("Foreign service is forbidden on generic update 500/403/404", async () => {
			mockServicesGetOne.mockResolvedValue(
				pbService({
					id: "pb15svcForeign01",
					userId: "other-user",
					status: "pending",
					locationId: "locX",
				}),
			);
			const { PUT } = await import("@/app/api/services/route");
			const req = new Request("http://localhost/api/services", {
				method: "PUT",
				body: JSON.stringify({
					id: "pb15svcForeign01",
					invoiceNumber: "INV-005",
					clientName: "Cliente Foreign",
					rut: "12.345.678-5",
					contact: "+56 9 1313 1313",
					product: "Prod",
				}),
				headers: { "Content-Type": "application/json" },
			});
			const res = await PUT(req);
			expect([500, 403, 401, 404].includes(res.status)).toBe(true);
			expect(mockServicesUpdate).not.toHaveBeenCalled();
		});
	});

	describe("Entregada display mapping", () => {
		it("UI shows Entregada for completed and storage stays completed", () => {
			const table = read("components/services/ServicesTable.tsx");
			expect(table).toContain('case "completed"');
			expect(table).toContain("Entregada");
			expect(table).not.toMatch(/case "completed"[\s\S]*?Completada/);
			const details = read("components/services/ServicesDetailsModal.tsx");
			expect(details).toContain('case "completed"');
			expect(details).toContain("Entregada");
			const dashboard = read("components/services/ServicesDashboard.tsx");
			expect(dashboard).toContain('value: "completed"');
			expect(dashboard).toContain("Entregada");
			const types = read("lib/types.ts");
			expect(types).toContain('"completed"');
			const storage = read("lib/storage.ts");
			expect(storage).toContain("completed");
			// Ensure no migration that renames storage completed to Entregada
			const collections = read("pocketbase/v1.collections.json");
			// storage must still allow completed as status value (no rename)
			expect(storage).not.toContain("Entregada");
			expect(collections.toLowerCase()).not.toContain("entregada");
		});

		it("Storage stays completed not migrated — Service type still completed triangulate", () => {
			const schema = read("lib/schemas.ts");
			expect(schema).toContain('"completed"');
			expect(schema).not.toContain("Entregada");
			// PocketBase filter allows completed
			const filter = read("lib/pocketbase-filter.ts");
			expect(filter).toContain("completed");
			// Table badge for completed is Entregada but storage check ensures no migration file renames completed
			const table2 = read("components/services/ServicesTable.tsx");
			expect(table2).toMatch(/bg-completed-bg/);
		});
	});
});
