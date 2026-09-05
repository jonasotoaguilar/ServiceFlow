import { redirect } from "next/navigation";
import Link from "next/link";
import { createPocketBaseClient } from "@/lib/pocketbase";
import { Alert } from "@/components/ui/alert";

type VerifySearchParams = {
	token?: string | string[];
	status?: string | string[];
};

function VerifyCard({ status }: { status: "ok" | "fail" }) {
	const ok = status === "ok";
	return (
		<main className="min-h-screen w-full flex items-center justify-center bg-background">
			<div className="w-full max-w-[450px] bg-surface border border-border shadow-sm rounded-xl p-8 md:p-10 shadow-2xl relative z-10 mx-auto flex flex-col items-center gap-6">
				<div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
					<svg
						className="w-8 h-8 text-primary-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</div>
				<Alert
					variant={ok ? "success" : "error"}
					message={
						ok
							? "Tu correo fue verificado. Ya puedes iniciar sesión."
							: "El enlace no es válido o expiró. Solicita uno nuevo e inicia sesión."
					}
				/>
				<Link
					href="/login"
					className="font-semibold text-primary hover:text-blue-400 transition-colors min-h-[44px] inline-flex items-center focus-visible:outline-2 focus-visible:outline-[#2F5B8A] focus-visible:outline-offset-2"
				>
					Inicia sesión
				</Link>
			</div>
		</main>
	);
}

export default async function VerifyPage({
	searchParams,
}: {
	searchParams: Promise<VerifySearchParams>;
}) {
	const params = await searchParams;
	const raw = params.token;
	const token = Array.isArray(raw) ? raw[0] : raw;
	if (!token) {
		const status = Array.isArray(params.status) ? params.status[0] : params.status;
		if (status === "ok" || status === "fail") {
			return <VerifyCard status={status} />;
		}
		redirect("/verify?status=fail");
	}
	try {
		const pb = await createPocketBaseClient();
		await pb.collection("users").confirmVerification(token);
	} catch {
		redirect("/verify?status=fail");
	}
	redirect("/verify?status=ok");
}
