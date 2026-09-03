# Research: service-ui-corrections

```yaml
schema: gentle-ai.sdd-research/v1
revision: 4
change: service-ui-corrections
outcome: done
selected_questions:
  - id: Q1
    question: "Official Chilean/SII sources defining or distinguishing boletas, invoices, DTEs, and non-tax internal/customer records; determine what this acknowledgment must avoid claiming. This document is NOT a tax receipt, boleta, invoice, DTE, warranty certificate, or proof of payment."
    status: supported
    reason: SII_Res45_and_Res11_define_DTE_and_list_boleta_factura_as_SII_authorized
  - id: Q2
    question: "Applicable Chilean consumer-protection obligations or authoritative guidance relevant to repair/service intake, custody, quote/authorization, delivery, warranties, and clear customer information. Prefer BCN LeyChile, SERNAC, SII, or other first-party government sources."
    status: supported
    reason: SERNAC_regulator_guidance_retrieved_SII_tax_boundaries_BCN_lead_explicitly_inaccessible_no_mandatory_form_found
  - id: Q3
    question: "Practical industry evidence for useful receipt fields, but clearly separate industry convention from legal requirement."
    status: supported
    reason: absence_of_mandatory_checklist_explicitly_classified_fields_as_UX_product_choice_grounded_in_custody_purpose
  - id: Q4
    question: "Determine safe minimum fields and wording for a 58mm thermal print receipt, whether an A4 fallback materially helps, and whether signatures, terms, repair authorization, liability limitations, item condition/accessories, estimated date, tracking code, or QR are appropriate. Do not invent a public tracking endpoint."
    status: supported
    reason: thermal_conventional_product_choice_58mm_not_law_A4_optional_QR_excluded_no_endpoint
  - id: Q5
    question: "Produce recommended neutral Spanish copy, with citations or explicit evidence classification for each claim, using neutral professional Chilean Spanish. Avoid unsupported claims such as 'legally required'."
    status: supported
    reason: copy_produced_with_per_claim_law_regulator_inference_UX_classification_no_legally_required_without_source
admission:
  requested:
    documentation:
      granted: true
      provider: ctx_fetch_and_index
      source_ids: [S-01, S-02, S-03, S-04, S-05, S-06, S-07]
    open_web:
      granted: true
      provider: ctx_fetch_and_index
      source_ids: [S-08, S-09]
  observed:
    documentation:
      granted: true
      provider: ctx_fetch_and_index
      source_ids: [S-01, S-02, S-03, S-04, S-05, S-06, S-07]
    open_web:
      granted: true
      provider: ctx_fetch_and_index
      source_ids: [S-08, S-09]
  capability_declaration: "gentle-ai.sdd-research-capability/v1"
  denial: null
  partial_evidence: false
  inferred_capability: false
  static_handoff:
    mapper: source-mapper_read_only
    chrome_used: false
    dead_endpoints_not_retried: true
```

## 1. Retained Selected Intent (pre-source-access, canonical)

This research was explicitly selected for change `service-ui-corrections` (artifactStore `openspec`, executionMode `auto`, deliveryStrategy `auto-chain`, reviewBudget `800`).

This is the fourth execution (second authorized re-entry) of the mandatory SDD research phase for `service-ui-corrections`, immediately after `sdd-explore`. Exploration artifact read verbatim before any source access: `openspec/changes/service-ui-corrections/exploration.md` (186 lines, incumbent Next.js 16 + React 19 + Tailwind 4 + PocketBase operational tool, three pages sharing `app/(app)/layout.tsx` shell, eight bounded UI corrections + `ARCHITECTURE.md` deletion preservation, receipt custody acknowledgment flagged as legally sensitive and deferred to research).

**Incumbent read-only evidence (not mutated):**
- `PRODUCT.md` / `DESIGN.md` / `PRD.md` — ServiceFlow as PocketBase-only operational tool, tenant isolation via `userId=@request.auth.id`, lifecycle `pending -> ready -> completed|cancelled`, `bodega-tecnica-identity` as future visual authority (Taller Claro remains incumbent-only per `exploration.md`).
- `components/services/ServicesDetailsModal.tsx:57` — current 58mm thermal print template (`Comprobante de Servicio #invoice`, client/rut/contact/product/sku/dates/location/failure/notes/costSection, footer "Gracias por su preferencia") described in exploration as safe but thin on custody semantics, disclaimer, and legally precise language; no SII/boleta fiscal claim yet — invariant requires disclaimer until research lands.
- `openspec/changes/service-ui-corrections/exploration.md` Sections Research Questions, Recommendation, Risks, Behavioral Invariants — preserved verbatim as context only, not as source-backed evidence.
- Current receipt invariant per exploration: document is custody acknowledgement for collection, not a tax receipt/invoice/boleta; must carry disclaimer until legal research lands.

