"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resendVerificationSchema, ResendVerificationValues } from "@/lib/schemas";
import { resendVerification } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";

const RESEND_ACK =
	"Si el correo está registrado y pendiente de verificación, te enviamos un enlace.";
const SPAM_HINT = "Si no lo ves en unos minutos, revisa Spam o Correo no deseado.";

export function ResendVerificationForm() {
	const [isPending, startTransition] = useTransition();
	const [submitted, setSubmitted] = useState(false);
	const ackRef = useRef<HTMLDivElement>(null);
	const form = useForm<ResendVerificationValues>({
		resolver: zodResolver(resendVerificationSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
		},
	});
	const emailError = form.formState.errors.email;

	useEffect(() => {
		if (submitted) ackRef.current?.focus();
	}, [submitted]);

	const onSubmit = (data: ResendVerificationValues) => {
		startTransition(async () => {
			try {
				await resendVerification(data.email);
			} catch {
				// Enumeration-neutral: the ack below is identical for every outcome.
			}
			setSubmitted(true);
		});
	};

	return (
		<div className="w-full max-w-[450px] bg-surface border border-border shadow-sm rounded-xl p-8 md:p-10 shadow-2xl animate-fade-in relative z-10 mx-auto">
			<div className="mb-8 text-center">
				<h1 className="text-2xl font-bold text-foreground mb-2">Reenviar verificación</h1>
				<p id="resend-email-hint" className="text-muted-foreground text-sm">
					Ingresa tu correo para recibir un nuevo enlace de verificación.
				</p>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="space-y-2">
					<label htmlFor="email" className="text-sm font-medium text-foreground ml-1">
						Correo electrónico
					</label>
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Mail className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
						</div>
						<input
							{...form.register("email")}
							id="email"
							type="email"
							autoComplete="email"
							placeholder="nombre@ejemplo.com"
							aria-invalid={emailError ? true : undefined}
							aria-describedby={emailError ? "resend-email-error" : "resend-email-hint"}
							className={cn(
								"block w-full pl-10 pr-3 py-3 bg-surface border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
								emailError ? "border-destructive focus:ring-destructive" : "border-input",
							)}
						/>
					</div>
					{emailError && (
						<p id="resend-email-error" role="alert" className="text-xs text-destructive ml-1">
							{emailError.message}
						</p>
					)}
				</div>

				<button
					type="submit"
					disabled={!form.formState.isValid || isPending}
					style={{ minHeight: 44 }}
					className="w-full min-h-[44px] py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2F5B8A] focus-visible:outline-offset-2"
				>
					{isPending ? (
						<Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
					) : (
						<span>Enviar enlace</span>
					)}
				</button>
			</form>

			{submitted && (
				<div ref={ackRef} tabIndex={-1} className="mt-6 focus:outline-none">
					<Alert variant="info" message={`${RESEND_ACK} ${SPAM_HINT}`} />
				</div>
			)}

			{/* Footer Link */}
			<div className="mt-8 pt-6 border-t border-border text-center">
				<p className="text-sm text-foreground-muted">
					<Link
						href="/login"
						className="font-semibold text-primary hover:text-blue-400 transition-colors focus-visible:outline-2 focus-visible:outline-[#2F5B8A] focus-visible:outline-offset-2"
					>
						Volver a iniciar sesión
					</Link>
				</p>
			</div>
		</div>
	);
}
