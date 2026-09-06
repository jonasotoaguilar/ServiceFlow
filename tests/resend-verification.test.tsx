import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { resendVerificationSchema } from "@/lib/schemas";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import * as authActions from "@/app/actions/auth";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
	usePathname: () => "/resend-verification",
	useSearchParams: () => new URLSearchParams(),
	redirect: vi.fn(),
}));

vi.mock("@/app/actions/auth", () => ({
	login: vi.fn(),
	register: vi.fn(),
	resendVerification: vi.fn(),
	logout: vi.fn(),
}));

const ACK = "Si el correo está registrado y pendiente de verificación, te enviamos un enlace.";
const SPAM_HINT = "Si no lo ves en unos minutos, revisa Spam o Correo no deseado.";

function neutralCopyShown() {
	const ack = screen.queryByText(
		(_, el) => el?.tagName === "P" && (el.textContent ?? "").includes(ACK),
	);
	const hint = screen.queryByText(
		(_, el) => el?.tagName === "P" && (el.textContent ?? "").includes(SPAM_HINT),
	);
	return { ack, hint };
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	cleanup();
});

async function fillValidEmail() {
	fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
		target: { value: "user@example.com" },
	});
	await waitFor(() => {
		expect(screen.getByRole("button", { name: /enviar enlace/i })).toBeEnabled();
	});
}

describe("resendVerificationSchema", () => {
	it("accepts valid email, rejects the rest with the Spanish message", () => {
		expect(resendVerificationSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
		const result = resendVerificationSchema.safeParse({ email: "not-an-email" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("Correo electrónico inválido");
		}
	});
});

describe("ResendVerificationForm", () => {
	it("submit stays disabled until the email is syntactically valid", async () => {
		render(<ResendVerificationForm />);
		const submit = screen.getByRole("button", { name: /enviar enlace/i });
		expect(submit).toBeDisabled();

		fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
			target: { value: "not-an-email" },
		});
		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent("Correo electrónico inválido");
		});
		expect(screen.getByRole("button", { name: /enviar enlace/i })).toBeDisabled();
	});

	it("email input is labelled and described", () => {
		render(<ResendVerificationForm />);
		expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute(
			"aria-describedby",
			"resend-email-hint",
		);
	});

	it.each([
		["server success", () => Promise.resolve({ ok: true })],
		["provider failure", () => Promise.reject(new Error("transport"))],
	])("%s shows the identical neutral ack plus spam guidance", async (_, settle) => {
		vi.mocked(authActions.resendVerification).mockImplementationOnce(() => settle() as never);
		render(<ResendVerificationForm />);
		await fillValidEmail();

		fireEvent.click(screen.getByRole("button", { name: /enviar enlace/i }));
		await waitFor(() => {
			expect(neutralCopyShown().ack).not.toBeNull();
		});
		expect(neutralCopyShown().hint).not.toBeNull();
		expect(screen.queryByText(/enviado|revisa tu bandeja|hemos enviado/i)).toBeNull();
	});

	it("submit is disabled while pending", async () => {
		let release!: (v: unknown) => void;
		vi.mocked(authActions.resendVerification).mockReturnValueOnce(
			new Promise((resolve) => {
				release = resolve;
			}) as never,
		);
		render(<ResendVerificationForm />);
		await fillValidEmail();

		const submit = screen.getByRole("button", { name: /enviar enlace/i });
		fireEvent.click(submit);
		await waitFor(() => {
			expect(submit).toBeDisabled();
		});
		release({ ok: true });
		await waitFor(() => {
			expect(screen.getByText(/pendiente de verificación/)).toBeInTheDocument();
		});
	});
});

describe("resend-verification artifacts", () => {
	it("page is a server component with Spanish metadata and login way back", () => {
		const src = fs.readFileSync(
			path.join(process.cwd(), "app/resend-verification/page.tsx"),
			"utf8",
		);
		expect(src).not.toContain("use client");
		expect(src).toContain("Reenviar verificación");
		expect(src).toContain("ResendVerificationForm");
		const formSrc = fs.readFileSync(
			path.join(process.cwd(), "components/auth/resend-verification-form.tsx"),
			"utf8",
		);
		expect(formSrc).toContain('href="/login"');
	});

	it("brand favicon is a hand-authored SVG with no stale ico", () => {
		expect(fs.existsSync(path.join(process.cwd(), "app/favicon.ico"))).toBe(false);
		const iconPath = path.join(process.cwd(), "app/icon.svg");
		expect(fs.existsSync(iconPath)).toBe(true);
		const svg = fs.readFileSync(iconPath, "utf8");
		expect(svg).toContain("<svg");
		expect(svg).toContain("#2F5B8A");
		expect(svg).not.toContain("<text");
	});
});
