import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
	return (
		<main className="min-h-screen w-full flex items-center justify-center bg-background"><div className="w-full flex flex-col items-center justify-center gap-4 p-4 z-10">
				<RegisterForm />
			</div>

			{/* Footer decoration */}
			<div className="fixed bottom-4 w-full text-center pointer-events-none opacity-20 hidden sm:block z-10">
				<p className="text-xs text-foreground-muted uppercase tracking-widest font-medium">
					ServiceFlow System © 2026
				</p>
			</div>
		</main>
	);
}
