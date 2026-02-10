import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
	return (
		<main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
			{/* Background Decorative Elements */}
			<div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] glow-orb pointer-events-none" />
			<div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] glow-orb pointer-events-none animation-delay-4000" />

			<div className="relative w-full flex items-center justify-center p-4 z-10">
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
