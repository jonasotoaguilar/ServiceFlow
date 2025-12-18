import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Garantías",
  description: "Gestión de garantías y servicios",
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
          inter.className,
          "min-h-screen bg-zinc-950 font-sans antialiased text-zinc-50"
        )}
      >
        {children}
      </body>
    </html>
  );
}
