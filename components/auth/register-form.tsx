"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterValues } from "@/lib/schemas";
import { register } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function RegisterForm() {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();

	const form = useForm<RegisterValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: RegisterValues) => {
		setError(null);
		startTransition(async () => {
			const formData = new FormData();
			formData.append("name", data.name);
			formData.append("email", data.email);
			formData.append("password", data.password);

			const result = await register(formData);

			if (result?.error) {
				setError(result.error);
			} else {
				router.push("/");
			}
		});
	};

	return (
		<div className="w-full max-w-[450px] glass-card rounded-xl p-8 shadow-2xl animate-fade-in relative z-10 mx-auto">
			{/* Logo Section */}
			<div className="flex flex-col items-center mb-8">
				<div className="bg-primary p-3 rounded-lg mb-4 flex items-center justify-center shadow-lg shadow-primary/20">
					<svg
						className="w-8 h-8 text-primary-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				</div>
				<h1 className="text-2xl font-bold text-foreground">
					ServiceFlow
				</h1>
				<p className="text-muted-foreground text-sm mt-1">
					Gestión de servicios técnicos
				</p>
			</div>

			{/* Title */}
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-foreground">
					Crear Cuenta
				</h2>
				<p className="text-sm text-muted-foreground">
					Completa tus datos para empezar
				</p>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{/* Name Field */}
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-foreground mb-1.5"
					>
						Nombre Completo
					</label>
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<User className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
						</div>
						<input
							{...form.register("name")}
							id="name"
							type="text"
							placeholder="Ej. Juan Pérez"
							className={cn(
								"block w-full pl-10 pr-3 py-2.5 bg-surface border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm",
								form.formState.errors.name
									? "border-destructive focus:ring-destructive"
									: "border-input"
							)}
						/>
					</div>
					{form.formState.errors.name && (
						<p className="text-xs text-destructive mt-1">
							{form.formState.errors.name.message}
						</p>
					)}
				</div>

				{/* Email Field */}
				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-foreground mb-1.5"
					>
						Correo Electrónico
					</label>
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Mail className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
						</div>
						<input
							{...form.register("email")}
							id="email"
							type="email"
							placeholder="correo@ejemplo.com"
							className={cn(
								"block w-full pl-10 pr-3 py-2.5 bg-surface border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm",
								form.formState.errors.email
									? "border-destructive focus:ring-destructive"
									: "border-input"
							)}
						/>
					</div>
					{form.formState.errors.email && (
						<p className="text-xs text-destructive mt-1">
							{form.formState.errors.email.message}
						</p>
					)}
				</div>

				{/* Password Field */}
				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-foreground mb-1.5"
					>
						Contraseña
					</label>
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
								"block w-full pl-10 pr-3 py-2.5 bg-surface border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm",
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
						<p className="text-xs text-destructive mt-1">
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
					className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg shadow-lg shadow-primary/30 transition-all active:scale-[0.98] mt-2 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPending ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<>
							<span>Registrarse</span>
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
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/>
							</svg>
						</>
					)}
				</button>
			</form>

			<div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
				<p className="text-sm text-gray-500 dark:text-gray-400">
					¿Ya tienes cuenta?{" "}
					<Link
						href="/login"
						className="text-primary font-semibold hover:underline decoration-2 underline-offset-4"
					>
						Inicia sesión
					</Link>
				</p>
			</div>
		</div>
	);
}
