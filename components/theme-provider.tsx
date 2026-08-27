"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (t: Theme) => void;
	systemTheme: "light" | "dark" | undefined;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
	const root = document.documentElement;
	if (resolved === "dark") root.classList.add("dark");
	else root.classList.remove("dark");
	root.style.colorScheme = resolved;
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "theme",
}: Readonly<{
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
	attribute?: string;
	enableSystem?: boolean;
}>) {
	const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
	const [systemTheme, setSystemTheme] = React.useState<"light" | "dark" | undefined>(undefined);
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
		try {
			const stored = (localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
			setThemeState(stored);
			setSystemTheme(getSystemTheme());
		} catch {}
		// listen system changes when theme is system
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			setSystemTheme(mql.matches ? "dark" : "light");
		};
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [defaultTheme, storageKey]);

	const resolvedTheme: "light" | "dark" = React.useMemo(() => {
		if (theme === "system") return systemTheme ?? getSystemTheme();
		return theme as "light" | "dark";
	}, [theme, systemTheme]);

	React.useEffect(() => {
		if (!mounted) return;
		applyTheme(resolvedTheme);
	}, [resolvedTheme, mounted]);

	const setTheme = React.useCallback(
		(next: Theme) => {
			setThemeState(next);
			try {
				localStorage.setItem(storageKey, next);
			} catch {}
			const resolved = next === "system" ? getSystemTheme() : (next as "light" | "dark");
			applyTheme(resolved);
		},
		[storageKey],
	);

	const value = React.useMemo(
		() => ({ theme, resolvedTheme, setTheme, systemTheme }),
		[theme, resolvedTheme, setTheme, systemTheme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const ctx = React.useContext(ThemeContext);
	if (!ctx) {
		// fallback for outside provider (e.g., tests) to avoid crash
		return {
			theme: "system",
			resolvedTheme: "light",
			setTheme: () => {},
			systemTheme: undefined,
		};
	}
	return ctx;
}
