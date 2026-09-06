import type { Metadata } from "next";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export const metadata: Metadata = {
	title: "Reenviar verificación",
	description: "Solicita un nuevo enlace de verificación para tu cuenta de ServiceFlow.",
};

export default function ResendVerificationPage() {
	return (
		<main className="min-h-screen w-full flex items-center justify-center bg-background">
			<div className="w-full flex flex-col items-center justify-center gap-4 p-4 z-10">
				<ResendVerificationForm />
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
