"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { logout } from "@/app/actions/auth";

interface NavbarProps {
	user?: {
		name: string;
		email?: string | null;
	} | null;
}

export function Navbar({ user }: Readonly<NavbarProps>) {
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

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
		<header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Branding */}
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
							<svg
								className="w-6 h-6 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						</div>
						<div>
							<h1 className="text-xl font-bold tracking-tight text-white">
								ServiceFlow
							</h1>
							<p className="text-xs text-slate-400 font-medium">
								Gestión servicios técnicos
							</p>
						</div>
					</div>

					{/* Nav Links */}
					<nav className="hidden md:flex items-center gap-8">
						<Link
							href="/dashboard"
							className={`text-sm font-medium transition-colors ${
								isActive("/dashboard")
									? "text-primary border-b-2 border-primary pb-1"
									: "text-slate-400 hover:text-primary"
							}`}
						>
							Servicios
						</Link>
						<Link
							href="/locations"
							className={`text-sm font-medium transition-colors ${
								isActive("/locations")
									? "text-primary border-b-2 border-primary pb-1"
									: "text-slate-400 hover:text-primary"
							}`}
						>
							Sedes
						</Link>
						<Link
							href="/locationLogs"
							className={`text-sm font-medium transition-colors ${
								isActive("/locationLogs")
									? "text-primary border-b-2 border-primary pb-1"
									: "text-slate-400 hover:text-primary"
							}`}
						>
							Movimientos
						</Link>
					</nav>

					{/* Logout Button */}
					{/* User Menu */}
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setShowDropdown(!showDropdown)}
							className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all group"
						>
							<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
								<User className="w-4 h-4" />
							</div>
							<span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors hidden md:block">
								{user?.name || "Usuario"}
							</span>
							<ChevronDown
								className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
									showDropdown ? "rotate-180" : ""
								}`}
							/>
						</button>

						{/* Dropdown */}
						{showDropdown && (
							<div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
								<div className="px-4 py-3 border-b border-white/5 md:hidden">
									<p className="text-sm font-medium text-white truncate">
										{user?.name || "Usuario"}
									</p>
									{user?.email && (
										<p className="text-xs text-slate-400 truncate mt-0.5">
											{user.email}
										</p>
									)}
								</div>

								<button
									onClick={() => logout()}
									className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
								>
									<LogOut className="w-4 h-4" />
									Cerrar Sesión
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
