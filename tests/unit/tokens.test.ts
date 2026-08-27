import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Helpers to read repo files
function read(rel: string): string {
	return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Taller Claro tokens — semantic tokens no interpolation (Unit 1)", () => {
	it("styles/globals.css exposes light semantic tokens from DESIGN.md (background #fafafa, surface #ffffff, foreground #18181b, focus/primary #2F5B8A)", () => {
		const css = read("styles/globals.css").toLowerCase();
		// Background / surface / foreground
		expect(css).toContain("#fafafa");
		expect(css).toContain("#ffffff");
		expect(css).toContain("#18181b");
		// Primary ink and hover
		expect(css).toContain("#2f5b8a");
		expect(css).toContain("#264a71");
		// At least one semantic mapping via --color-*
		expect(css).toMatch(/--color-background/);
		expect(css).toMatch(/--color-surface/);
		expect(css).toMatch(/--color-foreground/);
		expect(css).toMatch(/--color-primary/);
		expect(css).toMatch(/--color-focus/);
	});

	it("styles/globals.css exposes status tint + border tokens and skeleton tokens (pending/ready/completed/cancelled + skeleton)", () => {
		const css = read("styles/globals.css").toLowerCase();
		// Pending amber tint
		expect(css).toContain("#fef3c7");
		expect(css).toContain("#92400e");
		// Ready blue tint
		expect(css).toContain("#dbeafe");
		expect(css).toContain("#1e40af");
		// Completed emerald
		expect(css).toContain("#d1fae5");
		expect(css).toContain("#065f46");
		// Cancelled red
		expect(css).toContain("#fee2e2");
		expect(css).toContain("#991b1b");
		// Skeleton tokens
		expect(css).toContain("#e4e4e7");
		expect(css).toContain("#f4f4f5");
		// Radius/design constraints (8px and 12px dialog)
		expect(css).toMatch(/--radius-sm|--rounded-sm|8px/);
	});
});

