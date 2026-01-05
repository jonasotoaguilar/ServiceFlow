"use client";

import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(signUp, null);

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-800">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
          Crear Cuenta
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Únete para gestionar tus garantías
        </p>
      </div>

      <form action={action} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nombre Completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>
        </div>

        {state?.error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center animate-shake">
            {state.error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Registrarse"
            )}
          </button>
        </div>
      </form>
      <div className="text-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?{" "}
        </span>
        <Link
          href="/login"
          className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
        >
          Inicia Sesión
        </Link>
      </div>
    </div>
  );
}
