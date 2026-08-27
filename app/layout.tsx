import { Fira_Sans, Fira_Code } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import "@/bones/registry";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

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
	maximumScale: 5,
	userScalable: true,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fafafa" },
		{ media: "(prefers-color-scheme: dark)", color: "#fafafa" },
	],
};

export const metadata = {
	title: "ServiceFlow",
	description: "Gestión inteligente de servicios y servicios",
};

const themeInitScript = `(function(){try{var k='theme';var d='system';var v=localStorage.getItem(k)||d;var m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var t=v==='system'?m:v;if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" suppressHydrationWarning>
			<body
				className={cn(
					firaSans.variable,
					firaCode.variable,
					"min-h-screen w-full bg-background font-sans antialiased text-foreground",
				)}
			>
				<Script id="theme-init" strategy="beforeInteractive">
					{themeInitScript}
				</Script>
				<ThemeProvider defaultTheme="system" attribute="class" enableSystem>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
