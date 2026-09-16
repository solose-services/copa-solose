"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateLoginForm, type LoginFormErrors } from "@/lib/auth/login-form";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorGeneral(null);

    const validationErrors = validateLoginForm({ email, password });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setCargando(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorGeneral("Correo o contraseña incorrectos.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorGeneral("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Logo />
      <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
        Acceso de administración
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-0 border-b border-linea bg-transparent px-1 py-2 text-sm focus:border-azul focus:outline-none"
          />
          {errors.email && <span className="text-sm text-vino">{errors.email}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-0 border-b border-linea bg-transparent px-1 py-2 text-sm focus:border-azul focus:outline-none"
          />
          {errors.password && <span className="text-sm text-vino">{errors.password}</span>}
        </label>
        {errorGeneral && (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            {errorGeneral}
          </p>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
