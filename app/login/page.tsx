"use client";

import { login } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Mail,
  Lock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const messageParam = searchParams.get("message");

  const [isPending, setIsPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validaciones en tiempo real
  const emailError = useMemo(() => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Correo electrónico no válido";
    return null;
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return null;
    if (password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres";
    return null;
  }, [password]);

  const isValid = email && password && !emailError && !passwordError;

  const handleAction = async (formData: FormData) => {
    if (!isValid) return;
    setIsPending(true);
    try {
      await login(formData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-8 transition-colors duration-500 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-2xl mb-4 group transition-transform hover:scale-110 duration-300">
            <LayoutDashboard className="h-7 w-7 group-hover:rotate-12 transition-transform" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
            Bienvenido de nuevo
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-xs mx-auto">
            Ingresa tus credenciales para acceder al panel de gestión
          </p>
        </div>

        <div className="group relative">
          <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 opacity-20 blur-xl transition duration-1000 group-hover:opacity-40 group-hover:duration-200"></div>

          <div className="relative rounded-3xl bg-white dark:bg-zinc-900 p-6 md:p-10 shadow-3xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-2xl">
            <form action={handleAction} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label
                    htmlFor="email"
                    className="text-sm font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Correo Electrónico
                  </label>
                  {emailError && (
                    <span className="text-[10px] md:text-xs text-red-500 font-medium animate-in fade-in slide-in-from-right-2">
                      {emailError}
                    </span>
                  )}
                </div>
                <div className="relative group/input">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                      emailError
                        ? "text-red-400"
                        : "text-zinc-400 group-focus-within/input:text-zinc-900 dark:group-focus-within/input:text-zinc-100"
                    }`}
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className={`pl-10 h-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all ${
                      emailError
                        ? "border-red-300 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-900/20"
                        : ""
                    }`}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label
                    htmlFor="password"
                    className="text-sm font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Contraseña
                  </label>
                  {passwordError && (
                    <span className="text-[10px] md:text-xs text-red-500 font-medium animate-in fade-in slide-in-from-right-2">
                      {passwordError}
                    </span>
                  )}
                </div>
                <div className="relative group/input">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                      passwordError
                        ? "text-red-400"
                        : "text-zinc-400 group-focus-within/input:text-zinc-900 dark:group-focus-within/input:text-zinc-100"
                    }`}
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`pl-10 h-12 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all ${
                      passwordError
                        ? "border-red-300 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-900/20"
                        : ""
                    }`}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {messageParam && (
                <div className="flex items-start gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 animate-in zoom-in-95 duration-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <p className="font-medium leading-relaxed">{messageParam}</p>
                </div>
              )}

              {errorParam && (
                <div className="flex items-center gap-3 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50 animate-shake">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">
                    {(() => {
                      if (
                        errorParam === "Invalid login credentials" ||
                        errorParam === "Could not authenticate user"
                      ) {
                        return "Credenciales inválidas. Verifica tu correo y contraseña.";
                      }
                      if (errorParam === "Email not confirmed") {
                        return "Debes confirmar tu correo antes de ingresar.";
                      }
                      if (errorParam === "Invalid refresh token") {
                        return "La sesión ha expirado. Por favor, ingresa de nuevo.";
                      }
                      return "Ocurrió un error al intentar ingresar. Por favor, intenta más tarde.";
                    })()}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending || !isValid}
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-extrabold rounded-xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative"
              >
                <span
                  className={`flex items-center justify-center gap-2 transition-transform duration-300 ${
                    isPending ? "translate-y-10" : "translate-y-0"
                  }`}
                >
                  Ingresar al Panel
                </span>
                {isPending && (
                  <span className="absolute inset-0 flex items-center justify-center animate-in slide-in-from-bottom-10 h-full">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
              ¿Aún no tienes cuenta?{" "}
              <Link
                href="/register"
                className="font-extrabold text-zinc-950 dark:text-zinc-50 hover:underline decoration-zinc-400 underline-offset-4"
              >
                Regístrate aquí
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> Sistema de Garantías Seguro
          </p>
        </div>
      </div>
    </div>
  );
}