**Requested research lanes (five, source-backed evidence required):**
1. Q1 — Chilean SII: official SII sources defining or distinguishing boletas, invoices, DTEs, and non-tax internal/customer records; determine what this acknowledgment must avoid claiming to avoid being construed as a `boleta`/`factura`/electronic tax document. Must avoid conflating with SII tax documents.
2. Q2 — Applicable Chilean consumer-protection obligations or authoritative guidance relevant to repair/service intake, custody, quote/authorization, delivery, warranties, and clear customer information. Prefer BCN LeyChile, SERNAC, SII, or other first-party government sources.
3. Q3 — Practical industry evidence for useful receipt fields, but clearly separate industry convention from legal requirement.
4. Q4 — Determine safe minimum fields and wording for a 58mm thermal print receipt, whether an A4 fallback materially helps, and whether signatures, terms, repair authorization, liability limitations, item condition/accessories, estimated date, tracking code, or QR are appropriate. Do not invent a public tracking endpoint.
5. Q5 — Produce recommended neutral Spanish copy (neutral professional Chilean Spanish, not persona voice), with citations or explicit evidence classification for each claim (`law`, `regulator guidance`, `inference`, `UX recommendation`). Avoid unsupported claims such as "legally required".

**Canonical desired content retained before any source access:**
Source-backed evidence that would support a future `proposal.md`/`spec.md` for a Chilean customer intake/custody acknowledgment ("Comprobante de recepcion / custodia") covering: (a) SII-cited boundaries for boleta/factura/DTE vs. internal records (quoted excerpts, URLs, publisher, accessed_at, authority), (b) BCN/SERNAC/SII-backed consumer-protection obligations for repair intake/custody/quote-authorization/delivery/warranty/clear information, (c) industry field conventions explicitly labeled as convention vs. requirement, (d) 58mm thermal layout minimum fields plus A4 fallback / signature / terms / authorization / liability / condition+accessories / estimated date / tracking-code-or-QR appropriateness assessment without inventing a public endpoint, (e) neutral professional Chilean Spanish receipt copy with per-claim evidence classification and bounded quotations distinguishing law, regulator guidance, inference, and UX recommendation. This intent is retained for blocked recovery without deriving claims from it.

Product decisions remain orchestrator-owned and are kept separate per Hard Rule; no decision is inferred here. This revision uses the static first-party handoff described in section 2-3 and explicitly classifies absence as evidence gap per evidence interpretation instructions.

## 2. Admission Verification (exact grants)

Runtime capability declaration received: `gentle-ai.sdd-research-capability/v1` with `documentation=[ctx_fetch_and_index, ctx_search]; open-web=[ctx_fetch_and_index, ctx_search]`.

- Verification: exact grants match requested classes. `documentation` granted via `ctx_fetch_and_index` + `ctx_search`; `open-web` granted via `ctx_fetch_and_index` + `ctx_search`. No capability was inferred from Bash, persistence, or inherited tools.
- Tools used under evidence authority: `ctx_fetch_and_index` for URL retrieval (plain HTTP fetch, no JS rendering) and `ctx_search` for indexed content query, per declaration. No Chrome DevTools navigation was used in this revision per instruction "Do not use Chrome again and do not retry known-dead endpoints." BCN 61438 lead was fetched via `ctx_fetch_and_index` plain HTTP only to confirm SPA shell inaccessibility.
- Observed grants equal requested grants. No denial. Static handoff from source-mapper was fetched and validated before citing (see section 3-4). Dead endpoints from prior revisions (SII 404s, SERNAC 404s, BCN 30664 variants) were not retried.
- This revision's evidence classification explicitly includes `uncertainty` and `not found` as bounded answers, per evidence interpretation.

## 3. Sources

