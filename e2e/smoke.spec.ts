import { test, expect } from "./pb-admin";

const pw = "E2eTest123!";
const uid = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
const userA = { name: `E2E A ${uid}`, email: `e2e-a-${uid}@example.com` };
const userB = { name: `E2E B ${uid}`, email: `e2e-b-${uid}@example.com` };
const locA = `SedeA-${uid}`;
const locB = `SedeB-${uid}`;
const invoice = `INV${uid}`;
const sku = `SKU${uid}`;
const client = `Cliente ${uid}`;

async function register(page: import("@playwright/test").Page, name: string, email: string) {
	await page.goto("/register");
	await page.getByLabel("Nombre Completo").fill(name);
	await page.getByLabel("Correo Electrónico").fill(email);
	await page.getByLabel("Contraseña", { exact: true }).fill(pw);
	await page.getByRole("button", { name: "Registrarse" }).click();
	await expect(page.getByRole("link", { name: "Servicios" }).first()).toBeVisible({
		timeout: 20000,
	});
}

async function logout(page: import("@playwright/test").Page) {
	await page.getByRole("button", { name: "Menú de usuario" }).click();
	await page.getByRole("button", { name: "Cerrar Sesión" }).click();
	await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
}

async function createLocation(page: import("@playwright/test").Page, name: string) {
	await page.goto("/locations");
	await expect(page.getByRole("heading", { name: "Gestión de Sedes" })).toBeVisible();
	await page.getByRole("button", { name: "Nueva Sede" }).click();
	await expect(page.getByRole("heading", { name: "Crear Nueva Sede" })).toBeVisible();
	await page.getByLabel("Nombre de la Sede").fill(name);
	await page.getByLabel("Dirección").fill("Calle Test 123");
	await page.getByRole("button", { name: "Guardar Sede" }).click();
	await expect(page.getByRole("heading", { name: "Crear Nueva Sede" })).toBeHidden({
		timeout: 10000,
	});
	await page.reload();
	await expect(page.getByText(name).first()).toBeVisible({ timeout: 10000 });
}

async function selectLocationInModal(modal: import("@playwright/test").Locator, target: string) {
	const trigger = modal
		.locator("label")
		.filter({ hasText: "Sede" })
		.locator("..")
		.getByRole("button")
		.first();
	await trigger.click();
	await expect(modal.getByRole("button", { name: target }).first()).toBeVisible({ timeout: 10000 });
	await modal.getByRole("button", { name: target }).first().click();
	await expect(trigger).toContainText(target, { timeout: 5000 });
}

