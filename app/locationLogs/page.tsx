import { getLocationLogs } from "@/app/actions/logs";
import { getLocations } from "@/app/actions/locations";
import LogsManager from "./logsManager";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function LogsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <LogsManager
        initialLogs={logsResult.data}
        initialTotal={logsResult.total || 0}
        locations={locationsResult.data || []}
      />
    </div>
  );
}
