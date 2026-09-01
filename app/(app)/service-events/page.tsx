import { getServiceEvents } from "@/app/actions/service-events";
import { getLocations } from "@/app/actions/locations";
import ServiceEventsManager from "./serviceEventsManager";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ServiceEventsPage() {
	const user = await getAuthUser();
	if (!user) {
		redirect("/login");
	}
	const [logsResult, locationsResult] = await Promise.all([
		getServiceEvents({ page: 1, limit: 20 }),
		getLocations(false),
	]);

	if (logsResult.error || !logsResult.data) {
		return (
			<div className="p-8 text-center text-red-500">Error al cargar el historial Registro.</div>
		);
	}

	return (
		<ServiceEventsManager
			initialLogs={logsResult.data}
			initialTotal={logsResult.total || 0}
			locations={locationsResult.data || []}
		/>
	);
}