| id | class | title | publisher | URL | accessed_at | authority |
|---|---|---|---|---|---|---|
| S-01 | documentation | Resolución Exenta SII N°45 del 01 de Septiembre del 2003 — ESTABLECE NORMAS Y PROCEDIMIENTOS DE OPERACIÓN RESPECTO DE LOS DOCUMENTOS TRIBUTARIOS ELECTRÓNICOS | Servicio de Impuestos Internos (SII) | https://www.sii.cl/documentos/resoluciones/2003/reso45.htm | 2026-09-02 | first-party regulator (SII) |
| S-02 | documentation | Resolución Exenta SII N°11 del 14 de Febrero del 2003 — ESTABLECE PROCEDIMIENTO PARA QUE CONTRIBUYENTES AUTORIZADOS PARA EMITIR DOCUMENTOS ELECTRÓNICOS QUE INDICA PUEDA TAMBIÉN ENVIARLOS POR ESTOS MEDIOS A RECEPTORES MANUALES | Servicio de Impuestos Internos (SII) | https://www.sii.cl/documentos/resoluciones/2003/reso11.htm | 2026-09-02 | first-party regulator (SII) |
| S-03 | documentation | SII — Servicios online — Factura electrónica / Boleta de ventas y servicios electrónica — Portal homer.sii.cl navigation | Servicio de Impuestos Internos (SII) | https://homer.sii.cl/ | 2026-09-02 | first-party regulator (SII) |
| S-04 | documentation | SERNAC destaca la publicación de la Ley Pro Consumidor... — Ampliación Garantía Legal | Servicio Nacional del Consumidor (SERNAC) | https://www.sernac.cl/portal/604/w3-article-64652.html | 2026-09-02 | first-party regulator (SERNAC) |
| S-05 | documentation | Deber: Solicitar la reparación o indemnización por los daños materiales y morales derivados de actos de consumo | Servicio Nacional del Consumidor (SERNAC) | https://www.sernac.cl/portal/607/w3-propertyvalue-20901.html | 2026-09-02 | first-party regulator (SERNAC) |
| S-06 | documentation | Guía del consumidor — Derechos y deberes del consumidor | Servicio Nacional del Consumidor (SERNAC) | https://www.sernac.cl/derechos-y-deberes-del-consumidor/ | 2026-09-02 | first-party regulator (SERNAC) |
| S-07 | documentation | Deber: Informarse sobre los bienes y servicios ofrecidos en el mercado (precio, condiciones de contratación, etc.) | Servicio Nacional del Consumidor (SERNAC) | https://www.sernac.cl/portal/607/w3-propertyvalue-20900.html | 2026-09-02 | first-party regulator (SERNAC) |
| S-08 | documentation | BCN LeyChile idNorma=61438 canonical lead — Ley Chile SPA shell (inaccessible) | Biblioteca del Congreso Nacional (BCN) | https://www.bcn.cl/leychile/navegar?idNorma=61438 | 2026-09-02 | first-party legislator (BCN) — inaccessible via plain fetch |
| S-09 | documentation | BCN LeyChile idNorma=61438 mirror — Ley Chile SPA shell (inaccessible) | Biblioteca del Congreso Nacional (BCN) | https://www.leychile.cl/Navegar?idNorma=61438 | 2026-09-02 | first-party legislator (BCN) — inaccessible via plain fetch |

**Attempted and validated as inaccessible — stated rather than guessed (no unquoted statutory text cited):**
- BCN canonical lead `idNorma=61438` via `https://www.bcn.cl/leychile/navegar?idNorma=61438` and `https://www.leychile.cl/Navegar?idNorma=61438` — both plain HTTP fetch return SPA shell placeholder: "Este proceso demora demasiado, es probable que su conexión esté muy lenta o que su navegador no sea compatible con nuestra aplicación." Recorded as inaccessible lead per instruction; no articles 3/12/19-21 are quoted or cited. Prior BCN `idNorma=30664` variants were not retried per "do not retry known-dead endpoints."
- Prior dead endpoints (SII 404s, SERNAC 404s, Diario Oficial PDFs, ChileAtiende fichas, manufacturer datasheets) not retried in this revision.
- Thermal 58mm specific statutory minimum: no SII/SERNAC source publishes a mandatory receipt width; classified as product choice (see Q4).
- Mandatory intake-receipt field checklist: no SII/SERNAC/BCN source retrieved publishes such a checklist; absence explicitly classified as evidence gap per evidence interpretation (see Q3/Q4).

## 4. Validated Claims

