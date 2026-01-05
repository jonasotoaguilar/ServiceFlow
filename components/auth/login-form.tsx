"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, null);

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-800">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          Bienvenido
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Inicia sesión para gestionar tus garantías
        </p>
      </div>

      <form action={action} className="mt-8 space-y-6">
        <div className="space-y-4">
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
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
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
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
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
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </div>
      </form>
      <div className="text-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          ¿No tienes cuenta?{" "}
        </span>
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
}
