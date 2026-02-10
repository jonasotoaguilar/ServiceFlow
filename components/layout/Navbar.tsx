"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

export function Navbar() {
	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;

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
					<button
						onClick={() => logout()}
						className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2"
					>
						<span>Salir</span>
						<LogOut className="w-4 h-4" />
					</button>
				</div>
			</div>
		</header>
	);
}
