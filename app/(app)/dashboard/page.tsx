import { ServiceDashboard } from "@/components/services/ServicesDashboard";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServices } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const user = await getAuthUser();

	if (!user) {
		redirect("/login");
	}

	const initialData = await getServices({
		page: 1,
		limit: 20,
		userId: user.id,
		status: ["pending", "ready"],
	});

	return <ServiceDashboard initialData={initialData} user={user} />;
}
