/// <reference path="../pb_data/types.d.ts" />

// Enforce at least one active location per tenant at DB level.
// Covers direct PocketBase mutations and concurrent last-active races.
onBootstrap((e) => {
	e.next();
	try {
		const db = $app.db();
		db.newQuery(`
      CREATE TRIGGER IF NOT EXISTS trg_locations_no_last_active_deactivate
      BEFORE UPDATE ON locations
      WHEN OLD.isActive = 1 AND NEW.isActive = 0
      BEGIN
        SELECT CASE WHEN (SELECT COUNT(*) FROM locations WHERE userId = OLD.userId AND isActive = 1 AND id != OLD.id) = 0
        THEN RAISE(ABORT, 'Debe mantener al menos una sede activa')
        END;
      END;
    `).execute();
		db.newQuery(`
      CREATE TRIGGER IF NOT EXISTS trg_locations_no_last_active_delete
      BEFORE DELETE ON locations
      WHEN OLD.isActive = 1
      BEGIN
        SELECT CASE WHEN (SELECT COUNT(*) FROM locations WHERE userId = OLD.userId AND isActive = 1 AND id != OLD.id) = 0
        THEN RAISE(ABORT, 'Debe mantener al menos una sede activa')
        END;
        SELECT CASE WHEN EXISTS (SELECT 1 FROM services WHERE locationId = OLD.id) OR EXISTS (SELECT 1 FROM service_events WHERE fromLocationId = OLD.id OR toLocationId = OLD.id)
        THEN RAISE(ABORT, 'No se puede eliminar una sede con historial')
        END;
      END;
    `).execute();
		// Also block delete of inactive with history (history takes precedence)
		db.newQuery(`
      CREATE TRIGGER IF NOT EXISTS trg_locations_no_history_delete
      BEFORE DELETE ON locations
      BEGIN
        SELECT CASE WHEN EXISTS (SELECT 1 FROM services WHERE locationId = OLD.id) OR EXISTS (SELECT 1 FROM service_events WHERE fromLocationId = OLD.id OR toLocationId = OLD.id)
        THEN RAISE(ABORT, 'No se puede eliminar una sede con historial')
        END;
      END;
    `).execute();
	} catch (err) {
		console.log("locations triggers setup failed:", err);
	}
});

// JS-level guard for clearer 400 messages (mirrors triggers)
onRecordUpdateRequest((e) => {
	if (e.collection.name !== "locations") return e.next();
	const record = e.record;
	const newActive = record.get("isActive");
	if (newActive === false || newActive === 0 || newActive === "false") {
		const userId = record.get("userId");
		const actives = $app.findRecordsByFilter(
			"locations",
			`userId = {:uid} && isActive = {:active}`,
			"",
			100,
			0,
			{ uid: userId, active: true },
		);
		const isTargetInActives = actives.some((r) => r.id === record.id);
		if (isTargetInActives && actives.length <= 1) {
			throw new BadRequestError("Debe mantener al menos una sede activa");
		}
	}
	e.next();
}, "locations");

onRecordDeleteRequest((e) => {
	if (e.collection.name !== "locations") return e.next();
	const record = e.record;
	const userId = record.get("userId");
	const svc = $app.findRecordsByFilter("services", `locationId = {:lid}`, "", 1, 0, {
		lid: record.id,
	});
	const logs = $app.findRecordsByFilter(
		"service_events",
		`fromLocationId = {:lid} || toLocationId = {:lid}`,
		"",
		1,
		0,
		{ lid: record.id },
	);
	if (svc.length > 0 || logs.length > 0) {
		throw new BadRequestError(
			"No se puede eliminar una sede con historial de servicios o movimientos.",
		);
	}
	if (record.get("isActive") !== false) {
		const actives = $app.findRecordsByFilter(
			"locations",
			`userId = {:uid} && isActive = {:active}`,
			"",
			100,
			0,
			{ uid: userId, active: true },
		);
		if (actives.length <= 1) {
			throw new BadRequestError("Debe mantener al menos una sede activa");
		}
	}
	e.next();
}, "locations");
