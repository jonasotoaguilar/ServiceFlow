"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { LogOut, User, ChevronDown, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { logout } from "@/app/actions/auth";
import { BodegaTecnicaMark } from "@/components/brand/bodega-tecnica-mark";

interface NavbarProps {
	user?: {
		name: string;
		email?: string | null;
	} | null;
}

export function Navbar({ user }: Readonly<NavbarProps>) {
	const [showDropdown, setShowDropdown] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { theme, setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<header className="border-b border-border bg-surface sticky top-0 z-40">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Branding — Bodega Técnica lockup */}
					<div className="flex items-center gap-4">
						<BodegaTecnicaMark />
					</div>

					{/* Nav Links */}
					<nav className="hidden md:flex items-center gap-8">
						<Link
							href="/dashboard"
							className={`text-sm font-medium transition-colors ${
								isActive("/dashboard")
									? "text-foreground border-b-2 border-primary pb-1"
									: "text-foreground-muted hover:text-primary"
							}`}
						>
							Servicios
						</Link>
						<Link
							href="/service-events"
							className={`text-sm font-medium transition-colors ${
								isActive("/service-events")
									? "text-foreground border-b-2 border-primary pb-1"
									: "text-foreground-muted hover:text-primary"
							}`}
						>
							Registro
						</Link>
						<Link
							href="/locations"
							className={`text-sm font-medium transition-colors ${
								isActive("/locations")
									? "text-foreground border-b-2 border-primary pb-1"
									: "text-foreground-muted hover:text-primary"
							}`}
						>
							Sedes
						</Link>
					</nav>

					<div className="flex items-center gap-2">
						<button
							type="button"
							aria-label="Cambiar tema"
							onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
							className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
						>
							{mounted ? (
								resolvedTheme === "dark" ? (
									<Sun className="h-5 w-5" />
								) : (
									<Moon className="h-5 w-5" />
								)
							) : (
								<Sun className="h-5 w-5 opacity-0" />
							)}
						</button>
						<button
							className="md:hidden p-2 text-foreground-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface-muted"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							aria-label="Toggle menu"
						>
							{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
						</button>

						{/* User Menu */}
						<div className="relative" ref={dropdownRef}>
							<button
								type="button"
								aria-label="Menú de usuario"
								aria-expanded={showDropdown}
								onClick={() => setShowDropdown(!showDropdown)}
								className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-muted transition-all group"
							>
								<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
									<User className="w-4 h-4" />
								</div>
								<span className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors hidden md:block">
									{user?.name || "Usuario"}
								</span>
								<ChevronDown
									className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${
										showDropdown ? "rotate-180" : ""
									}`}
								/>
							</button>

							{/* Dropdown */}
							{showDropdown && (
								<div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-surface border border-border shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
									<div className="px-4 py-3 border-b border-border md:hidden">
										<p className="text-sm font-medium text-foreground truncate">
											{user?.name || "Usuario"}
										</p>
										{user?.email && (
											<p className="text-xs text-foreground-muted truncate mt-0.5">{user.email}</p>
										)}
									</div>

									<button
										onClick={() => logout()}
										className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
									>
										<LogOut className="w-4 h-4" />
										Cerrar Sesión
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden py-4 border-t border-border space-y-1 bg-surface absolute top-16 left-0 right-0 shadow-xl animate-in slide-in-from-top-5 fade-in duration-200 border-b border-border z-50">
						<Link
							href="/dashboard"
							onClick={() => setIsMobileMenuOpen(false)}
							className={`flex items-center gap-3 px-6 py-3 text-base font-medium transition-colors ${
								isActive("/dashboard")
									? "bg-primary/10 text-foreground"
									: "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
							}`}
						>
							Servicios
						</Link>
						<Link
							href="/service-events"
							onClick={() => setIsMobileMenuOpen(false)}
							className={`flex items-center gap-3 px-6 py-3 text-base font-medium transition-colors ${
								isActive("/service-events")
									? "bg-primary/10 text-primary"
									: "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
							}`}
						>
							Registro
						</Link>
						<Link
							href="/locations"
							onClick={() => setIsMobileMenuOpen(false)}
							className={`flex items-center gap-3 px-6 py-3 text-base font-medium transition-colors ${
								isActive("/locations")
									? "bg-primary/10 text-primary"
									: "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
							}`}
						>
							Sedes
						</Link>
					</div>
				)}
			</div>
		</header>
	);
}