| claim_id | claim | source_ids | excerpt_refs |
|---|---|---|---|
| C-01 | SII Resolución Exenta N°45 (2003) establishes normas y procedimientos de operación respecto de Documentos Tributarios Electrónicos under Código Tributario art. 6 Letra A No.1 and Ley sobre Impuesto a las Ventas y Servicios (DL 825) art. 56 incisos 3° y 4°, authorizing the Director to permit electronic message exchange replacing paper documents when fiscal interests are protected. | [S-01] | S-01 excerpt: "RESOLUCION EXENTA SII N°45 DEL 01 DE SEPTIEMBRE DEL 2003 — MATERIA: ESTABLECE NORMAS Y PROCEDIMIENTOS DE OPERACIÓN RESPECTO DE LOS DOCUMENTOS TRIBUTARIOS ELECTRÓNICOS" / "Lo dispuesto en el artículo 6°, Letra A), No. 1, del Código Tributario, contenido en el artículo 1° del D.L. N° 830, de 1974; en el artículo 56°, incisos 3° y 4°, de la Ley sobre Impuesto a las Ventas y Servicios, contenida en el artículo 1° del D. L. 825, de 1974" / "de acuerdo con el inciso 3° del artículo 56 de la Ley sobre Impuestos a las Ventas y Servicios, el Director podrá autorizar el intercambio de mensajes mediante el uso de diferentes sistemas tecnológicos, en reemplazo de la emisión de documentos en papel, exigiendo los requisitos necesarios para resguardar debidamente el interés fiscal" |
| C-02 | SII Resolución Exenta N°11 (2003) states that per DL 825 art. 56 inciso tercero, the Director may authorize exchange of messages via different technological systems replacing paper emission of boletas, facturas, facturas de compra, guías de despacho, notas de débito y notas de crédito when electronic system safeguards fiscal interests. | [S-02] | S-02 excerpt: "de acuerdo a lo establecido en el artículo 56 del DL 825, inciso tercero, el Director Nacional podrá autorizar el intercambio de mensajes mediante el uso de diferentes sistemas tecnológicos, en reemplazo de la emisión de boletas, facturas, facturas de compra, guías de despacho, notas de débito y notas de crédito, soportados en papel, si en el sistema de intercambio electrónico de documentos implementado se resguardan debidamente los intereses fiscales" |
| C-03 | SII defines Documento Tributario Electrónico (DTE) as Documento electrónico generado y firmado electrónicamente por un emisor electrónico, que produce efectos tributarios y cuyo formato está establecido por el SII. | [S-01] | S-01 excerpt: "Documento Tributario Electrónico (DTE): Documento electrónico generado y firmado electrónicamente por un emisor electrónico, que produce efectos tributarios y cuyo formato está establecido por el SII." |
| C-04 | SII portal classifies Factura electrónica, Boleta de ventas y servicios electrónica, and Boletas de honorarios electrónicas as distinct categories alongside Autorización de documentos tributarios, indicating boleta and factura are separate tributary document types within DTE framework. | [S-03] | S-03 excerpt: Services online menu listing — "Autorización de documentos tributarios" / "Factura electrónica" / "Boleta de ventas y servicios electrónica" / "Boletas de honorarios electrónicas" as separate entries |
| C-05 | SERNAC guidance on Ley Pro Consumidor reports the ampliación del plazo de tres a seis meses para ejercer el derecho a garantía legal when product is defective, with different specifications than informed, or not fit for advertised use, allowing consumer choice of cambio del producto, devolución del dinero pagado, or reparación del bien; voluntary warranties cannot affect legal term/options. | [S-04] | S-04 excerpt: "ampliación del plazo de tres a seis meses para poder ejercer el derecho a garantía legal cuando el producto viene defectuoso, con especificaciones distintas a las informada o no es apto para el uso indicado en la publicidad, permitiéndoles a las personas solicitar a su elección el cambio del producto, la devolución del dinero pagado o la reparación del bien. Asimismo, se clarifica que las garantías voluntarias de las empresas no pueden afectar el plazo y las opciones de la garantía legal" |
| C-06 | SERNAC regulator guidance states that the Law establishes the provider must respond for the correct functioning of what was acquired or contracted. | [S-05] | S-05 excerpt: "La Ley establece que el proveedor debe responder por el correcto funcionamiento de lo adquirido o contratado." |
| C-07 | SERNAC Guía del consumidor lists among rights the access to truthful and timely information (Derecho a acceder a una información veraz y oportuna) and free choice, consistent with clear information duty. | [S-06] | S-06 excerpt: "Derecho: A acceder a una información veraz y oportuna" (listed under Derechos) |
| C-08 | SERNAC guidance for consumer duty states the duty to inform oneself about market goods/services: Compare precios, características y las condiciones de compra ("letra chica"). | [S-07] | S-07 excerpt: "Compare precios, características y las condiciones de compra ("letra chica") de lo que desea adquirir." |
| C-09 | BCN LeyChile idNorma=61438 canonical lead for Ley 19.496 returns only SPA shell via plain fetch and is therefore not validated statutory evidence; no articles are quoted. | [S-08, S-09] | S-08/S-09 excerpt: "Este proceso demora demasiado, es probable que su conexión esté muy lenta o que su navegador no sea compatible con nuestra aplicación." — recorded as inaccessible lead per instruction |

