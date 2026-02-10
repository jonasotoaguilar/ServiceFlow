import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
	return (
		<main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
			{/* Background Orbs */}
			<div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/20 glow-orb pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-blue-900/20 glow-orb pointer-events-none animation-delay-2000" />

			<div className="relative w-full flex items-center justify-center p-4 z-10">
				<LoginForm />
			</div>

			{/* Footer decoration / Versioning */}
			<div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
				<p className="text-slate-500 dark:text-slate-600 text-xs tracking-widest uppercase">
					ServiceFlow System © 2026
				</p>
			</div>
		</main>
	);
}
