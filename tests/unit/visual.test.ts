import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/components/theme-provider", async () => {
	const actual: any = await vi.importActual("@/components/theme-provider");
	return {
		...actual,
		useTheme: () => ({
			theme: "light",
			setTheme: vi.fn(),
			resolvedTheme: "light",
			systemTheme: "light",
		}),
		ThemeProvider: ({ children }: any) => children,
	};
});
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";

function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
function exists(rel: string): boolean {
	return fs.existsSync(path.join(process.cwd(), rel));
}

// Safety: local theme via next/script beforeInteractive — next-themes removed per Next 16 docs
describe("visual surfaces + theme — 2.5 RED (no dark glass, destructive, UTC date, IconButton, opaque modal, local theme toggle)", () => {
	describe("destructive token + aliases in globals.css", () => {
		it("globals exposes --color-destructive = #991b1b (cancelled-fg) and aliases muted-foreground / input / primary-foreground", () => {
			const css = read("styles/globals.css");
			const lower = css.toLowerCase();
			// destructive must be defined via --color-destructive (tailwind @theme)
			expect(lower).toMatch(/--color-destructive\s*:\s*#991b1b/);
			// aliases required so text-destructive / border-destructive / text-muted-foreground etc resolve
			expect(css).toMatch(/--color-muted-foreground|--color-muted_foreground/);
			expect(css).toMatch(/--color-input/);
			expect(css).toMatch(/--color-primary-foreground|--color-on-primary/);
			// destructive bg utility should work via --color-destructive, not hardcoded elsewhere only
			// also ensure cancelled-fg token still present
			expect(lower).toContain("#991b1b");
		});

		it("globals destructive triangulate — error surface uses bg-destructive/10 text-destructive mapping (file content second case)", () => {
			const css = read("styles/globals.css");
			// Must have at least one of the aliases map to a concrete token value, not empty
			expect(css).toContain("--color-destructive");
			expect(css).toContain("--color-input");
			// Check that destructive is inside @theme block (or at least defined before .dark)
			const idxTheme = css.indexOf("@theme");
			const idxDestructive = css.toLowerCase().indexOf("--color-destructive");
			expect(idxTheme).toBeGreaterThanOrEqual(0);
			expect(idxDestructive).toBeGreaterThan(idxTheme);
		});

		it('.dark token overrides exist via .dark { } (not html.dark) for local theme attribute="class"', () => {
			const css = read("styles/globals.css");
			expect(css).toContain(".dark");
			expect(css).not.toMatch(/html\.dark/);
			// .dark block must override at least background/surface/foreground/border
			const darkIdx = css.indexOf(".dark");
			expect(darkIdx).toBeGreaterThan(0);
			const afterDark = css.slice(darkIdx, darkIdx + 2000);
			expect(afterDark).toMatch(/--color-background|--background/);
			expect(afterDark).toMatch(/--color-surface|--surface/);
			expect(afterDark).toMatch(/--color-foreground|--foreground/);
		});
	});

	describe("leftover dark classes stripped — ServicesTable, locationsManager, logsManager, login/register, ServicesModal", () => {
		const banned = [
			"text-white",
			"bg-slate-800",
			"text-slate-400",
			"glass-card",
			"glass-effect",
			"backdrop-blur",
		];
		const targets = [
			"components/services/ServicesTable.tsx",
			"app/(app)/locations/locationsManager.tsx",
			"app/(app)/service-events/serviceEventsManager.tsx",
			"components/auth/login-form.tsx",
			"components/auth/register-form.tsx",
			"app/login/page.tsx",
			"app/register/page.tsx",
			"components/services/ServicesModal.tsx",
		];
		for (const rel of targets) {
			it(`${rel} has NO banned dark/glass classes: ${banned.join(", ")}`, () => {
				if (!exists(rel)) {
					// If file moved, fail explicitly
					expect(exists(rel), `missing ${rel}`).toBe(true);
					return;
				}
				const src = read(rel);
				for (const needle of banned) {
					expect(src, `${rel} must NOT contain ${needle}`).not.toContain(needle);
				}
			});
		}

		it("targets also have no bg-slate-800/50 variant or text-slate-300 dark legacy (triangulate second banned list)", () => {
			const extraBanned = [
				"bg-slate-800/50",
				"bg-slate-800/40",
				"border-slate-700",
				"border-white/5",
				"text-slate-300",
			];
			const triTargets = [
				"components/services/ServicesTable.tsx",
				"app/(app)/locations/locationsManager.tsx",
				"app/(app)/service-events/serviceEventsManager.tsx",
				"components/services/ServicesModal.tsx",
			];
			for (const rel of triTargets) {
				const src = read(rel);
				for (const needle of extraBanned) {
					expect(src, `${rel} must NOT contain ${needle}`).not.toContain(needle);
				}
			}
		});

		it("surfaces use Taller Claro opaque tokens bg-surface / bg-background / border-border (positive check)", () => {
			const positives = [
				"components/services/ServicesTable.tsx",
				"app/(app)/locations/locationsManager.tsx",
				"app/(app)/service-events/serviceEventsManager.tsx",
			];
			for (const rel of positives) {
				const src = read(rel);
				expect(src, `${rel} must use bg-surface or bg-background`).toMatch(
					/bg-surface|bg-background/,
				);
				expect(src, `${rel} must use border-border`).toMatch(/border-border/);
			}
		});
	});

	describe("login/register no glow-orb / no glass (Taller Claro opaque)", () => {
		it("app/login/page.tsx and app/register/page.tsx have no glow-orb / glass-card / backdrop-blur", () => {
			for (const rel of ["app/login/page.tsx", "app/register/page.tsx"]) {
				const src = read(rel);
				expect(src).not.toContain("glow-orb");
				expect(src).not.toContain("glass-card");
				expect(src).not.toContain("glass-effect");
				expect(src).not.toContain("backdrop-blur");
				// Should be light opaque center, not absolute orbs
				expect(src).toMatch(/bg-background|bg-surface/);
			}
		});
		it("login-form and register-form root card is opaque bg-surface border-border (triangulate)", () => {
			for (const rel of ["components/auth/login-form.tsx", "components/auth/register-form.tsx"]) {
				const src = read(rel);
				expect(src).not.toContain("glass-card");
				expect(src).toMatch(/bg-surface/);
				expect(src).toMatch(/border-border|border-input/);
			}
		});
	});

	describe("lib/format-date.ts calendar-stable (UTC vs Chile hydration)", () => {
		it("lib/format-date.ts exists and exports formatEntryDate / formatDate calendar-stable", async () => {
			expect(exists("lib/format-date.ts")).toBe(true);
			const mod: any = await import(/* @vite-ignore */ "@/lib/format-date");
			const fn = mod.formatEntryDate ?? mod.formatDate ?? mod.formatCalendarDate;
			expect(typeof fn).toBe("function");
		});

		it('formatEntryDate("2024-01-15") always renders same calendar day regardless of timezone offset (no parseISO UTC shift)', async () => {
			const mod: any = await import(/* @vite-ignore */ "@/lib/format-date");
			const fmt = mod.formatEntryDate ?? mod.formatDate ?? mod.formatCalendarDate;
			// 15 Jan 2024 should stay 15, not 14 if UTC parsing + Chile UTC-3
			const out = fmt("2024-01-15");
			// Should contain 15 and year 2024
			expect(out).toMatch(/15/);
			expect(out).toMatch(/2024/);
			// Month abbreviated — accept Spanish or English jan/ene
			expect(out.toLowerCase()).toMatch(/ene|jan/);
			// Also test ISO with time component still calendar-stable
			const out2 = fmt("2024-01-15T00:00:00.000Z");
			expect(out2).toBe(out);
		});

		it("formatEntryDate triangulate — different dates produce different outputs, and uses date part before T only", async () => {
			const mod: any = await import(/* @vite-ignore */ "@/lib/format-date");
			const fmt = mod.formatEntryDate ?? mod.formatDate ?? mod.formatCalendarDate;
			const a = fmt("2024-12-01");
			const b = fmt("2024-12-02");
			expect(a).not.toBe(b);
			expect(a).toMatch(/01/);
			expect(b).toMatch(/02/);
			// Both contain same month/year but different day
			expect(a).toMatch(/2024/);
			expect(b).toMatch(/2024/);
			// Time component ignored: 2024-12-01T23:59:59.999Z still 01
			const c = fmt("2024-12-01T23:59:59.999Z");
			expect(c).toBe(a);
		});

		it('ServicesTable uses lib/format-date instead of format(parseISO(entryDate),"dd MMM yyyy")', () => {
			const src = read("components/services/ServicesTable.tsx");
			expect(src).toContain("format-date");
			expect(src).toMatch(/formatEntryDate|formatDate/);
			// Old hydration-prone pattern removed
			expect(src).not.toMatch(/format\(parseISO\(.*entryDate.*\)/);
		});
	});

	describe("shared IconButton h-11 w-11 always visible (view=neutral edit=primary delete=danger ban=warning)", () => {
		it("components/ui/icon-button.tsx exists and is 44px (h-11 w-11) with variants neutral/primary/danger/warning", async () => {
			expect(exists("components/ui/icon-button.tsx")).toBe(true);
			const src = read("components/ui/icon-button.tsx");
			expect(src).toMatch(/h-11/);
			expect(src).toMatch(/w-11/);
			// variants required
			expect(src).toMatch(/neutral/);
			expect(src).toMatch(/primary/);
			expect(src).toMatch(/danger|destructive/);
			expect(src).toMatch(/warning|ban/);
			// Should forward aria-label and not be hidden via opacity-0 hover-only pattern from Sedes/dashboard
			expect(src).not.toContain("opacity-60");
			expect(src).not.toContain("group-hover:opacity-100");
		});

		it("IconButton renders with correct size and variant classes (behavioral)", async () => {
			const { IconButton } = await import(/* @vite-ignore */ "@/components/ui/icon-button");
			const { container } = render(
				React.createElement(
					IconButton as any,
					{ "aria-label": "Ver detalles", variant: "neutral" },
					React.createElement("span", null, "i"),
				),
			);
			const btn = container.querySelector("button");
			expect(btn).not.toBeNull();
			expect(btn!.className).toMatch(/h-11/);
			expect(btn!.className).toMatch(/w-11/);
			// neutral variant should have border-visible classes (not p-1.5 tiny)
			expect(btn!.className).not.toContain("p-1.5");
			// should have aria-label
			expect(btn).toHaveAttribute("aria-label", "Ver detalles");
		});

		it("IconButton variant mapping triangulate — primary vs danger have different color tokens", async () => {
			const { IconButton } = await import(/* @vite-ignore */ "@/components/ui/icon-button");
			const { container: c1 } = render(
				React.createElement(IconButton as any, { "aria-label": "Editar", variant: "primary" }, "e"),
			);
			const { container: c2 } = render(
				React.createElement(
					IconButton as any,
					{ "aria-label": "Eliminar", variant: "danger" },
					"d",
				),
			);
			const b1 = c1.querySelector("button")!;
			const b2 = c2.querySelector("button")!;
			// Different variants must not be identical className
			expect(b1.className).not.toBe(b2.className);
			// primary should contain primary token, danger should contain destructive/red token
			expect(b1.className.toLowerCase()).toMatch(/primary/);
			expect(b2.className.toLowerCase()).toMatch(/destructive|red|danger/);
		});

		it("ServicesTable dashboard row actions use IconButton (not tiny p-1.5 gray hover-only)", () => {
			const src = read("components/services/ServicesTable.tsx");
			expect(src).toContain("IconButton");
			expect(src).toMatch(
				/from "@\/components\/ui\/icon-button"|from '@\/components\/ui\/icon-button'|\.\.\/ui\/icon-button/,
			);
			expect(src).not.toContain("opacity-60 group-hover:opacity-100");
			expect(src).not.toContain('className="p-1.5 text-slate-400');
			// variants used: view=neutral, edit=primary, delete=danger
			expect(src).toMatch(/variant="neutral"|variant='neutral'/);
			expect(src).toMatch(/variant="primary"|variant='primary'/);
			expect(src).toMatch(/variant="danger"|variant='danger'/);
		});

		it("Sedes locationsManager row actions use IconButton with bordered colored always-visible (ban=warning) triangulate", () => {
			const src = read("app/(app)/locations/locationsManager.tsx");
			expect(src).toContain("IconButton");
			expect(src).not.toContain("opacity-60");
			expect(src).toMatch(
				/variant="neutral"|variant='neutral'|variant="primary"|variant='primary'/,
			);
			expect(src).toMatch(/variant="danger"|variant='danger'|variant="warning"|variant='warning'/);
		});
	});

	describe("ServicesModal opaque Dialog — no glass-effect / bg-black/60 backdrop-blur-sm, hide status on create, Entregada, solid CTA", () => {
		it("ServicesModal does NOT use own bg-black/60 + backdrop-blur-sm + glass-effect overlay", () => {
			const src = read("components/services/ServicesModal.tsx");
			expect(src).not.toContain("bg-black/60");
			expect(src).not.toContain("backdrop-blur-sm");
			expect(src).not.toContain("glass-effect");
			expect(src).not.toContain("backdrop-blur");
		});

		it("ServicesModal uses opaque Dialog (or same overlay bg-zinc-900/40 NO blur, panel bg-surface border-border)", () => {
			const src = read("components/services/ServicesModal.tsx");
			// Either imports Dialog or reproduces dialog overlay exactly
			const usesDialog =
				src.includes('from "@/components/ui/dialog"') ||
				src.includes("from '@/components/ui/dialog'") ||
				src.includes("<Dialog");
			const usesOverlay = src.includes("bg-zinc-900/40") || src.includes("bg-black/30");
			expect(usesDialog || usesOverlay).toBe(true);
			if (usesDialog) {
				expect(src).toMatch(/<Dialog/);
				// Title should be passed to Dialog
				expect(src).toMatch(/title=\{|title="/);
			}
			// If still manual overlay, ensure NO blur and panel is bg-surface
			if (!usesDialog) {
				expect(src).not.toContain("backdrop-blur");
			}
			// Panel should be bg-surface per spec
			expect(src).toMatch(/bg-surface|bg-white/);
		});

		it("Create flow hides status picker (always pending) — no radio status when !isEditing", () => {
			const src = read("components/services/ServicesModal.tsx");
			// Unit 8 lifecycle: generic create/edit hides status picker for both (status via dedicated action)
			// After fix, no status radio group should exist at all; create is always pending, edit has no status/location
			expect(src).not.toMatch(/value="pending"[\s\S]*?value="completed"/);
			// Location must remain on create (!isEditing guard) and hidden on edit
			expect(src).toMatch(/!isEditing[\s\S]*?htmlFor="locationId"/);
			// Still should have Entregada via other UI (table/details) not via status radios
			expect(src).toContain("Entregada");
		});

		it("ServicesModal label Completada → Entregada (not Completada) and always pending on create (triangulate)", () => {
			const src = read("components/services/ServicesModal.tsx");
			expect(src).toContain("Entregada");
			expect(src).not.toMatch(/>Completada</);
			expect(src).not.toContain('"Completada"');
			expect(src).not.toContain("'Completada'");
			// Create should always be pending — defaultValues status pending and no picker on create ensures it
			expect(src).toMatch(/status:\s*"pending"/);
		});

		it("CTA gradient → solid bg-primary text-on-primary (or text-primary-foreground) no linear-gradient", () => {
			const src = read("components/services/ServicesModal.tsx");
			expect(src).not.toContain("bg-linear-to-r");
			expect(src).not.toContain("from-blue-600");
			expect(src).not.toContain("from-primary to-blue-600");
			// Solid CTA should use bg-primary and text-on-primary / text-primary-foreground
			expect(src).toMatch(/bg-primary/);
			expect(src).toMatch(/text-on-primary|text-primary-foreground|text-white/);
		});

		it("ServicesModal panel uses bg-surface border-border and not glass/border-white/10 (positive opaque check)", () => {
			const src = read("components/services/ServicesModal.tsx");
			// If using Dialog, panel is inside Dialog component which already is bg-white border-zinc-200 — but modal wrapper should not override with glass
			expect(src).not.toContain("border-white/10");
			expect(src).not.toContain("bg-white/5");
		});
	});

	describe("local ThemeProvider + next/script beforeInteractive + Navbar 44px toggle (system)", () => {
		it("app/layout.tsx wraps with ThemeProvider and next/script beforeInteractive (local theme, not next-themes)", () => {
			const src = read("app/layout.tsx");
			expect(src).toContain("ThemeProvider");
			expect(src).toMatch(
				/from "@\/components\/theme-provider"|from '@\/components\/theme-provider'/,
			);
			expect(src).not.toContain("next-themes");
			expect(src).toMatch(/from "next\/script"/);
			expect(src).toMatch(/strategy="beforeInteractive"/);
			expect(src).toMatch(/id="theme-init"/);
			expect(src).toContain("suppressHydrationWarning");
		});

		it("theme-provider is local context (no next-themes, no plain script) — triangulate", () => {
			const src = read("components/theme-provider.tsx");
			expect(src).not.toContain("next-themes");
			expect(src).not.toContain("NextThemesProvider");
			expect(src).not.toContain('createElement("script"');
			expect(src).toContain("ThemeContext");
			expect(src).toContain("localStorage");
			expect(src).toContain("matchMedia");
			expect(src).toContain("useTheme");
		});

		it("Navbar has 44px (h-11 w-11) theme toggle button for light/dark with aria-label", async () => {
			const src = read("components/layout/Navbar.tsx");
			expect(src).toMatch(/h-11|w-11|44px/);
			// Should have toggle using local useTheme
			expect(src).toMatch(/useTheme|setTheme|theme/);
			// Button should be 44px
			expect(src).toMatch(/h-11 w-11|w-11 h-11/);
			// Icons: Sun/Moon or similar for light/dark
			expect(src.toLowerCase()).toMatch(/sun|moon|theme/);
		});

		it("Navbar toggle is accessible and 44px hit target (behavioral) — renders toggle button", async () => {
			const mod = await import(/* @vite-ignore */ "@/components/layout/Navbar");
			const Navbar: any = (mod as any).Navbar ?? (mod as any).default;
			const { container } = render(
				React.createElement(Navbar, { user: { name: "T", email: "t@t.com" } }),
			);
			// Find button with theme aria-label
			const btns = Array.from(container.querySelectorAll("button"));
			const themeBtn = btns.find(
				(b) =>
					/theme|cambiar.*tema|toggle/i.test(b.getAttribute("aria-label") || "") ||
					b.className.includes("h-11"),
			);
			expect(themeBtn).toBeDefined();
			if (themeBtn) {
				expect(themeBtn.className).toMatch(/h-11/);
				expect(themeBtn.className).toMatch(/w-11/);
			}
		});
	});

	describe("semantic-token sweep — hardcoded white/slate hard fails theme switching (dialog, DetailsModal, textarea, confirmationDialog, leftover)", () => {
		describe("dialog.tsx — panel bg-surface text-foreground border-border, overlay bg-zinc-900/40, close token", () => {
			it("dialog panel uses bg-surface text-foreground border-border NOT bg-white border-zinc-200 text-zinc-900 (primary RED)", () => {
				const src = read("components/ui/dialog.tsx");
				// Forbidden hardcoded light-only
				expect(src, "dialog must NOT contain bg-white").not.toContain("bg-white");
				expect(src, "dialog must NOT contain border-zinc-200").not.toContain("border-zinc-200");
				expect(src, "dialog must NOT contain text-zinc-900").not.toContain("text-zinc-900");
				expect(src, "dialog must NOT contain dark:bg-zinc").not.toContain("dark:bg-zinc");
				// Required semantic tokens that .dark overrides
				expect(src, "dialog must use bg-surface").toContain("bg-surface");
				expect(src, "dialog must use text-foreground").toContain("text-foreground");
				expect(src, "dialog must use border-border").toContain("border-border");
			});

			it("dialog overlay is bg-zinc-900/40 and close button uses token colors (triangulate)", () => {
				const src = read("components/ui/dialog.tsx");
				// Overlay must be bg-zinc-900/40 per spec, not bg-black/30
				expect(src, "overlay must be bg-zinc-900/40").toContain("bg-zinc-900/40");
				expect(src, "overlay must NOT be bg-black/30").not.toContain("bg-black/30");
				// Close button token colors
				expect(src, "close must use text-foreground-muted").toMatch(
					/text-foreground-muted|text-foreground-subtle/,
				);
				expect(src, "close must use hover:bg-surface-muted or hover:text-foreground").toMatch(
					/hover:bg-surface-muted|hover:text-foreground/,
				);
				expect(src, "close must NOT use text-zinc-500").not.toContain("text-zinc-500");
				expect(src, "close must NOT use hover:text-zinc-900").not.toContain("hover:text-zinc-900");
			});
		});

		describe("ServicesDetailsModal — no slate/white/blue-500, tokens + Entregada + formatEntryDate", () => {
			it("DetailsModal has NO bg-slate-800/text-slate-100 and NO hardcoded blue-500 badges (primary RED)", () => {
				const src = read("components/services/ServicesDetailsModal.tsx");
				expect(src, "must NOT contain bg-slate-800").not.toContain("bg-slate-800");
				expect(src, "must NOT contain text-slate-100").not.toContain("text-slate-100");
				expect(src, "must NOT contain text-slate-200").not.toContain("text-slate-200");
				expect(src, "must NOT contain bg-slate-500/10").not.toContain("bg-slate-500/10");
				expect(src, "must NOT contain bg-white/5").not.toContain("bg-white/5");
				expect(src, "must NOT contain border-white/5").not.toContain("border-white/5");
				expect(src, "must NOT contain bg-blue-500").not.toContain("bg-blue-500");
				expect(src, "must NOT contain bg-emerald-500").not.toContain("bg-emerald-500");
				expect(src, "must NOT contain text-blue-950").not.toContain("text-blue-950");
			});

			it("DetailsModal uses semantic surface/status tokens and Entregada not Completada (triangulate)", () => {
				const src = read("components/services/ServicesDetailsModal.tsx");
				// Semantic tokens
				expect(src, "must use bg-surface-muted").toContain("bg-surface-muted");
				expect(src, "must use text-foreground").toContain("text-foreground");
				expect(src, "must use text-foreground-muted or subtle").toMatch(
					/text-foreground-muted|text-foreground-subtle/,
				);
				expect(src, "status must use bg-pending-bg or bg-ready-bg etc").toMatch(
					/bg-pending-bg|bg-ready-bg|bg-completed-bg|bg-cancelled-bg/,
				);
				expect(src, "status must use text-pending-fg or similar").toMatch(
					/text-pending-fg|text-ready-fg|text-completed-fg|text-cancelled-fg/,
				);
				// Terminology
				expect(src, "must contain Entregada").toContain("Entregada");
				expect(src, "must NOT contain Completada").not.toContain("Completada");
				// Dates via formatEntryDate
				expect(src, "must import formatEntryDate from lib/format-date").toMatch(
					/formatEntryDate|lib\/format-date/,
				);
				expect(src, "must NOT use raw format(parseISO(date)").not.toContain("format(parseISO");
			});
		});

		describe("textarea.tsx — border-input bg-surface text-foreground placeholder:foreground-subtle ring-ring", () => {
			it("textarea has NO bg-white and NO dark: dual palette (primary RED)", () => {
				const src = read("components/ui/textarea.tsx");
				expect(src, "must NOT contain bg-white").not.toContain("bg-white");
				expect(src, "must NOT contain border-zinc-200").not.toContain("border-zinc-200");
				expect(src, "must NOT contain placeholder:text-zinc-500").not.toContain(
					"placeholder:text-zinc-500",
				);
				expect(src, "must NOT contain dark:bg-zinc").not.toContain("dark:bg-zinc");
				expect(src, "must NOT contain dark:border-zinc").not.toContain("dark:border-zinc");
				expect(src, "must NOT contain text-zinc-900").not.toContain("text-zinc-900");
			});

			it("textarea uses semantic tokens border-input bg-surface text-foreground placeholder:text-foreground-subtle ring-ring (triangulate)", () => {
				const src = read("components/ui/textarea.tsx");
				expect(src, "must use border-input").toContain("border-input");
				expect(src, "must use bg-surface").toContain("bg-surface");
				expect(src, "must use text-foreground").toContain("text-foreground");
				expect(src, "must use placeholder:text-foreground-subtle").toContain(
					"placeholder:text-foreground-subtle",
				);
				expect(src, "must use ring-ring or focus-visible:ring-ring").toMatch(
					/ring-ring|focus-visible:ring-ring/,
				);
			});
		});

		describe("confirmationDialog.tsx — semantic tokens not zinc/white", () => {
			it("confirmationDialog has NO zinc hardcoded and NO bg-white/10 dual palette (primary RED)", () => {
				const src = read("components/ui/confirmationDialog.tsx");
				expect(src, "must NOT contain bg-zinc-900").not.toContain("bg-zinc-900");
				expect(src, "must NOT contain text-zinc-500").not.toContain("text-zinc-500");
				expect(src, "must NOT contain border-zinc-100").not.toContain("border-zinc-100");
				expect(src, "must NOT contain dark:bg-zinc").not.toContain("dark:bg-zinc");
				expect(src, "must NOT contain hover:bg-white/10").not.toContain("hover:bg-white/10");
				expect(src, "must NOT contain bg-white").not.toContain("bg-white");
			});

			it("confirmationDialog uses surface/foreground/border tokens and bg-surface-muted (triangulate)", () => {
				const src = read("components/ui/confirmationDialog.tsx");
				expect(src, "must use bg-surface or bg-surface-muted").toMatch(
					/bg-surface|bg-surface-muted/,
				);
				expect(src, "must use text-foreground-muted").toMatch(
					/text-foreground-muted|text-foreground/,
				);
				expect(src, "must use border-border or border-input").toMatch(/border-border|border-input/);
				expect(src, "icon container must use status tokens or bg-surface-muted not zinc").toMatch(
					/bg-surface-muted|bg-pending-bg|bg-destructive|bg-amber/,
				);
			});
		});

		describe("leftover text-slate-200 / placeholder:text-slate-500 / hover:bg-slate-700 sweep", () => {
			it("ServicesModal has NO placeholder:text-slate-500 and NO hover:bg-slate-700 (primary RED)", () => {
				const src = read("components/services/ServicesModal.tsx");
				expect(src, "must NOT contain placeholder:text-slate-500").not.toContain(
					"placeholder:text-slate-500",
				);
				expect(src, "must NOT contain hover:bg-slate-700").not.toContain("hover:bg-slate-700");
				expect(src, "must NOT contain text-slate-200").not.toContain("text-slate-200");
				expect(src, "must use placeholder:text-foreground-subtle when placeholder present").toMatch(
					/placeholder:text-foreground-subtle|placeholder:/,
				);
			});

			it("locationsManager and logsManager have NO text-slate-200 and NO hover:bg-slate-700 (triangulate)", () => {
				for (const rel of [
					"app/(app)/locations/locationsManager.tsx",
					"app/(app)/service-events/serviceEventsManager.tsx",
				]) {
					const src = read(rel);
					expect(src, `${rel} must NOT contain text-slate-200`).not.toContain("text-slate-200");
					expect(src, `${rel} must NOT contain hover:bg-slate-700`).not.toContain(
						"hover:bg-slate-700",
					);
					expect(src, `${rel} must NOT contain placeholder:text-slate-500`).not.toContain(
						"placeholder:text-slate-500",
					);
					expect(src, `${rel} must contain text-foreground when text-slate was used`).toMatch(
						/text-foreground|text-foreground-muted/,
					);
				}
			});
		});

		describe("styles/globals.css color-scheme light dark", () => {
			it("globals input date color-scheme is light dark NOT just light (primary RED)", () => {
				const css = read("styles/globals.css");
				expect(css, "must contain color-scheme: light dark").toMatch(
					/color-scheme\s*:\s*light\s+dark/,
				);
				expect(css, "must NOT have color-scheme: light; alone").not.toMatch(
					/color-scheme\s*:\s*light\s*;/,
				);
			});

			it("globals still has .dark overrides and no html.dark (triangulate)", () => {
				const css = read("styles/globals.css");
				expect(css).toContain(".dark");
				expect(css).not.toMatch(/html\.dark/);
				expect(css).toMatch(/color-scheme\s*:\s*light\s+dark/);
			});
		});
	});
});