**Claims NOT emitted (enforced per fail-closed and evidence interpretation):**
- No claim that any specific Spanish disclaimer wording is "legally required" — BCN statutory text inaccessible (S-08/S-09) and no SII/SERNAC source states the exact phrase verbatim; therefore the positive phrase "comprobante de recepción y custodia — no constituye documento tributario ni acredita pago" is classified as `inference/UX recommendation` not `law` (see section 8).
- No claim of a mandatory intake-receipt field checklist published by SII/SERNAC/BCN — none retrieved; absence explicitly classified as evidence gap, fields classified as `UX recommendation`/`product choice` grounded in custody purpose (see Q3/Q4).
- No claim that SERNAC product garantía legal (6 months, 3 options per C-05) creates a mandatory form or applies identically to every paid repair — distinguished per interpretation (product warranty vs. repair-service intake/custody).
- No claim that 58mm thermal width or A4 is legally mandated — no source publishes such width; 58mm is `product/operational choice` not law; A4 optional only if implementation can support it proportionally; QR/tracking excluded because no endpoint exists and none invented.
- No quotation of unquoted Ley 19.496 arts. 3/12/19-21.

## 5. Contradictions, Uncertainty, and Freshness

**Contradictions:** None between admitted sources. S-01/S-02 (DTE norms under DL 825 art. 56, list of boletas/facturas/guias/notas) and S-03 (separate factura/boleta categories) and C-03 DTE definition are mutually consistent — all indicate SII-authorized tributary documents are a distinct regulated class with format established by SII. S-04/S-05/S-06/S-07 (SERNAC garantía, provider responsibility, information rights/duties) are consistent and address a separate domain (consumer protection) without contradicting SII. Inaccessibility of BCN S-08/S-09 does not create contradiction; it creates a gap explicitly recorded. No source contradicts the product invariant that custody acknowledgment must avoid DTE terminology.

**Uncertainty (explicit, per question, including not-found as bounded answer):**
- Q1 (SII distinction) — low uncertainty on negative boundary: C-01/C-02/C-03/C-04 together support that only SII-authorized DTEs (including boletas/facturas) produce tributary effects; therefore custody acknowledgment must avoid calling itself boleta, factura, factura electrónica, boleta electrónica, DTE, or implying SII folio/validity. High certainty on what to avoid; affirmative disclaimer wording itself remains `inference/UX` because no SII source states that exact phrase verbatim — therefore classified as `inference/UX recommendation`, not `law`.
- Q2 (consumer-protection obligations) — bounded partial certainty: S-04 provides `regulator guidance` for product garantía legal (6 months, 3 options, voluntary warranties cannot reduce legal options); S-05 provides `regulator guidance` that provider must respond for correct functioning; S-06/S-07 provide `regulator guidance` for clear information and consumer duty to compare price/conditions. No validated BCN statutory text for Ley 19.496 was retrievable via plain fetch (S-08/S-09 SPA shell) — therefore not found is the bounded answer for statutory quotation; proposal cannot cite arts. 3/12/19-21. No official mandatory repair-intake field checklist was found in any retrieved SII/SERNAC/BCN source — therefore absence is explicitly classified as evidence gap per interpretation; proposal must not assert required fields. Product garantía legal is distinguished from repair-service custody; paid repairs are not automatically covered by the 6-month product garantía unless product itself is defective/nonconforming (S-04 description).
- Q3 (field conventions vs. legal requirement) — supported with explicit separation: no source publishes a mandatory custody field list (not found); therefore all recommended fields (service identifier, received date/site, customer identification/contact, equipment/product identifiers, declared condition/failure, received accessories, visible condition, estimate/authorization status, expected next step, staff/customer acknowledgment, collection instructions) are `UX recommendation` / `product choice` grounded in custody purpose (proving what was received, enabling collection), not `law` or `regulator guidance`, except where S-06 information right implies clear information as `regulator guidance` at principle level (not field level).
- Q4 (58mm minimum, A4, signatures/terms/authorization/liability/condition/accessories/date/tracking/QR) — supported with explicit classifications: 58mm thermal is `product/operational choice` not law (no width statute found); keep 58mm thermal as default unless evidence shows it cannot carry necessary information. A4 fallback materially helps readability for terms/signatures but is not required by admitted regulators; may be offered only if implementation can support it proportionally (`UX recommendation` contingent). Signatures, terms, repair authorization, liability limitations, item condition/accessories, estimated date are `UX recommendation` / `inference` appropriate for custody evidence and expectation management; no validated source mandates them as `law`/`regulator guidance` for intake. Tracking code/QR is `UX` contingent on existing endpoint; because no endpoint exists in this change and none is invented, QR is excluded as not appropriate in this scope (explicit bounded answer).
- Q5 (neutral Spanish copy) — low uncertainty on classification scheme: each line classified as `law` | `regulator guidance` | `inference` | `UX recommendation`; no line claims "legalmente exigido" without source; the safe positive phrase is `inference/UX`.

