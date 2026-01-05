import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100 via-gray-50 to-gray-50 dark:from-purple-950/30 dark:via-zinc-950 dark:to-zinc-950">
      <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-zinc-800/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        <RegisterForm />
      </div>
    </div>
  );
}
