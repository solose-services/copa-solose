"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateLoginForm, type LoginFormErrors } from "@/lib/auth/login-form";

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Acceso de administración</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <label className="flex flex-col gap-1">
          <span>Correo</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border px-3 py-2"
          />
          {errors.email && <span className="text-sm text-red-600">{errors.email}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border px-3 py-2"
          />
          {errors.password && (
            <span className="text-sm text-red-600">{errors.password}</span>
          )}
        </label>
        {errorGeneral && <p className="text-sm text-red-600">{errorGeneral}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