**Freshness:**
- Admitted sources accessed_at: 2026-09-02 (all S-01 through S-09 fetched and indexed 2026-09-02 during this re-entry). S-01/S-02 are 2003 SII resolutions (stable primary authority); S-04 is SERNAC article dated 2022-01-03 (Ley Pro Consumidor, entry into force 2021-12-24 with vacancies noted), current as of access; S-05/S-06/S-07 are SERNAC educación portal current as of access. All fresh for this revision.
- Inaccessible sources recorded: BCN 61438 SPA shell confirmed 2026-09-02 via plain HTTP. Dead endpoints from prior revisions not retried.
- Retained intent timestamps: exploration 2026-09-02, research rev3 2026-09-02, research rev4 2026-09-02. Re-validate before proposal if freshness window exceeded.

## 6. Evidence-Only Conclusion (no claims beyond admitted)

Q1 is supported by SII Res.45 (S-01/C-01/C-03) and Res.11 (S-02/C-02) plus portal classification (S-03/C-04): DTEs including boletas, facturas, facturas de compra, guías de despacho, notas de débito/crédito are SII-authorized replacements for paper under DL 825 art. 56 inc 3, therefore a non-authorized custody acknowledgment must avoid DTE/boleta/factura language and SII folio/tax effects (safe negative boundary, `inference` from law/regulator). Q2 is supported with bounded answers: SERNAC Ley Pro Consumidor (S-04/C-05) provides regulator guidance for product garantía legal (6 months, 3 options, voluntary warranties cannot reduce it); SERNAC provider-responsibility (S-05/C-06), information rights (S-06/C-07), and consumer information duty (S-07/C-08) provide regulator guidance for clear information; BCN statutory text for Ley 19.496 remains not found via plain fetch (S-08/S-09) — explicitly recorded as evidence gap, not fabricated. No mandatory intake field checklist exists in retrieved official sources — explicitly recorded as not found, so proposed fields are UX/product choice grounded in custody purpose, not law; product garantía distinguished from repair-service custody. Q3 is supported as convention-vs-requirement separation (absence as bounded answer). Q4 is supported: 58mm thermal is product/operational choice not law, A4 optional only if implementation supports it proportionally, signatures/terms/authorization/liability/condition/accessories/estimated date are UX not law, tracking/QR excluded for absence of endpoint (bounded answer). Q5 is supported: classified neutral Spanish copy can be produced without unverified law claims (see section 8). All five lanes have bounded answers under allowed classifications including explicit uncertainty/not-found. Outcome is `done` — selected research is complete enough for a proposal without unvalidated claims; it does not require fabricating unavailable statutory text. No code/proposal/spec/design/tasks are produced in this research phase.

## 7. Product Choices — Separate from Evidence (Non-Authoritative)

Orchestrator-owned product truth remains separate and is not validated by this research (per Hard Rule):

