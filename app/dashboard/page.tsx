import { ServiceDashboard } from "@/components/services/ServicesDashboard";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServices } from "@/lib/storage";

export default async function Home() {
	const user = await getAuthUser();

	if (!user) {
		redirect("/login");
	}

	// Fetch initial data on the server
	const initialData = await getServices({
		page: 1,
		limit: 20,
		userId: user.id,
		status: ["pending", "ready"], // Pre-load active Services as default in UI
	});

	return (
		<main className="min-h-screen bg-background p-4 md:p-8">
			<div className="max-w-7xl mx-auto">
				<ServiceDashboard initialData={initialData} user={user} />
			</div>
		</main>
	);
}