test("smoke: register → location → service → move → history → isolation", async ({ page }) => {
	await test.step("register then login user A", async () => {
		await register(page, userA.name, userA.email);
	});

	await test.step("empty state notice if present", async () => {
		await page.goto("/dashboard");
		const empty = page.getByText("No se encontraron registros");
		if ((await empty.count()) > 0) await expect(empty.first()).toBeVisible();
	});

	await test.step("create two locations", async () => {
		await createLocation(page, locA);
		await createLocation(page, locB);
	});

	await test.step("create service in locA", async () => {
		await page.goto("/dashboard");
		await expect(page.getByRole("link", { name: "Servicios" }).first()).toBeVisible({
			timeout: 10000,
		});
		// Ensure locations are loaded by polling modal
		await expect(async () => {
			await page.getByRole("button", { name: "Nuevo servicio" }).click();
			const m = page.locator(".fixed.inset-0").last();
			await expect(m.getByRole("heading", { name: /Nuevo servicio/ }).first()).toBeVisible({
				timeout: 3000,
			});
			const t = m
				.locator("label")
				.filter({ hasText: "Sede" })
				.locator("..")
				.getByRole("button")
				.first();
			await t.click();
			await expect(m.getByRole("button", { name: locA }).first()).toBeVisible({ timeout: 2000 });
			await t.click();
			await m
				.getByRole("button", { name: "Cancelar" })
				.click()
				.catch(async () => {
					await page.keyboard.press("Escape");
				});
			await expect(m).toBeHidden({ timeout: 2000 });
		}).toPass({ timeout: 20000, intervals: [1000, 1500] });

		await page.getByRole("button", { name: "Nuevo servicio" }).click();
		const modal = page.locator(".fixed.inset-0").last();
		await expect(
			modal.getByRole("heading", { name: /Nuevo servicio|Actualizar Servicio/ }).first(),
		).toBeVisible();
		await expect(modal.getByLabel("SKU")).toBeVisible({ timeout: 5000 });
		await expect(modal.getByLabel("SKU")).toBeEnabled();
		const today = new Date().toISOString().split("T")[0];
		await modal.getByLabel("Fecha de Ingreso").fill(today);
		await modal.getByLabel("SKU").click();
		await modal.getByLabel("SKU").fill(sku);
		await expect(modal.getByLabel("SKU")).toHaveValue(sku);
		await modal.getByLabel("RUT").fill("12.345.678-5");
		await modal.getByLabel("Email").fill(`svc-${uid}@example.com`);
		await modal.getByLabel("N° Boleta").fill(invoice);
		await expect(modal.getByLabel("N° Boleta")).toHaveValue(invoice);
		await modal.getByLabel("Cliente").fill(client);
		await modal.getByLabel("Teléfono").fill("+56 9 1234 5678");
		await expect(modal.getByLabel("Teléfono")).toHaveValue("+56 9 1234 5678");
		await modal.getByLabel("Producto").fill("Producto E2E");
		await expect(modal.getByLabel("Producto")).toHaveValue("Producto E2E");
		await selectLocationInModal(modal, locA);
		await modal.getByLabel("Descripción del Problema").fill(`Falla E2E ${uid}`);
		await modal.getByLabel("Notas").fill("Notas E2E");
		await modal.getByRole("button", { name: "Guardar servicio" }).click();
		await expect(page.getByText("Servicio guardado correctamente")).toBeVisible({ timeout: 15000 });
		await expect(modal).toBeHidden({ timeout: 15000 });
		await expect(page.getByText(`#${invoice}`).first()).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(client).first()).toBeVisible();
	});

	await test.step("move service to locB and see history", async () => {
		const row = page.locator("tr").filter({ hasText: invoice }).first();
		await expect(row).toBeVisible();
		await row.getByRole("button", { name: "Transferir sede" }).click();
		const transferDialog = page.getByRole("dialog").filter({ hasText: "Transferir sede" });
		await expect(transferDialog.getByRole("heading", { name: "Transferir sede" })).toBeVisible();
		await transferDialog.getByRole("combobox").selectOption({ label: locB });
		await transferDialog.getByRole("button", { name: /Transferir sede/ }).click();
		await expect(transferDialog).toBeHidden({ timeout: 15000 });
		await row.getByRole("button", { name: /Ver detalles/ }).click();
		const details = page.locator(".fixed.inset-0").last();
		await expect(details.getByRole("heading", { name: new RegExp(invoice) })).toBeVisible({
			timeout: 8000,
		});
		await expect(details.getByText("Historial de Movimientos")).toBeVisible();
		await expect(details.getByText(`${locA}`).first()).toBeVisible();
		await expect(details.getByText(`${locB}`).first()).toBeVisible();
		await details
			.getByRole("button")
			.filter({ has: page.locator("svg.lucide-x") })
			.first()
			.click()
			.catch(async () => {
				await page.keyboard.press("Escape");
			});
		await page.goto("/service-events");
		await expect(page.getByRole("heading", { name: "Registro" })).toBeVisible();
		const logRow = page.locator("tr").filter({ hasText: invoice }).first();
		await expect(logRow).toBeVisible({ timeout: 10000 });
		await expect(logRow.getByText(locA).first()).toBeVisible();
		await expect(logRow.getByText(locB).first()).toBeVisible();
	});

	await test.step("logout and second user isolation", async () => {
		await logout(page);
		await register(page, userB.name, userB.email);
		await page.goto("/locations");
		await expect(page.getByText(locA)).toBeHidden({ timeout: 5000 });
		await expect(page.getByText(locB)).toBeHidden({ timeout: 5000 });
		await expect(page.getByText("No hay Sedes registradas"))
			.toBeVisible({ timeout: 5000 })
			.catch(async () => {
				await expect(page.getByText(locA)).toBeHidden();
			});
		await page.goto("/dashboard");
		await expect(page.getByText(`#${invoice}`)).toBeHidden({ timeout: 5000 });
		await expect(page.getByText(client)).toBeHidden({ timeout: 5000 });
		await expect(page.getByText("No se encontraron registros"))
			.toBeVisible({ timeout: 5000 })
			.catch(async () => {});
		await page.goto("/service-events");
		await expect(page.locator("tr").filter({ hasText: invoice })).toBeHidden({ timeout: 5000 });
	});
});
