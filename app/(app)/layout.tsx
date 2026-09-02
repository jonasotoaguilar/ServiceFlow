import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ensureDefaultLocation } from "@/lib/locations";

export const dynamic = "force-dynamic";

export default async function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const user = await getAuthUser();
	if (!user) {
		redirect("/login");
	}
	try {
		await ensureDefaultLocation(user.id);
	} catch {
		// ensure is best-effort; spec requires at least one active default, but auth repair happens here
	}
	return (
		<div className="min-h-dvh bg-background">
			<Navbar user={user} />
			<main className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{children}
			</main>
		</div>
	);
}
