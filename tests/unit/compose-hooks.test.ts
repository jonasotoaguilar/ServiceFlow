import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("compose hook mount regression — pocketbase hooks dir", () => {
	it("mounts ./pb_hooks to image-supported /pocketbase/hooks (not /pb/...)", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "compose.yaml"), "utf8");
		expect(src).toContain("./pb_hooks:/pocketbase/hooks:ro");
		expect(src).not.toContain("/pb/pb_hooks");
		// Verify target matches container entrypoint POCKETBASE_HOOK_DIR = /pocketbase/hooks
		expect(src).toMatch(/image: adrianmusante\/pocketbase:0\.40\.1/);
	});
	it("pb_hooks hook file exists and defines triggers", () => {
		const hook = fs.readFileSync(path.join(process.cwd(), "pb_hooks/locations.pb.js"), "utf8");
		expect(hook).toContain("trg_locations_no_last_active_deactivate");
		expect(hook).toContain("trg_locations_no_last_active_delete");
		expect(hook).toContain("No se puede eliminar una sede con historial");
	});
});
