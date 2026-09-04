/// <reference path="../pb_data/types.d.ts" />
onRecordCreateRequest((e) => {
	if (e.collection.name !== "services") return e.next();
	const r = e.record;
	if (!r.get("originLocationId")) r.set("originLocationId", r.get("locationId"));
	return e.next();
}, "services");
onRecordUpdateRequest((e) => {
	if (e.collection.name !== "services") return e.next();
	const r = e.record;
	try {
		const o = $app.findRecordById("services", r.id);
		const oo = o.get("originLocationId") || o.get("locationId");
		if (r.get("originLocationId") !== oo) r.set("originLocationId", oo);
		if (!r.get("originLocationId")) r.set("originLocationId", o.get("locationId"));
	} catch (_) {
		if (!r.get("originLocationId")) r.set("originLocationId", r.get("locationId"));
	}
	return e.next();
}, "services");
