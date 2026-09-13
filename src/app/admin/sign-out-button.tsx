"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function handleSignOut() {
    setCargando(true);
    const supabase = createClient();

    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors: the goal is always to land on the login page.
    } finally {
      router.push("/admin/login");
      router.refresh();
      setCargando(false);
    }
  }

  return (
    <button onClick={handleSignOut} disabled={cargando} className="text-sm underline disabled:opacity-50">
      Cerrar sesión
    </button>
  );
}
