import { getLocations } from "@/app/actions/locations";
import LocationsManager from "./locationsManager";

export default async function LocationsPage() {
  const { data: locations, error } = await getLocations();

  if (error || !locations) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar las ubicaciones. Por favor, intente nuevamente.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <LocationsManager locations={locations} />
    </div>
  );
}
