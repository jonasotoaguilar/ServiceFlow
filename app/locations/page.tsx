import { getLocations } from "@/app/actions/locations";
import LocationsManager from "./locationsManager";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function LocationsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { data: locations, error } = await getLocations();

  if (error || !locations) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar las Sedes. Por favor, intente nuevamente.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <LocationsManager locations={locations} />
    </div>
  );
}
