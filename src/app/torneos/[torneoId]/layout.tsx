import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export default async function TorneoLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("nombre")
    .eq("id", torneoId)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2 border-b pb-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">{torneo?.nombre ?? "Torneo"}</span>
          <Link href="/" className="text-sm underline">
            Cambiar torneo
          </Link>
        </div>
        <nav className="flex gap-4">
          <Link href={`/torneos/${torneoId}/calendario`} className="underline">
            Calendario
          </Link>
          <Link href={`/torneos/${torneoId}/posiciones`} className="underline">
            Posiciones
          </Link>
          <Link href={`/torneos/${torneoId}/goleadoras`} className="underline">
            Goleadoras
          </Link>
        </nav>
        <nav className="flex gap-4 text-sm text-gray-600">
          <Link href={`/torneos/${torneoId}/suspendidas`} className="underline">
            Suspendidas
          </Link>
          <Link href={`/torneos/${torneoId}/reglamento`} className="underline">
            Reglamento
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
