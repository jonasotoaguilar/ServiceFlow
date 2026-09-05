import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Alert } from "@/components/ui/alert";
import * as authActions from "@/app/actions/auth";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, refresh: refreshMock }),
	usePathname: () => "/login",
	useSearchParams: () => new URLSearchParams(),
	redirect: vi.fn(),
}));

vi.mock("@/app/actions/auth", () => ({
	login: vi.fn(),
	register: vi.fn(),
	resendVerification: vi.fn(),
	logout: vi.fn(),
}));

beforeEach(() => {
	pushMock.mockClear();
	refreshMock.mockClear();
	vi.clearAllMocks();
});

afterEach(() => {
	cleanup();
});

describe("Phase 3 RED: verification UI contract", () => {
	it("Alert exposes role=alert and aria-live=polite", () => {
		render(<Alert variant="info" message="probe" />);
		const alert = screen.getByRole("alert");
		expect(alert).toBeInTheDocument();
		expect(alert).toHaveTextContent("probe");
		expect(alert.getAttribute("aria-live")).toBe("polite");
	});

	it("LoginForm shows post-register info callout when registered", () => {
		render(<LoginForm registered />);
		expect(
			screen.getByText(
				"Te enviamos un correo de verificación. Debes verificar tu cuenta antes de iniciar sesión.",
			),
		).toBeInTheDocument();
	});

	it("LoginForm hides post-register callout without registered flag (triangulation)", () => {
		render(<LoginForm />);
		expect(
			screen.queryByText(
				"Te enviamos un correo de verificación. Debes verificar tu cuenta antes de iniciar sesión.",
			),
		).toBeNull();
	});

	it("LoginForm always offers resend and acks enumeration-neutrally", async () => {
		vi.mocked(authActions.resendVerification).mockResolvedValue({ ok: true } as never);
		render(<LoginForm registered />);

		const resend = screen.getByRole("button", {
			name: /reenviar/i,
		});
		expect(resend).toBeInTheDocument();
		// 44px minimum hit target is exposed as an inline style so jsdom can observe it
		expect(resend.style.minHeight).toBe("44px");
		// keyboard reachable: native button receives focus
		resend.focus();
		expect(document.activeElement).toBe(resend);

		fireEvent.click(resend);
		await waitFor(() => {
			expect(
				screen.getByText(
					"Si el correo está registrado y pendiente de verificación, te enviamos un enlace.",
				),
			).toBeInTheDocument();
		});
	});

	it("LoginForm resend failure shows the same neutral ack (triangulation)", async () => {
		vi.mocked(authActions.resendVerification).mockRejectedValueOnce(new Error("transport"));
		render(<LoginForm />);
		const resend = screen.getByRole("button", { name: /reenviar/i });
		fireEvent.click(resend);
		await waitFor(() => {
			expect(
				screen.getByText(
					"Si el correo está registrado y pendiente de verificación, te enviamos un enlace.",
				),
			).toBeInTheDocument();
		});
	});

	it("Login failure stays Credenciales inválidas with resend visible", async () => {
		vi.mocked(authActions.login).mockResolvedValue({
			error: "Credenciales inválidas",
		} as never);
		render(<LoginForm />);
		fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
			target: { value: "unknown@example.com" },
		});
		const password = screen.getByLabelText("Contraseña");
		fireEvent.change(password, {
			target: { value: "ValidPass123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^ingresar$/i }));
		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent("Credenciales inválidas");
		});
		// no extra unverified-only copy
		expect(screen.queryByText(/verifica tu cuenta/i)).toBeNull();
		// resend stays visible alongside the failure
		expect(screen.getByRole("button", { name: /reenviar/i })).toBeInTheDocument();
	});

	it("Register success navigates to /login?registered=1 and refreshes", async () => {
		vi.mocked(authActions.register).mockResolvedValue({ success: true } as never);
		render(<RegisterForm />);
		fireEvent.change(screen.getByLabelText(/nombre completo/i), {
			target: { value: "E2E User" },
		});
		fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
			target: { value: "new@example.com" },
		});
		const password = screen.getByLabelText("Contraseña");
		fireEvent.change(password, {
			target: { value: "ValidPass123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith("/login?registered=1");
		});
		expect(refreshMock).toHaveBeenCalledTimes(1);
	});

	it("app/login/page awaits searchParams and passes registered", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "app/login/page.tsx"), "utf8");
		expect(src).toContain("searchParams");
		expect(src).toContain("await");
		expect(src).toContain("registered");
		expect(src).toContain("LoginForm");
	});

	it("router push+refresh pair is preserved in both forms", () => {
		for (const file of ["components/auth/login-form.tsx", "components/auth/register-form.tsx"]) {
			const src = fs.readFileSync(path.join(process.cwd(), file), "utf8");
			expect(src).toContain("useRouter");
			expect(src).toContain("router.push");
			expect(src).toContain("router.refresh");
		}
	});

	it("verify status renders visible Alert copy with login link and never logs token", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "app/verify/page.tsx"), "utf8");
		expect(src).toContain("Tu correo fue verificado. Ya puedes iniciar sesión.");
		expect(src).toContain("El enlace no es válido o expiró. Solicita uno nuevo e inicia sesión.");
		expect(src).toContain('href="/login"');
		expect(src).toContain("Inicia sesión");
		expect(src).not.toMatch(/console\.(log|error|warn|info|debug)/);
	});
});
