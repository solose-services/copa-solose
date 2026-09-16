"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
    <button
      onClick={handleSignOut}
      disabled={cargando}
      className="inline-flex items-center gap-1.5 rounded-sm border border-linea bg-papel px-3 py-1.5 text-sm font-medium hover:border-azul hover:text-azul disabled:opacity-50"
    >
      <LogOut size={14} strokeWidth={1.7} />
      Cerrar sesión
    </button>
  );
}
