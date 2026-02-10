import { Fira_Sans, Fira_Code } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";

const firaSans = Fira_Sans({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-fira-sans",
});

const firaCode = Fira_Code({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-fira-code",
});

export const viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "#0f172a" },
	],
};

export const metadata = {
	title: "ServiceFlow",
	description: "Gestión inteligente de servicios y servicios",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" className="dark" suppressHydrationWarning>
			<body
				className={cn(
					firaSans.variable,
					firaCode.variable,
					"min-h-screen w-full bg-background font-sans antialiased text-foreground",
				)}
			>
				{children}
			</body>
		</html>
	);
}
