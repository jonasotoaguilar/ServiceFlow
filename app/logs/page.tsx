import { getLocationLogs } from "@/app/actions/logs";
import { getLocations } from "@/app/actions/locations";
import LogsManager from "./logsManager";

export default async function LogsPage() {
  const [logsResult, locationsResult] = await Promise.all([
    getLocationLogs({ page: 1, limit: 20 }),
    getLocations(false),
  ]);

  if (logsResult.error || !logsResult.data) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar el historial de movimientos.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <LogsManager
        initialLogs={logsResult.data}
        initialTotal={logsResult.total}
        locations={locationsResult.data || []}
      />
    </div>
  );
}
