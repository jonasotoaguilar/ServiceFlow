import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
	return (
		<main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
			{/* Background Decorative Elements */}
			<div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] glow-orb pointer-events-none" />
			<div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] glow-orb pointer-events-none animation-delay-4000" />

			<div className="relative w-full flex flex-col items-center justify-center gap-4 p-4 z-10">
				<div
					role="status"
					className="w-full max-w-[450px] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
				>
					Este entorno PocketBase comienza vacío. Los tickets y sedes anteriores de Appwrite no aparecerán.
				</div>
				<RegisterForm />
			</div>

			{/* Footer decoration */}
			<div className="fixed bottom-4 w-full text-center pointer-events-none opacity-20 hidden sm:block z-10">
				<p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
					ServiceFlow System © 2026
				</p>
			</div>
		</main>
	);
}