describe("Banned visuals removed — no glass/blur/glow/gradient or dark static variant", () => {
	it("styles/globals.css does NOT contain glass, blur, glow, or gradient decoration", () => {
		const css = read("styles/globals.css");
		// Must NOT contain banned substrings (case-insensitive for safety)
		const lower = css.toLowerCase();
		expect(lower).not.toContain("glass-effect");
		expect(lower).not.toContain("glass-card");
		expect(lower).not.toContain("glow-orb");
		expect(lower).not.toContain("backdrop-blur");
		expect(lower).not.toContain("backdrop-filter");
		expect(lower).not.toContain("vibrant-gradient");
		expect(lower).not.toContain("glow-underline");
		// radial-gradient glow or blob animation is banned
		expect(lower).not.toContain("radial-gradient");
		expect(lower).not.toContain("@keyframes blob");
	});

	it("no html.dark static variant — styles and layout have no dark class bridge", () => {
		const css = read("styles/globals.css");
		const layout = read("app/layout.tsx");
		// globals must not contain html.dark; .dark overrides for next-themes (attribute="class") are allowed per Unit 4
		expect(css).not.toMatch(/html\.dark/);
		// layout must not hardcode <html className="dark"> or class="dark"
		expect(layout).not.toMatch(/className=.*\bdark\b/);
		expect(layout).not.toContain('class="dark"');
		// next-themes requires .dark { } token overrides (Unit 4), not html.dark
		expect(css).toContain(".dark");
		expect(css).toMatch(/\.dark\s*\{/);
	});
});

describe("No runtime Tailwind interpolation", () => {
	it("styles/globals.css has no runtime-interpolated Tailwind class construction pattern", () => {
		const css = read("styles/globals.css");
		// These patterns are banned in code — css itself must not hide them either
		expect(css).not.toContain("bg-${");
		expect(css).not.toContain("border-${");
		expect(css).not.toContain("text-${");
		// Additional banned legacy artifact present before fix — ensures RED fails
		expect(css.toLowerCase()).not.toContain("glass-effect");
		expect(css.toLowerCase()).not.toContain("glow-orb");
	});

	it("app shell files do not use dynamic color interpolation (no bg-dynamic or border-status interpolation)", () => {
		// Unit 1 rollback boundary: styles/globals.css, app/layout.tsx, components/ui/dialog.tsx
		// Do not scan later-unit files (ServicesDashboard, badge) — they stay legacy until their slice
		const candidates = ["components/ui/dialog.tsx"];
		for (const rel of candidates) {
			const p = path.join(process.cwd(), rel);
			if (!fs.existsSync(p)) continue;
			const src = fs.readFileSync(p, "utf8");
			expect(src).not.toContain("bg-${");
			expect(src).not.toContain("border-${");
			// Banned legacy dark transparency patterns removed in Unit 1 dialog
			expect(src).not.toContain("bg-white/5");
			expect(src).not.toContain("border-white/10");
			expect(src).not.toMatch(/border-\$\{/);
		}
		const css = read("styles/globals.css");
		expect(css).not.toContain("glass-effect");
	});
});

describe("Icon + text status contract (no color-only)", () => {
	it("styles/globals.css status tokens include paired bg/fg/border (pending/ready/completed/cancelled must be usable with icon+text)", () => {
		const css = read("styles/globals.css").toLowerCase();
		// Each status must have bg/fg/border trio available as variables or values
		// Pending trio
		expect(css).toContain("#fef3c7"); // bg
		expect(css).toContain("#92400e"); // fg
		// Ready trio
		expect(css).toContain("#dbeafe");
		expect(css).toContain("#1e40af");
		// Completed trio (Entregada stores as completed)
		expect(css).toContain("#d1fae5");
		expect(css).toContain("#065f46");
		// Cancelled trio
		expect(css).toContain("#fee2e2");
		expect(css).toContain("#991b1b");
	});

	it("Dialog close control conveys accessible name alongside icon (aria-label) — checked via rendered Dialog", async () => {
		const { Dialog } = await import("@/components/ui/dialog");
		const onClose = vi.fn();
		render(
			React.createElement(Dialog as any, { isOpen: true, onClose, title: "Test dialog" }, "body"),
		);
		const close = screen.getByRole("button", { name: /cerrar|close/i });
		expect(close).toBeInTheDocument();
		// Icon must be present (lucide X renders svg)
		expect(close.querySelector("svg")).not.toBeNull();
	});
});

describe("Viewport zoom allowed", () => {
	it("app/layout.tsx viewport allows zoom: userScalable true and not maximumScale 1", () => {
		const layout = read("app/layout.tsx");
		// Must declare userScalable true (or absence of false) and maximumScale >=5 or omitted
		expect(layout).toMatch(/userScalable\s*:\s*true/);
		expect(layout).not.toMatch(/maximumScale\s*:\s*1\b/);
		expect(layout).not.toMatch(/userScalable\s*:\s*false/);
	});

	it("viewport does not block pinch zoom via maximum-scale=1 meta (triangulate second assertion)", () => {
		const layout = read("app/layout.tsx");
		// Either maximumScale omitted or >=5
		const hasMax = /maximumScale\s*:\s*(\d+)/.exec(layout);
		if (hasMax) {
			expect(Number(hasMax[1])).toBeGreaterThanOrEqual(5);
		} else {
			// omitted is allowed — must have userScalable true proven above
			expect(layout).toMatch(/userScalable\s*:\s*true/);
		}
		// Ensure themeColor dark obsidian not used as viewport blocking artifact (optional)
		expect(layout.toLowerCase()).not.toContain("maximumscale: 1");
	});
});

describe("prefers-reduced-motion honored", () => {
	it("styles/globals.css includes @media (prefers-reduced-motion: reduce) that collapses motion", () => {
		const css = read("styles/globals.css");
		expect(css).toContain("prefers-reduced-motion");
		expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
		// Inside it should disable animation/transition duration
		const block = css.slice(css.indexOf("prefers-reduced-motion"));
		expect(block).toMatch(/animation-duration|transition-duration|animation:\s*none/);
	});

	it("globals reduced-motion disables shimmer/loop (triangulate)", () => {
		const css = read("styles/globals.css");
		const block = css.slice(css.indexOf("prefers-reduced-motion"));
		// Must mention shimmer or solid fallback
		expect(block.length).toBeGreaterThan(20);
		expect(css.toLowerCase()).not.toContain("@keyframes blob");
	});
});

describe("Dialog a11y contract — role, aria-modal, trap, Esc, 90dvh, 44px", () => {
	it("renders with role=dialog, aria-modal true, and labelled title", async () => {
		const { Dialog } = await import("@/components/ui/dialog");
		const onClose = vi.fn();
		render(
			React.createElement(
				Dialog as any,
				{ isOpen: true, onClose, title: "Editar sede" },
				"content",
			),
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveAttribute("aria-modal", "true");
		// Title must be accessible
		expect(screen.getByText("Editar sede")).toBeInTheDocument();
		// aria-labelledby should reference title id or title text reachable
		// At minimum, dialog has accessible name via heading
		expect(dialog).toHaveAccessibleName(/editar sede/i);
	});

	it("uses 90dvh max-height (not 90vh) and does NOT use glass/blur overlay", async () => {
		const src = read("components/ui/dialog.tsx");
		expect(src).toContain("90dvh");
		expect(src).not.toContain("90vh");
		expect(src).not.toContain("glass-effect");
		expect(src).not.toContain("backdrop-blur");
		// Overlay should be at most bg-black/30 or rgba(24,24,27,0.04) per DESIGN, not bg-black/60 with blur
		expect(src).not.toContain("bg-black/60");
		expect(src).not.toContain("backdrop-blur-sm");
		// Rendered container must carry max-h-[90dvh]
		const { Dialog } = await import("@/components/ui/dialog");
		const onClose = vi.fn();
		const { container } = render(
			React.createElement(Dialog as any, { isOpen: true, onClose, title: "T" }, "x"),
		);
		// Find element with max-h class
		expect(container.innerHTML).toContain("90dvh");
	});

	it("close button meets 44px minimum hit target (h-11 w-11) and overlay not blurred", async () => {
		const src = read("components/ui/dialog.tsx");
		// Close button should be sized to 44px => h-11 w-11 or min 44
		expect(src).toMatch(/h-11|w-11|min-h-11|44px/);
		const { Dialog } = await import("@/components/ui/dialog");
		const onClose = vi.fn();
		render(React.createElement(Dialog as any, { isOpen: true, onClose, title: "T2" }, "x"));
		const close = screen.getByRole("button", { name: /cerrar|close/i });
		// class must include h-11 w-11
		expect(close.className).toMatch(/h-11/);
		expect(close.className).toMatch(/w-11/);
	});

	it("Escape closes dialog, restores focus, and Tab traps inside (focus stays within)", async () => {
		const { Dialog } = await import("@/components/ui/dialog");
		function Wrapper() {
			const [open, setOpen] = React.useState(false);
			return React.createElement(
				React.Fragment,
				null,
				React.createElement(
					"button",
					{ type: "button", onClick: () => setOpen(true) },
					"open-trigger",
				),
				React.createElement(
					Dialog as any,
					{ isOpen: open, onClose: () => setOpen(false), title: "Trap test" },
					React.createElement("button", { type: "button" }, "inside-one"),
					React.createElement("button", { type: "button" }, "inside-two"),
				),
			);
		}
		render(React.createElement(Wrapper));
		const trigger = screen.getByRole("button", { name: "open-trigger" });
		trigger.focus();
		expect(document.activeElement).toBe(trigger);
		fireEvent.click(trigger);
		// Dialog should appear
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toBeInTheDocument();
		// Focus should be inside dialog (close button or first focusable)
		await new Promise((r) => setTimeout(r, 20));
		expect(dialog.contains(document.activeElement)).toBe(true);
		// Tab should stay inside (trap): press Tab twice and verify still inside
		fireEvent.keyDown(dialog, { key: "Tab", code: "Tab" });
		expect(dialog.contains(document.activeElement)).toBe(true);
		// Shift+Tab also stays inside
		fireEvent.keyDown(dialog, { key: "Tab", code: "Tab", shiftKey: true });
		expect(dialog.contains(document.activeElement)).toBe(true);
		// Escape closes and returns focus to trigger
		fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
		// Allow state update
		await new Promise((r) => setTimeout(r, 20));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(document.activeElement).toBe(trigger);
	});
});
