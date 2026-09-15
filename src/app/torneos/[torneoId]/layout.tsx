import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { TorneoNav } from "@/components/public/torneo-nav";

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
    <div className="mx-auto flex max-w-[1160px] flex-col">
      <header
        className="sticky top-0 z-10 flex flex-col gap-3 border-b border-linea px-4 pb-3"
        style={{
          paddingTop: "calc(.55rem + env(safe-area-inset-top))",
          background: "rgba(244,237,224,.94)",
          backdropFilter: "saturate(1.4) blur(8px)",
        }}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-2 underline"
          >
            Cambiar torneo
          </Link>
        </div>
        <p className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-2">
          {torneo?.nombre ?? "Torneo"}
        </p>
        <TorneoNav torneoId={torneoId} />
      </header>
      <main className="flex flex-col gap-6 p-4">{children}</main>
    </div>
  );
}