- Eight bounded corrections + `ARCHITECTURE.md` deletion preservation: status filter single-select, table overflow + shell 2xl widening, registry empty-state `?createService=1` routing, edit immutability for `clientName/invoiceNumber/sku`, receipt template hardening, evolving shelf-grid mark, RUT normalization at binding, deletion preservation — all remain product decisions, now confirmed per user re-entry authorization and evidence interpretation (see preproposal.yaml rev4).
- Receipt invariant ("document is custody acknowledgement for collection, not a tax receipt/invoice/boleta; must carry disclaimer until legal research lands") is a product invariant now bounded by evidence: negative boundary is `inference` from S-01/S-02/C-01/C-02 (avoid DTE language, no SII folio/tax effects); positive phrasing "no constituye documento tributario ni acredita pago" is `inference/UX recommendation` not `law`.
- Neutral professional Chilean Spanish copy requirement (English for technical artifacts, neutral Chilean Spanish for customer-facing receipt copy) is a product constraint; copy lines are admitted below with per-claim classification, not persona voice.
- Thermal 58mm as incumbent default and A4 fallback seam are product choices; no admitted regulator mandates 58mm or A4. 58mm remains default unless evidence shows necessary information cannot be carried; A4 may be offered as optional print only if implementation can support it proportionally (not replacement by inference alone). No public tracking/QR endpoint is invented; QR excluded in this change.
- No alternative direction is inferred, no disclaimer is claimed as legally required, no field is labeled legally required without source, and no public tracking endpoint is invented. Future proposal must map each choice to admitted sources with classifications.

## 8. Recommended Neutral Professional Chilean Spanish Copy (Q5) with Per-Claim Classification

Each line is classified as `law` | `regulator guidance` | `inference` (from SII DTE boundaries) | `UX recommendation`. No line claims "legalmente exigido" without source. Use neutral professional Chilean Spanish (not persona voice). Technical artifacts remain English.

**Header / title (inference from C-01/C-02/C-03/C-04 — must avoid DTE language):**
- `Comprobante de recepción y custodia` — `inference` — avoids `boleta`, `factura`, `boleta electrónica`, `factura electrónica`, `DTE`, `comprobante tributario`, `folio SII`. Bounded by C-03 DTE definition (only SII-authorized DTEs produce efectos tributarios).

**Subheader / disclaimer (inference + UX, not law — positive phrase per interpretation):**
- `Este documento acredita la recepción del equipo para servicio y custodia. No constituye documento tributario, no es boleta ni factura y no acredita pago. Sin validez tributaria ante el SII.` — `inference` (from C-01/C-02/C-04 SII DTE boundaries) + `UX recommendation` — safe negative boundary; not labeled `law` because no SII/SERNAC source states this exact phrase verbatim.
- `Conserve este comprobante para el retiro. La entrega se realizará contra presentación de este documento y verificación de identidad.` — `UX recommendation` + `inference` (custody purpose from exploration) — no regulator text mandates this delivery condition verbatim.

**Core fields — all `UX recommendation` / `product choice` grounded in custody purpose (not "legally required" unless sourced; absence explicitly recorded as gap):**
- `N° comprobante / Identificador de servicio (folio interno)` — `UX recommendation` — internal tracking only, not SII folio (C-01/C-02).
- `Fecha de recepción` / `Sede / Punto de recepción` — `UX recommendation`
- `Cliente` / `RUT` / `Teléfono` / `Correo electrónico` — `UX recommendation` — SERNAC information principle (C-07) supports clear information as `regulator guidance` at principle level, but no regulator mandates these exact fields for custody.
- `Equipo / Producto: marca, modelo, N° de serie / IMEI / SKU (si aplica)` — `UX recommendation`
- `Falla o motivo declarado por el cliente` — `UX recommendation`
- `Accesorios recibidos` — `UX recommendation` — custody protection.
- `Condición visible del equipo al ingreso` — `UX recommendation` — custody evidence.
- `Presupuesto / estimación y estado de autorización` — `UX recommendation` — e.g., `Revisión sujeta a presupuesto. El servicio se ejecutará solo con autorización del cliente.` — no statutory repair-authorization text retrieved for intake; therefore `inference`/`UX`, not `law`.
- `Próximo paso esperado / fecha estimada (con calificativo "estimada")` — `UX recommendation` — avoids binding promise.
- `Atendido por / Responsable de recepción` — `UX recommendation`
- `Firma / conformidad de recepción (cliente y recepción)` — `UX recommendation` — appropriate for custody acknowledgment as evidence of handover; no validated source mandates it as `law` for intake.
- `Instrucciones de retiro y custodia` — `UX recommendation`

