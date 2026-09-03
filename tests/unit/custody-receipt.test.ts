import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
function exists(rel: string): boolean {
	return fs.existsSync(path.join(process.cwd(), rel));
}

const DISCLAIMER =
	"Este documento acredita únicamente la recepción y custodia del producto. No constituye boleta, factura, DTE, comprobante de pago ni certificado de garantía.";
const TITLE = "COMPROBANTE DE RECEPCIÓN Y CUSTODIA";

function sampleService(overrides: Record<string, unknown> = {}) {
	return {
		id: "svc_123",
		invoiceNumber: "INV-9001",
		clientName: "Juan Pérez",
		rut: "12.345.678-5",
		contact: "+56 9 1234 5678",
		email: "juan@example.cl",
		product: "Notebook HP",
		sku: "HP-ENVY-001",
		entryDate: "2024-01-15",
		location: "Sede Central",
		failureDescription: "No enciende",
		notes: "Revisar batería",
		repairCost: 50000,
		...overrides,
	};
}

describe("custody receipt — lib/custody-receipt.ts pure helper (7.1 RED)", () => {
	it("lib/custody-receipt.ts exists and exports escapeHtml + render helpers", async () => {
		expect(exists("lib/custody-receipt.ts")).toBe(true);
		const mod: any = await import("@/lib/custody-receipt");
		expect(typeof mod.escapeHtml).toBe("function");
		const hasRender =
			typeof mod.renderCustodyReceiptHtml === "function" ||
			typeof mod.buildCustodyReceiptHtml === "function" ||
			typeof mod.getCustodyReceiptHtml === "function";
		expect(hasRender).toBe(true);
	});

	it("escapeHtml escapes &, <, >, \", ' and backticks for all untrusted interpolations", async () => {
		const { escapeHtml } = await import("@/lib/custody-receipt");
		expect(escapeHtml('<script>alert("x")</script>')).toBe(
			"&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
		);
		expect(escapeHtml("A & B")).toBe("A &amp; B");
		expect(escapeHtml('O\'Reilly "test"')).toBe("O&#39;Reilly &quot;test&quot;");
		expect(escapeHtml("<img src=x onerror=alert(1)>")).toContain("&lt;img");
		expect(escapeHtml("`backtick`")).not.toContain("`");
	});

	it("rendered HTML contains exact title COMPROBANTE DE RECEPCIÓN Y CUSTODIA", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const html = render(sampleService());
		expect(html).toContain(TITLE);
		// must not contain old title
		expect(html).not.toContain("Comprobante de Servicio");
		expect(html).not.toContain("Etiqueta de Servicio");
	});

	it("rendered HTML contains exact neutral disclaimer without legal-requirement claims", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const html = render(sampleService());
		expect(html).toContain(DISCLAIMER);
		// must not claim legally required
		expect(html.toLowerCase()).not.toContain("legalmente exigido");
		expect(html.toLowerCase()).not.toContain("requerido por ley");
		expect(html.toLowerCase()).not.toContain("exigido por el sii");
		// disclaimer must not be labeled as legal requirement
		expect(html).not.toMatch(/ley\s+exige|obligatorio\s+por\s+ley/i);
	});

	it("print CSS targets 58mm thermal width and readable layout", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const html = render(sampleService());
		expect(html).toMatch(/width\s*:\s*58mm/);
		expect(html).toMatch(/@page\s*\{\s*margin\s*:\s*0/);
		expect(html.toLowerCase()).not.toContain("210mm"); // no A4
		expect(html.toLowerCase()).not.toContain("a4");
	});

	it("renders required fields: service ID/date/site/customer/contact/product/SKU/reported issue + collection instructions", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const svc = sampleService({
			id: "svc_999",
			invoiceNumber: "F-123",
			entryDate: "2024-03-10",
			location: "Taller Providencia",
			clientName: "María López",
			contact: "+56 9 8765 4321",
			product: "iPhone 15",
			sku: "SKU-XYZ",
			failureDescription: "Pantalla rota",
		});
		const html = render(svc);
		// service ID / Folio interno
		expect(html).toContain("svc_999");
		expect(html).toContain("Folio interno");
		expect(html).not.toMatch(/>\s*Boleta\s*</); // never Boleta as identity
		// date/site/customer/contact/product/SKU/reported issue
		expect(html).toContain("María López");
		expect(html).toContain("Taller Providencia");
		expect(html).toContain("+56 9 8765 4321");
		expect(html).toContain("iPhone 15");
		expect(html).toContain("SKU-XYZ");
		expect(html).toContain("Pantalla rota");
		// date rendering via formatEntryDate should contain 10 and 2024
		expect(html).toMatch(/10/);
		expect(html).toMatch(/2024/);
		// collection instructions
		expect(html.toLowerCase()).toMatch(/conserve.*comprobante.*retiro|retiro.*presentaci/);
	});

	it("omits optional blocks when absent: email, cost, notes", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const svc = sampleService({ email: undefined, repairCost: undefined, notes: undefined });
		const html = render(svc);
		// email block should not appear
		expect(html).not.toContain("juan@example.cl");
		// cost section should not show $ or empty cost box
		expect(html).not.toMatch(/Costo.*\$/);
		// notes label should not appear when empty
		expect(html.toLowerCase()).not.toMatch(/>notas</);
		// but required fields still present
		expect(html).toContain(TITLE);
	});

	it("no QR, no public tracking, no external URL in thermal output", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const html = render(sampleService());
		expect(html.toLowerCase()).not.toContain("qr");
		expect(html.toLowerCase()).not.toContain("tracking");
		expect(html).not.toMatch(/https?:\/\//);
		expect(html.toLowerCase()).not.toContain("public");
		// ensure no QR injection via field is rendered as image
		const injected = sampleService({
			clientName: "<img src=x onerror=alert(1)> QR https://evil.com",
		});
		const html2 = render(injected);
		expect(html2).not.toContain("<img");
		expect(html2).toContain("&lt;img");
		expect(html2.toLowerCase()).not.toContain("qr code");
	});

	it("tax/warranty conflation is absent: no SII folio, no DTE, no garantía as this document", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const html = render(sampleService());
		// must contain disclaimer already checked, but also must not claim itself is garantía
		expect(html.toLowerCase()).not.toMatch(/este\s+documento\s+es\s+garant/);
		expect(html.toLowerCase()).not.toContain("folio sii");
		expect(html.toLowerCase()).not.toContain("sii válido");
		// internal folio must not be called Boleta
		expect(html).not.toMatch(/Boleta\s*:/);
		expect(html).toContain("Folio interno");
	});

	it("XSS escaping distinguishes from plausible wrong implementation: malicious strings are escaped in every field", async () => {
		const mod: any = await import("@/lib/custody-receipt");
		const render =
			mod.renderCustodyReceiptHtml ?? mod.buildCustodyReceiptHtml ?? mod.getCustodyReceiptHtml;
		const malicious = sampleService({
			clientName: '"><svg onload=alert(1)>',
			product: "<script>alert(1)</script>",
			failureDescription: "test & <b>bold</b>",
			notes: '"><iframe src=javascript:alert(1)>',
			sku: "<svg>",
			location: "<b>Taller</b>",
		});
		const html = render(malicious);
		// legitimate print script is allowed, but injected payloads must be escaped
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("&lt;svg");
		expect(html).toContain("&amp;");
		expect(html).toContain("&lt;b&gt;");
		expect(html).toContain("&lt;iframe");
		// raw injected tags must not appear unescaped (exclude legitimate <script> for print)
		// check that field values are escaped: the raw strings from fields should not appear
		expect(html).not.toContain('"><svg onload=alert(1)>');
		expect(html).not.toContain("<script>alert(1)</script>");
		expect(html).not.toContain('"><iframe');
		// legitimate print script should still exist exactly once
		const scriptCount = (html.match(/<script>/g) || []).length;
		expect(scriptCount).toBe(1);
	});

	it("ServicesDetailsModal.tsx print flow uses lib/custody-receipt helper, preserves window.open seam and graceful failure", () => {
		const src = read("components/services/ServicesDetailsModal.tsx");
		// must import from custody-receipt
		expect(src).toMatch(
			/from\s+["']@\/lib\/custody-receipt["']|from\s+["']\.\.\/\.\.\/lib\/custody-receipt["']/,
		);
		// must call helper to build HTML (not inline document.write template)
		expect(src).toMatch(/renderCustodyReceiptHtml|buildCustodyReceiptHtml|getCustodyReceiptHtml/);
		// must still use window.open and guard if null
		expect(src).toContain("window.open");
		expect(src).toMatch(/if\s*\(\s*!printWindow\s*\)\s*return/);
		// must not directly interpolate Service fields without escape (old pattern had ${Service.clientName} raw)
		expect(src).not.toMatch(/\$\{Service\.clientName\}/);
		expect(src).not.toMatch(/\$\{Service\.product\}/);
	});
});
