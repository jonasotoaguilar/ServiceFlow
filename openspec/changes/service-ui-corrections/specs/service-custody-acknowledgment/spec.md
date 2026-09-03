# Service Custody Acknowledgment Specification

## Purpose

Print output is a 58mm intake/custody acknowledgment for later collection. It is not a tax document, payment proof, or product-warranty certificate.

## Requirements

### Requirement: Custody Purpose And Classified Copy

The print document MUST be titled `Comprobante de recepción y custodia`. It MUST include this disclaimer in neutral professional Chilean Spanish: `Este documento acredita la recepción del equipo para servicio y custodia. No constituye documento tributario, no es boleta ni factura y no acredita pago. Sin validez tributaria ante el SII.` Copy MUST NOT present the document as boleta, factura, DTE, comprobante tributario, folio SII, proof of payment, or garantía legal. Product garantía (SERNAC 6-month guidance) MAY be mentioned only as distinct from this custody record. Claims MUST NOT be labeled legally required.

#### Scenario: Title and disclaimer print

- GIVEN an operator prints a service receipt
- WHEN the 58mm output renders
- THEN the title MUST be `Comprobante de recepción y custodia`
- AND the non-tax/non-payment disclaimer MUST appear

#### Scenario: No false statutory or tax claims

- GIVEN the printed document
- WHEN copy is inspected
- THEN it MUST NOT claim boleta, factura, DTE, SII validity, or pago
- AND it MUST NOT call itself garantía legal

### Requirement: Fifty-Eight Millimeter Readable Layout

Default print MUST target 58mm thermal width and remain readable (identity, dates, product, failure, and disclaimer without clipped essential lines). A4 MUST NOT replace 58mm in this change. QR codes and public tracking URLs MUST NOT appear.

#### Scenario: 58mm default without QR

- GIVEN print from service details
- WHEN the document is generated
- THEN layout MUST be 58mm thermal
- AND no QR or public tracking endpoint MUST be included

### Requirement: Fields From Current Record Only

The document MUST print custody-useful fields already on the service record (internal identifier/boleta reference as internal folio, reception date, sede, cliente, RUT, teléfono, correo if present, producto, SKU, declared failure, notes, cost if present). It MUST NOT invent accessories-received or visible-condition fields unless those values already exist on the record. Internal boleta/invoice numbers MUST be labeled as internal identifiers, not SII folios.

#### Scenario: Supported fields print

- GIVEN a service with client, RUT, contact, product, SKU, dates, location, failure, notes
- WHEN printed
- THEN those stored fields MUST appear
- AND accessories/visible condition MUST be omitted when not stored

#### Scenario: Collection instruction without new endpoint

- GIVEN the printed footer
- WHEN copy is read
- THEN it MAY instruct the customer to keep the comprobante for retiro
- AND it MUST NOT add a tracking code, QR, or public status URL
