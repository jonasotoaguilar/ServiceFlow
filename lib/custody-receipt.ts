import { formatEntryDate } from "@/lib/format-date";
import type { Service } from "@/lib/types";

/**
 * Escape HTML for safe interpolation of untrusted fields into thermal receipt.
 * Covers &, <, >, ", ', ` to prevent XSS in window-open HTML.
 */
export function escapeHtml(value: string | null | undefined): string {
	if (value == null) return "";
	const str = String(value);
	return str
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")
		.replaceAll("`", "&#96;");
}

const TITLE = "Comprobante de recepción y custodia";
const DISCLAIMER =
	"Este documento acredita la recepción del equipo para servicio y custodia. No constituye documento tributario, no es boleta ni factura y no acredita pago. Sin validez tributaria ante el SII.";
const COLLECTION_INSTRUCTION =
	"Conserve este comprobante para el retiro. La entrega se realizará contra presentación de este documento y verificación de identidad.";

/**
 * Build 58mm thermal receipt HTML for a Service record.
 * Pure helper: no window, no side effects. Caller handles window.open/print.
 * All interpolations are escaped via escapeHtml.
 */
export function renderCustodyReceiptHtml(service: Service): string {
	const id = escapeHtml(service.id);
	const folio = escapeHtml(service.invoiceNumber ?? "");
	const clientName = escapeHtml(service.clientName);
	const rut = service.rut ? escapeHtml(service.rut) : "";
	const contact = escapeHtml(service.contact ?? "");
	const email = service.email ? escapeHtml(service.email) : "";
	const product = escapeHtml(service.product);
	const sku = service.sku ? escapeHtml(service.sku) : "";
	const location = escapeHtml(service.location ?? "");
	const failure = service.failureDescription ? escapeHtml(service.failureDescription) : "";
	const notes = service.notes ? escapeHtml(service.notes) : "";
	const entryDate = escapeHtml(formatEntryDate(service.entryDate));
	const hasEmail = !!service.email;
	const hasSku = !!service.sku;
	const hasFailure = !!service.failureDescription;
	const hasNotes = !!service.notes;
	const hasCost = typeof service.repairCost === "number" && service.repairCost > 0;
	const costText = hasCost ? escapeHtml(String(service.repairCost)) : "";
	// formatCurrency is avoided to keep pure and no extra import; show raw with $ prefix if needed
	// Use simple $ formatting via Intl if needed, but escape already
	const formattedCost = hasCost ? `$${Number(service.repairCost).toLocaleString("es-CL")}` : "";

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${TITLE} - ${folio || id}</title>
<style>
@page { margin: 0; }
body {
  font-family: sans-serif;
  width: 58mm;
  margin: 0;
  padding: 5mm;
  font-size: 10pt;
  line-height: 1.2;
}
.header {
  text-align: center;
  border-bottom: 1pt dashed #000;
  margin-bottom: 3mm;
  padding-bottom: 2mm;
}
.title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.02em; }
.folio { font-size: 10pt; font-weight: bold; margin-top: 1mm; }
.field { margin-bottom: 2mm; }
.label { font-size: 8pt; text-transform: uppercase; color: #555; }
.value { font-weight: bold; display: block; word-break: break-word; }
.cost-section {
  margin-top: 4mm;
  padding: 2mm;
  border: 1pt solid #000;
  text-align: center;
}
.footer {
  margin-top: 5mm;
  text-align: center;
  font-size: 8pt;
  border-top: 1pt dashed #000;
  padding-top: 2mm;
}
.disclaimer { font-size: 7pt; color: #333; margin-top: 3mm; text-align: center; }
.instructions { font-size: 8pt; margin-top: 3mm; text-align: center; }
</style>
</head>
<body>
<div class="header">
<div class="title">${TITLE}</div>
${folio || id ? `<div class="folio">Folio interno: ${folio || id}</div>` : ""}
${id ? `<div class="label">ID servicio: <span class="value" style="display:inline;">${id}</span></div>` : ""}
</div>

<div class="field">
<span class="label">Cliente</span>
<span class="value">${clientName}</span>
${rut ? `<span class="value" style="font-size: 9pt;">${rut}</span>` : ""}
</div>

<div class="field">
<span class="label">Contacto</span>
<span class="value">${contact || "Sin teléfono"}</span>
${hasEmail ? `<span class="value" style="font-size: 9pt;">${email}</span>` : ""}
</div>

<div class="field">
<span class="label">Producto</span>
<span class="value">${product}</span>
${hasSku ? `<span class="label">SKU:</span> <span class="value" style="display:inline; font-size:9pt;">${sku}</span>` : ""}
</div>

<div class="field">
<span class="label">Fecha Ingreso</span>
<span class="value">${entryDate}</span>
</div>

<div class="field">
<span class="label">Sede</span>
<span class="value">${location}</span>
</div>

${
	hasFailure
		? `<div class="field">
<span class="label">Falla Reportada</span>
<span class="value" style="font-weight: normal; font-size: 9pt;">${failure}</span>
</div>`
		: ""
}

${
	hasNotes
		? `<div class="field">
<span class="label">Notas</span>
<span class="value" style="font-weight: normal; font-size: 9pt; font-style: italic;">${notes}</span>
</div>`
		: ""
}

${hasCost ? `<div class="cost-section"><span class="label">Costo Reparación</span><div style="font-size: 14pt; font-weight: bold; margin-top: 1mm;">${escapeHtml(formattedCost)}</div></div>` : ""}

<div class="instructions">
${COLLECTION_INSTRUCTION}
</div>

<div class="disclaimer">
${DISCLAIMER}
</div>

<div class="footer">
Gracias por su preferencia
</div>

<script>
window.onload = function() {
  window.print();
  window.onafterprint = function() { window.close(); };
};
</script>
</body>
</html>`;
}

// Alias for test flexibility
export const buildCustodyReceiptHtml = renderCustodyReceiptHtml;
export const getCustodyReceiptHtml = renderCustodyReceiptHtml;
