/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		let page = 1;
		const perPage = 200;
		while (true) {
			const svcs = app.findRecordsByFilter(
				"services",
				"originLocationId = '' || originLocationId = null",
				"+id",
				perPage,
				(page - 1) * perPage,
			);
			if (!svcs || svcs.length === 0) break;
			for (const svc of svcs) {
				const id = svc.get("id"),
					cur = svc.get("locationId");
				let origin = null;
				try {
					const evs = app.findRecordsByFilter(
						"service_events",
						"ServiceId = {:sid}",
						"+changedAt",
						1,
						0,
						{ sid: id },
					);
					if (evs && evs.length)
						origin = evs[0].get("fromLocationId") || evs[0].get("toLocationId") || null;
				} catch (_) {}
				if (!origin) origin = cur;
				if (!origin) continue;
				svc.set("originLocationId", origin);
				try {
					app.save(svc);
				} catch (e) {
					console.log(`[migration] ${id}: ${e}`);
				}
			}
			if (svcs.length < perPage) break;
			page++;
			if (page > 100) break;
		}
	},
	(app) => {},
);
