import { ServiceDashboard } from "@/components/services/ServicesDashboard";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServices } from "@/lib/storage";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
	searchParams?: Promise<{ createService?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
	const user = await getAuthUser();

	if (!user) {
		redirect("/login");
	}

	const resolvedParams = searchParams ? await searchParams : undefined;
	const rawCreateService = resolvedParams?.createService;
	const createServiceValue = Array.isArray(rawCreateService)
		? rawCreateService[0]
		: rawCreateService;
	const initialCreateService = createServiceValue === "1";

	const initialData = await getServices({
		page: 1,
		limit: 20,
		userId: user.id,
		status: ["pending", "ready"],
	});

	return (
		<ServiceDashboard
			initialData={initialData}
			user={user}
			initialCreateService={initialCreateService}
		/>
	);
}