**Terms / footer (UX + regulator guidance boundary, distinguishing product garantía):**
- `Este comprobante no constituye garantía legal ni comprobante de pago. La garantía legal de productos nuevos se rige por la normativa vigente informada por SERNAC (6 meses desde la recepción para productos defectuosos, no conformes o no aptos; opciones a elección del consumidor: cambio, devolución o reparación; las garantías voluntarias no pueden reducir la legal).` — `regulator guidance` for the `6 meses / 3 opciones / voluntarias no pueden afectar` part (C-05), `inference` for negative `no constituye` part. Not labeled `law` because BCN statutory text not quoted; product garantía distinguished from repair-service intake/custody per interpretation.
- `Para consultas sobre sus derechos, contacte a SERNAC o revise su guía de derechos y deberes del consumidor.` — `regulator guidance` (C-06/C-07 pointer).
- `Términos de custodia y responsabilidad limitados a lo informado al ingreso; no cubre fallas no reportadas ni accesorios no registrados.` — `UX recommendation` / `inference` — liability limitation is product terms, not law.

**58mm / A4 / QR assessment (Q4 — all `UX`/`inference` not law):**
- 58mm thermal as operational default — `product choice` / `UX recommendation` — 58mm is conventional POS width (prior manufacturer evidence retained as convention, not law) but not statutorily mandated; keep 58mm unless evidence shows necessary information cannot be carried.
- A4 fallback (optional print alternative, separate media query/route) — `UX recommendation` — materially helps readability for terms and signatures but is not required by admitted regulators; may be offered as optional print only if implementation can support it proportionally, not replacement by inference alone.
- Código / QR de seguimiento — `UX recommendation` with hard constraint: do not invent a public tracking endpoint in this change; because no endpoint exists and none is invented, QR is excluded as not appropriate in this scope (bounded negative answer). If endpoint later exists, QR would be contingent `UX`.

## 9. References for Next Phase

- Incumbent evidence (read-only): `openspec/changes/service-ui-corrections/exploration.md`, `components/services/ServicesDetailsModal.tsx`, `PRODUCT.md`, `DESIGN.md`, `lib/rut.ts`, `lib/schemas.ts`, `lib/pocketbase-filter.ts`
- Revision 3 (partial): `openspec/changes/service-ui-corrections/research.md` revision 3 — retained intent source
- Valid evidence this revision: S-01 SII Res45 DTE norms, S-02 SII Res11 art56 list (boletas/facturas/guias/notas), S-03 SII portal factura/boleta distinct categories, S-04 SERNAC Ley Pro Consumidor garantía 6 months 3 options, S-05 SERNAC provider responsibility, S-06 SERNAC guía derechos (información veraz y oportuna), S-07 SERNAC deber informarse precio/condiciones, S-08/S-09 BCN 61438 inaccessible lead (explicit gap)
- Inaccessible/ not found pending (explicit bounded answers, not blockers): BCN Ley 19.496 statutory text arts. 3/12/19-21 (not validated via plain fetch), mandatory intake field checklist (none published in retrieved sources), SII "comprobante no tributario" verbatim positive phrasing, 58mm/A4 statutory dimension
- To proposal: all five lanes now have bounded answers with law / regulator guidance / inference / UX classifications including uncertainty/not-found; evidence is sufficient for `done` without fabricating unavailable statutory text. Proposal must maintain classifications and not invent endpoint.

---

*Persistence: `gentle-ai.sdd-research/v1` revision 4, outcome `done`, admission granted (documentation via ctx_fetch_and_index + ctx_search; open-web via ctx_fetch_and_index + ctx_search; static handoff validated, no Chrome, dead endpoints not retried), nine sources (S-01 through S-09, two BCN leads counting as one inaccessible authority), nine validated claims (C-01 through C-09), bounded quotations only, inaccessible/not-found explicitly stated as bounded answers. Retained intent and canonical desired content preserved verbatim. Product decisions recorded as confirmed. No proposal/spec/design/tasks produced; no code implemented. Evidence is sufficient for proposal without unvalidated claims.*
