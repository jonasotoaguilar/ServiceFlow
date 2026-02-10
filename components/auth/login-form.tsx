"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginValues } from "@/lib/schemas";
import { login } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function LoginForm() {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();

	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginValues) => {
		setError(null);
		startTransition(async () => {
			const formData = new FormData();
			formData.append("email", data.email);
			formData.append("password", data.password);

			const result = await login(formData);

			if (result?.error) {
				setError(result.error);
			} else {
				router.push("/");
			}
		});
	};



	return (
		<div className="w-full max-w-[450px] glass-card rounded-xl p-8 md:p-10 shadow-2xl animate-fade-in relative z-10 mx-auto">
			{/* Branding */}
			<div className="flex flex-col items-center mb-8">
				<div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
					{/* Replace with your logo or icon */}
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
				<h1 className="text-3xl font-bold text-foreground mb-2">
					Bienvenido
				</h1>
				<p className="text-muted-foreground text-sm text-center">
					Inicia sesión para continuar en ServiceFlow
				</p>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{/* Email Field */}
				<div className="space-y-2">
					<label
						htmlFor="email"
						className="text-sm font-medium text-foreground ml-1"
					>
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
							placeholder="nombre@ejemplo.com"
							className={cn(
								"block w-full pl-10 pr-3 py-3 bg-surface border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
								form.formState.errors.email
									? "border-destructive focus:ring-destructive"
									: "border-input"
							)}
						/>
					</div>
					{form.formState.errors.email && (
						<p className="text-xs text-destructive ml-1">
							{form.formState.errors.email.message}
						</p>
					)}
				</div>

				{/* Password Field */}
				<div className="space-y-2">
					<div className="flex justify-between items-center px-1">
						<label
							htmlFor="password"
							className="text-sm font-medium text-foreground"
						>
							Contraseña
						</label>
					</div>
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
						</div>
						<input
							{...form.register("password")}
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="••••••••"
							className={cn(
								"block w-full pl-10 pr-12 py-3 bg-surface border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
								form.formState.errors.password
									? "border-destructive focus:ring-destructive"
									: "border-input"
							)}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
						>
							{showPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
					{form.formState.errors.password && (
						<p className="text-xs text-destructive ml-1">
							{form.formState.errors.password.message}
						</p>
					)}
				</div>

				{error && (
					<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center justify-center animate-shake border border-destructive/20">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={isPending}
					className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPending ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<>
							<span>Ingresar</span>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 8l4 4m0 0l-4 4m4-4H3"
								/>
							</svg>
						</>
					)}
				</button>
			</form>

			{/* Footer Link */}
			<div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 text-center">
				<p className="text-sm text-slate-600 dark:text-slate-400">
					¿No tienes cuenta?{" "}
					<Link
						href="/register"
						className="font-semibold text-primary hover:text-blue-400 transition-colors"
					>
						Regístrate
					</Link>
				</p>
			</div>
		</div>
	);
}
