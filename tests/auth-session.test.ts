import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
let curTok = "",
	curRec: any = null;
const mockSet = vi.fn(),
	mockDel = vi.fn(),
	mockGet = vi.fn();
const mockSave = vi.fn((t: string, r: any) => {
	curTok = t;
	curRec = r;
});
const mockClear = vi.fn(() => {
	curTok = "";
	curRec = null;
});
function getPayload(t: string): any {
	try {
		const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
		const pad = p.padEnd(Math.ceil(p.length / 4) * 4, "=");
		const j =
			typeof Buffer !== "undefined" ? Buffer.from(pad, "base64").toString("utf-8") : atob(pad);
		return JSON.parse(j) || {};
	} catch {
		return {};
	}
}
function isExpired(t: string) {
	const p = getPayload(t);
	if (!Object.keys(p).length) return true;
	if (!p.exp) return false;
	return !(p.exp > Date.now() / 1e3);
}
const mockAuthRefresh = vi.fn();
const mockAuthWithPassword = vi.fn();
const mockCreate = vi.fn();
const mockCollection = vi.fn((name: string) => {
	if (name === "users")
		return {
			authRefresh: mockAuthRefresh,
			authWithPassword: mockAuthWithPassword,
			create: mockCreate,
		};
	throw new Error("unexpected collection " + name);
});
const mockCtor = vi.fn(function (this: any, url: string) {
	this.url = url;
	this.authStore = {
		save: mockSave,
		get token() {
			return curTok;
		},
		get record() {
			return curRec;
		},
		get model() {
			return curRec;
		},
		get isValid() {
			if (!curTok || !curRec) return false;
			return !isExpired(curTok);
		},
		clear: mockClear,
	};
	this.collection = mockCollection;
});
vi.mock("pocketbase", () => ({ default: mockCtor }));
const cookiesMock = vi.fn();
vi.mock("next/headers", () => ({ cookies: (...a: any[]) => cookiesMock(...a) }));
const mockRedirect = vi.fn((url: string) => {
	const e: any = new Error(`NEXT_REDIRECT:${url}`);
	e.digest = `NEXT_REDIRECT;${url}`;
	throw e;
});
vi.mock("next/navigation", () => ({ redirect: (...a: any[]) => (mockRedirect as any)(...a) }));
function b64url(s: string) {
	return Buffer.from(s).toString("base64url");
}
function mkJwt(exp?: number, extra: Record<string, any> = {}) {
	const h = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const obj = exp !== undefined ? { exp, ...extra } : { ...extra };
	return `${h}.${b64url(JSON.stringify(obj))}.sig`;
}
describe("auth-session WU2a", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		curTok = "";
		curRec = null;
		mockGet.mockReset();
		mockSet.mockReset();
		mockDel.mockReset();
		mockAuthRefresh.mockReset();
		mockAuthWithPassword.mockReset();
		mockCreate.mockReset();
		mockCollection.mockClear();
		mockRedirect.mockClear();
		process.env.POCKETBASE_URL = "http://127.0.0.1:8090";
		cookiesMock.mockResolvedValue({
			get: mockGet.mockImplementation(() => undefined),
			set: mockSet,
			delete: mockDel,
		});
		vi.unstubAllEnvs?.();
	});
	describe("getAuthUser server-validated", () => {
		it("valid pb_auth with server refresh returns refreshed record id not raw cookie id", async () => {
			const exp = Math.floor(Date.now() / 1e3) + 3600;
			const rawTok = mkJwt(exp);
			const rawRec = { id: "victim-tampered", email: "evil@x.com", name: "Evil" };
			const serverRec = { id: "real-server-id", email: "real@b.com", name: "Real" };
			const serverTok = mkJwt(exp + 100);
			mockAuthRefresh.mockImplementationOnce(async () => {
				curTok = serverTok;
				curRec = serverRec;
				return { token: serverTok, record: serverRec };
			});
			cookiesMock.mockResolvedValue({
				get: (n: string) =>
					n === "pb_auth"
						? { value: JSON.stringify({ token: rawTok, record: rawRec }) }
						: undefined,
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			const u = await getAuthUser();
			expect(mockCollection).toHaveBeenCalledWith("users");
			expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
			expect(u).toEqual({ id: "real-server-id", email: "real@b.com", name: "Real" });
			expect(u?.id).not.toBe("victim-tampered");
		});
		it("forged future-exp/tampered victim id rejected when authRefresh 401 → null and clears store", async () => {
			const exp = Math.floor(Date.now() / 1e3) + 3600;
			const tok = mkJwt(exp);
			const rec = { id: "victim-id", email: "victim@x.com", name: "Victim" };
			mockAuthRefresh.mockRejectedValueOnce(
				Object.assign(new Error("Unauthorized"), { status: 401 }),
			);
			cookiesMock.mockResolvedValue({
				get: (n: string) =>
					n === "pb_auth" ? { value: JSON.stringify({ token: tok, record: rec }) } : undefined,
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			const u = await getAuthUser();
			expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
			expect(mockClear).toHaveBeenCalled();
			expect(u).toBeNull();
		});
		it("unreachable PB authRefresh failure → null fail-closed", async () => {
			const exp = Math.floor(Date.now() / 1e3) + 3600;
			const tok = mkJwt(exp);
			const rec = { id: "u1", email: "a@b.com", name: "A" };
			mockAuthRefresh.mockRejectedValueOnce(new Error("Network unreachable"));
			cookiesMock.mockResolvedValue({
				get: (n: string) =>
					n === "pb_auth" ? { value: JSON.stringify({ token: tok, record: rec }) } : undefined,
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			await expect(getAuthUser()).resolves.toBeNull();
			expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
			expect(mockClear).toHaveBeenCalled();
		});
		it("authRefresh MUST be called before getAuthUser returns", async () => {
			const exp = Math.floor(Date.now() / 1e3) + 3600;
			const tok = mkJwt(exp);
			const rec = { id: "u123", email: "a@b.com", name: "Alice" };
			let calledBeforeReturn = false;
			mockAuthRefresh.mockImplementationOnce(async () => {
				calledBeforeReturn = true;
				curTok = tok;
				curRec = rec;
				return { token: tok, record: rec };
			});
			cookiesMock.mockResolvedValue({
				get: (n: string) =>
					n === "pb_auth" ? { value: JSON.stringify({ token: tok, record: rec }) } : undefined,
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			const u = await getAuthUser();
			expect(calledBeforeReturn).toBe(true);
			expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
			expect(u).toEqual({ id: "u123", email: "a@b.com", name: "Alice" });
		});
		it("expired local token avoids network (authRefresh not called)", async () => {
			const exp = Math.floor(Date.now() / 1e3) - 3600;
			const tok = mkJwt(exp);
			const rec = { id: "u1", email: "e@e.com", name: "Bob" };
			cookiesMock.mockResolvedValue({
				get: (n: string) =>
					n === "pb_auth" ? { value: JSON.stringify({ token: tok, record: rec }) } : undefined,
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			await expect(getAuthUser()).resolves.toBeNull();
			expect(mockAuthRefresh).not.toHaveBeenCalled();
			expect(mockCollection).not.toHaveBeenCalled();
		});
		it("no cache: second call invokes authRefresh again", async () => {
			const exp = Math.floor(Date.now() / 1e3) + 3600;
			const tok = mkJwt(exp);
			const rec = { id: "u1", email: "a@b.com", name: "A" };
			mockAuthRefresh.mockImplementation(async () => {
				curTok = tok;
				curRec = rec;
				return { token: tok, record: rec };
			});
			cookiesMock.mockResolvedValue({
				get: (n: string) =>
					n === "pb_auth" ? { value: JSON.stringify({ token: tok, record: rec }) } : undefined,
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			await getAuthUser();
			await getAuthUser();
			expect(mockAuthRefresh).toHaveBeenCalledTimes(2);
		});
		it("missing pb_auth → null", async () => {
			cookiesMock.mockResolvedValue({ get: () => undefined, set: mockSet, delete: mockDel });
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			await expect(getAuthUser()).resolves.toBeNull();
			expect(mockAuthRefresh).not.toHaveBeenCalled();
		});
		it("malformed pb_auth → null no throw", async () => {
			cookiesMock.mockResolvedValue({
				get: () => ({ value: "not-json{{{" }),
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			await expect(getAuthUser()).resolves.toBeNull();
			expect(mockAuthRefresh).not.toHaveBeenCalled();
		});
		it("session-only → null", async () => {
			cookiesMock.mockResolvedValue({
				get: (n: string) => (n === "session" ? { value: "legacy" } : undefined),
				set: mockSet,
				delete: mockDel,
			});
			vi.resetModules();
			const { getAuthUser } = await import("../lib/auth");
			await expect(getAuthUser()).resolves.toBeNull();
			expect(mockAuthRefresh).not.toHaveBeenCalled();
		});
		it("uses createPocketBaseClient and authRefresh", async () => {
			const src = fs.readFileSync(path.join(process.cwd(), "lib/auth.ts"), "utf8");
			expect(src).toContain("createPocketBaseClient");
			expect(src).toContain("authRefresh");
			expect(src).toContain('collection("users")');
			const src2 = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase.ts"), "utf8");
			expect(src2).toContain("createPocketBaseClient");
			expect(src2).toContain("pb_auth");
		});
		it("no logging of token/pb_auth in lib/auth", async () => {
			const src = fs.readFileSync(path.join(process.cwd(), "lib/auth.ts"), "utf8");
			expect(src).not.toMatch(/console\./);
		});
	});
	describe("cookie helpers", () => {
		it("saveAuthCookie await cookies pb_auth JSON httpOnly lax path", async () => {
			const exp = Math.floor(Date.now() / 1e3) + 7200;
			const tok = mkJwt(exp);
			const rec = { id: "u9", email: "x@y.com", name: "X" };
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			const m = await import("../lib/pocketbase");
			expect(typeof m.saveAuthCookie).toBe("function");
			await m.saveAuthCookie(tok, rec);
			expect(cookiesMock).toHaveBeenCalled();
			const src = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase.ts"), "utf8");
			expect(src).toContain("await cookies()");
			expect(src).toContain("pb_auth");
			expect(mockSet).toHaveBeenCalledTimes(1);
			const [n, v, o] = mockSet.mock.calls[0];
			expect(n).toBe("pb_auth");
			expect(JSON.parse(v)).toEqual({ token: tok, record: rec });
			expect(o.httpOnly).toBe(true);
			expect(o.sameSite).toBe("lax");
			expect(o.path).toBe("/");
		});
		it("saveAuthCookie secure iff production", async () => {
			const tok = mkJwt(undefined, { sub: "123" });
			const rec = { id: "u1", email: "a@a.com", name: "A" };
			const orig = process.env.NODE_ENV;
			const origUrl = process.env.POCKETBASE_URL;
			(process.env as any).NODE_ENV = "development";
			process.env.POCKETBASE_URL = "http://127.0.0.1:8090";
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			let m = await import("../lib/pocketbase");
			await m.saveAuthCookie(tok, rec);
			expect(mockSet.mock.calls[0][2].secure).toBe(false);
			vi.clearAllMocks();
			(process.env as any).NODE_ENV = "production";
			process.env.POCKETBASE_URL = "http://127.0.0.1:8090";
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			m = await import("../lib/pocketbase");
			await m.saveAuthCookie(tok, rec);
			expect(mockSet.mock.calls[0][2].secure).toBe(false);
			vi.clearAllMocks();
			(process.env as any).NODE_ENV = "production";
			process.env.POCKETBASE_URL = "https://example.com";
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			m = await import("../lib/pocketbase");
			await m.saveAuthCookie(tok, rec);
			expect(mockSet.mock.calls[0][2].secure).toBe(true);
			(process.env as any).NODE_ENV = orig;
			process.env.POCKETBASE_URL = origUrl;
		});
		it("saveAuthCookie expires parseable JWT else omit", async () => {
			const exp = Math.floor(Date.now() / 1e3) + 3600;
			const tok = mkJwt(exp);
			const rec = { id: "u1", email: "a@a.com", name: "A" };
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			let m = await import("../lib/pocketbase");
			await m.saveAuthCookie(tok, rec);
			expect(m).toBeDefined();
			expect(mockSet.mock.calls[0][2].expires).toBeInstanceOf(Date);
			expect(Math.floor(mockSet.mock.calls[0][2].expires.getTime() / 1e3)).toBe(exp);
			vi.clearAllMocks();
			const tokNo = mkJwt(undefined, { foo: "bar" });
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			m = await import("../lib/pocketbase");
			await m.saveAuthCookie(tokNo, rec);
			expect(mockSet.mock.calls[0][2].expires).toBeUndefined();
			vi.clearAllMocks();
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			m = await import("../lib/pocketbase");
			await m.saveAuthCookie("not.jwt.token", rec);
			expect(mockSet.mock.calls[0][2].expires).toBeUndefined();
		});
		it("clearAuthCookie deletes pb_auth", async () => {
			cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
			vi.resetModules();
			const m = await import("../lib/pocketbase");
			expect(typeof m.clearAuthCookie).toBe("function");
			await m.clearAuthCookie();
			expect(cookiesMock).toHaveBeenCalled();
			const del = mockDel.mock.calls.length > 0;
			const set = mockSet.mock.calls.some(
				(c: any[]) => c[0] === "pb_auth" && (c[2]?.maxAge === 0 || c[2]?.expires),
			);
			expect(del || set).toBe(true);
		});
		it("clearLegacySessionCookie is removed after cutover", async () => {
			vi.resetModules();
			const m = await import("../lib/pocketbase");
			expect((m as any).clearLegacySessionCookie).toBeUndefined();
			expect(fs.readFileSync(path.join(process.cwd(), "lib/pocketbase.ts"), "utf8")).not.toContain(
				"clearLegacySessionCookie",
			);
		});
		it("no cookie values logged", async () => {
			const src = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase.ts"), "utf8");
			expect(src).not.toMatch(/console\.log.*pb_auth/);
			expect(src).not.toMatch(/console\.log.*token/);
			const aSrc = fs.readFileSync(path.join(process.cwd(), "lib/auth.ts"), "utf8");
			expect(aSrc).not.toMatch(/console\.log.*pb_auth/);
		});
		it("shared constants httpOnly lax path secure exp", async () => {
			const src = fs.readFileSync(path.join(process.cwd(), "lib/pocketbase.ts"), "utf8");
			expect(src).toContain("pb_auth");
			expect(src).not.toContain("LEGACY_SESSION");
			expect(src).toContain("httpOnly");
			expect(src).toContain("sameSite");
			expect(src).toContain('"lax"');
			expect(src).toContain("path");
			expect(src).toContain('"/"');
			expect(src).toContain("NODE_ENV");
			expect(src).toContain("production");
			expect((src.match(/await cookies\(\)/g) || []).length).toBeGreaterThanOrEqual(3);
		});
	});
});

describe("auth actions WU2b", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		curTok = "";
		curRec = null;
		mockGet.mockReset();
		mockSet.mockReset();
		mockDel.mockReset();
		mockAuthRefresh.mockReset();
		mockAuthWithPassword.mockReset();
		mockCreate.mockReset();
		mockCollection.mockClear();
		mockRedirect.mockClear();
		process.env.POCKETBASE_URL = "http://127.0.0.1:8090";
		cookiesMock.mockResolvedValue({
			get: mockGet.mockImplementation(() => undefined),
			set: mockSet,
			delete: mockDel,
		});
	});
	function fdLogin(email: string, password: string) {
		const fd = new FormData();
		fd.append("email", email);
		fd.append("password", password);
		return fd;
	}
	function fdRegister(name: string, email: string, password: string) {
		const fd = new FormData();
		fd.append("name", name);
		fd.append("email", email);
		fd.append("password", password);
		return fd;
	}
	it("RED: login invalid email does not call authWithPassword and returns validation not credentials", async () => {
		vi.resetModules();
		const { login } = await import("../app/actions/auth");
		const res = await login(fdLogin("not-an-email", "ValidPass123"));
		expect(mockAuthWithPassword).not.toHaveBeenCalled();
		expect(mockCreate).not.toHaveBeenCalled();
		expect(res.error).toBeDefined();
		expect(res.error).toMatch(/Correo electrónico inválido/);
		expect(res.error).not.toBe("Credenciales inválidas");
		const src = fs.readFileSync(path.join(process.cwd(), "app/actions/auth.ts"), "utf8");
		expect(src).toContain("loginSchema");
	});
	it("RED: login empty password no PB call validation", async () => {
		vi.resetModules();
		const { login } = await import("../app/actions/auth");
		const res = await login(fdLogin("a@b.com", ""));
		expect(mockAuthWithPassword).not.toHaveBeenCalled();
		expect(res.error).toMatch(/La contraseña es requerida/);
		expect(res.error).not.toBe("Credenciales inválidas");
	});
	it("RED: register invalid name no create", async () => {
		vi.resetModules();
		const { register } = await import("../app/actions/auth");
		const res = await register(fdRegister("A", "a@b.com", "ValidPass123"));
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockAuthWithPassword).not.toHaveBeenCalled();
		expect(res.error).toMatch(/al menos 2/);
		const src = fs.readFileSync(path.join(process.cwd(), "app/actions/auth.ts"), "utf8");
		expect(src).toContain("registerSchema");
	});
	it("RED: register short password no create", async () => {
		vi.resetModules();
		const { register } = await import("../app/actions/auth");
		const res = await register(fdRegister("Juan Perez", "a@b.com", "short"));
		expect(mockCreate).not.toHaveBeenCalled();
		expect(res.error).toMatch(/al menos 8/);
	});
	it("unknown email and wrong password both Credenciales inválidas", async () => {
		mockAuthWithPassword.mockRejectedValueOnce(
			Object.assign(new Error("Failed to authenticate."), { status: 400, data: {} }),
		);
		vi.resetModules();
		let { login } = await import("../app/actions/auth");
		let res = await login(fdLogin("unknown12345@example.com", "ValidPass123"));
		expect(res.error).toBe("Credenciales inválidas");
		expect(mockAuthWithPassword).toHaveBeenCalledTimes(1);
		mockAuthWithPassword.mockReset();
		mockAuthWithPassword.mockRejectedValueOnce(
			Object.assign(new Error("Failed to authenticate."), { status: 400 }),
		);
		// need fresh module? reuse after clear
		vi.resetModules();
		({ login } = await import("../app/actions/auth"));
		// re-setup cookies mock after resetModules? beforeEach already set but need re-mock
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		res = await login(fdLogin("exists@example.com", "WrongPass123"));
		expect(res.error).toBe("Credenciales inválidas");
	});
	it("unknown-user credentials with no PB user same invalid result", async () => {
		mockAuthWithPassword.mockRejectedValueOnce(
			Object.assign(new Error("Failed to authenticate."), { status: 400 }),
		);
		vi.resetModules();
		const { login } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const res = await login(fdLogin("unknown@example.com", "UnknownPass123"));
		expect(res.error).toBe("Credenciales inválidas");
		expect(mockAuthWithPassword).toHaveBeenCalledTimes(1);
	});
	it("login transport/server error generic Spanish without PB text", async () => {
		const pbMsg = "ECONNREFUSED pocketbase internal 500 Failed to fetch";
		mockAuthWithPassword.mockRejectedValueOnce(Object.assign(new Error(pbMsg), { status: 500 }));
		vi.resetModules();
		const { login } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const res = await login(fdLogin("a@b.com", "ValidPass123"));
		expect(res.error).toBe("Error al iniciar sesión");
		expect(res.error).not.toContain("pocketbase");
		expect(res.error).not.toContain("ECONNREFUSED");
		expect(res.error).not.toContain("Failed to fetch");
		const src = fs.readFileSync(path.join(process.cwd(), "app/actions/auth.ts"), "utf8");
		expect(src).not.toContain("console.error");
	});
	it("register duplicate generic without PB text", async () => {
		mockCreate.mockRejectedValueOnce(
			Object.assign(new Error("email already exists validation_not_unique pocketbase"), {
				status: 400,
				data: { email: { code: "validation_not_unique" } },
			}),
		);
		vi.resetModules();
		const { register } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const res = await register(fdRegister("Juan Perez", "dup@example.com", "ValidPass123"));
		expect(res.error).toBe("No se pudo crear la cuenta. El correo puede estar en uso.");
		expect(res.error).not.toContain("pocketbase");
		expect(res.error).not.toContain("already exists");
		expect(mockCreate).toHaveBeenCalledTimes(1);
		expect(mockAuthWithPassword).not.toHaveBeenCalled();
	});
	it("register transport generic without PB text", async () => {
		mockCreate.mockRejectedValueOnce(
			Object.assign(new Error("Network unreachable pocketbase"), { status: 0 }),
		);
		vi.resetModules();
		const { register } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const res = await register(fdRegister("Juan Perez", "new@example.com", "ValidPass123"));
		expect(res.error).toBe("Error al registrarse");
		expect(res.error).not.toContain("pocketbase");
		expect(res.error).not.toContain("Network");
	});
	it("login success writes pb_auth via helper and no longer clears legacy session", async () => {
		const exp = Math.floor(Date.now() / 1e3) + 3600;
		const tok = mkJwt(exp);
		const rec = { id: "u123", email: "a@b.com", name: "Alice" };
		mockAuthWithPassword.mockImplementationOnce(async () => {
			curTok = tok;
			curRec = rec;
			return { token: tok, record: rec };
		});
		vi.resetModules();
		const { login } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const res = await login(fdLogin("a@b.com", "ValidPass123"));
		expect(res).toEqual({ success: true });
		expect(mockAuthWithPassword).toHaveBeenCalledWith("a@b.com", "ValidPass123");
		// saveAuthCookie called -> mockSet pb_auth
		expect(mockSet).toHaveBeenCalled();
		const pbCall = mockSet.mock.calls.find((c) => c[0] === "pb_auth");
		expect(pbCall).toBeDefined();
		expect(JSON.parse(pbCall![1])).toEqual({ token: tok, record: rec });
		// clearLegacySessionCookie -> delete session
		const delSession =
			mockDel.mock.calls.some((c) => c[0] === "session") ||
			mockSet.mock.calls.some((c) => c[0] === "session");
		expect(delSession).toBe(false);
		const src = fs.readFileSync(path.join(process.cwd(), "app/actions/auth.ts"), "utf8");
		expect(src).toContain("saveAuthCookie");
		expect(src).not.toContain("clearLegacySessionCookie");
	});
	it("register creates users with passwordConfirm then authenticates", async () => {
		const exp = Math.floor(Date.now() / 1e3) + 3600;
		const tok = mkJwt(exp);
		const rec = { id: "u999", email: "new@b.com", name: "Bob" };
		mockCreate.mockResolvedValueOnce({ id: "u999", email: "new@b.com", name: "Bob" });
		mockAuthWithPassword.mockImplementationOnce(async () => {
			curTok = tok;
			curRec = rec;
			return { token: tok, record: rec };
		});
		vi.resetModules();
		const { register } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const res = await register(fdRegister("Bob", "new@b.com", "ValidPass123"));
		expect(res).toEqual({ success: true });
		expect(mockCreate).toHaveBeenCalledTimes(1);
		const createArg = mockCreate.mock.calls[0][0];
		expect(createArg).toEqual(
			expect.objectContaining({
				email: "new@b.com",
				password: "ValidPass123",
				passwordConfirm: "ValidPass123",
				name: "Bob",
			}),
		);
		expect(mockAuthWithPassword).toHaveBeenCalledWith("new@b.com", "ValidPass123");
		expect(mockSet).toHaveBeenCalled();
		expect(mockSet.mock.calls.some((c) => c[0] === "pb_auth")).toBe(true);
	});
	it("logout clears pb_auth and redirects /login without legacy session", async () => {
		vi.resetModules();
		const { logout } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		await expect(logout()).rejects.toThrow();
		const delPb =
			mockDel.mock.calls.some((c) => c[0] === "pb_auth") ||
			mockSet.mock.calls.some((c) => c[0] === "pb_auth");
		const delSess =
			mockDel.mock.calls.some((c) => c[0] === "session") ||
			mockSet.mock.calls.some((c) => c[0] === "session");
		expect(delPb).toBe(true);
		expect(delSess).toBe(false);
		expect(mockRedirect).toHaveBeenCalledWith("/login");
		const src = fs.readFileSync(path.join(process.cwd(), "app/actions/auth.ts"), "utf8");
		expect(src).toContain("clearAuthCookie");
		expect(src).not.toContain("clearLegacySessionCookie");
		expect(src).toContain('redirect("/login")');
	});
	it("Zod validation distinguishable from credentials", async () => {
		vi.resetModules();
		const { login } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const bad = await login(fdLogin("bad-email", ""));
		expect(bad.error).not.toBe("Credenciales inválidas");
		// now credential failure
		mockAuthWithPassword.mockRejectedValueOnce(Object.assign(new Error("Failed"), { status: 400 }));
		vi.resetModules();
		const { login: login2 } = await import("../app/actions/auth");
		cookiesMock.mockResolvedValue({ get: mockGet, set: mockSet, delete: mockDel });
		const cred = await login2(fdLogin("a@b.com", "ValidPass123"));
		expect(cred.error).toBe("Credenciales inválidas");
		expect(bad.error).not.toBe(cred.error);
	});
	it("app/actions/auth uses PocketBase and no raw logs", async () => {
		const src = fs.readFileSync(path.join(process.cwd(), "app/actions/auth.ts"), "utf8");
		expect(src).toContain("createPocketBaseClient");
		expect(src).toContain("saveAuthCookie");
		expect(src).not.toContain("console.error");
		expect(src).not.toContain("console.log");
	});
	it("no network in tests - all PB calls mocked", async () => {
		// ensure we never hit real PB: POCKETBASE_URL is set but no fetch
		expect(process.env.POCKETBASE_URL).toBe("http://127.0.0.1:8090");
		// this test just ensures mocks exist
		expect(mockCtor).toBeDefined();
	});
});

describe("auth entry pages do not disclose backend or environment state", () => {
	it("/login does not expose backend technology or empty environment state", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "app/login/page.tsx"), "utf8");
		const lower = src.toLowerCase();
		expect(lower).not.toContain("pocketbase");
		expect(lower).not.toContain("appwrite");
		expect(lower).not.toContain("backend");
		expect(lower).not.toContain("database");
		expect(lower).not.toContain("storage");
		expect(lower).not.toContain("entorno");
		expect(lower).not.toContain("vacío");
		expect(lower).not.toContain("vacio");
		expect(lower).not.toContain("comienza");
		expect(lower).not.toContain("starts empty");
		expect(lower).not.toContain("environment starts");
	});
	it("/register does not expose backend technology or empty environment state", () => {
		const src = fs.readFileSync(path.join(process.cwd(), "app/register/page.tsx"), "utf8");
		const lower = src.toLowerCase();
		expect(lower).not.toContain("pocketbase");
		expect(lower).not.toContain("appwrite");
		expect(lower).not.toContain("backend");
		expect(lower).not.toContain("database");
		expect(lower).not.toContain("storage");
		expect(lower).not.toContain("entorno");
		expect(lower).not.toContain("vacío");
		expect(lower).not.toContain("vacio");
		expect(lower).not.toContain("comienza");
		expect(lower).not.toContain("starts empty");
		expect(lower).not.toContain("environment starts");
	});
});
