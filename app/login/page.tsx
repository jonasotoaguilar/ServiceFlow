import { LoginForm } from "@/components/auth/login-form";

type LoginSearchParams = {
	registered?: string | string[];
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<LoginSearchParams>;
}) {
	const params = await searchParams;
	const raw = params.registered;
	const value = Array.isArray(raw) ? raw[0] : raw;
	return (
		<main className="min-h-screen w-full flex items-center justify-center bg-background">
			<div className="w-full flex flex-col items-center justify-center gap-4 p-4 z-10">
				<LoginForm registered={value === "1"} />
			</div>

			{/* Footer decoration / Versioning */}
			<div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
				<p className="text-foreground-muted text-xs tracking-widest uppercase">
					ServiceFlow System © 2026
				</p>
			</div>
		</main>
	);
}
