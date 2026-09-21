import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReglamentoForm } from "./reglamento-form";

export default async function ReglamentoPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("nombre")
    .eq("id", torneoId)
    .maybeSingle();

  const { data: reglamento, error: reglamentoError } = await supabase
    .from("reglamentos")
    .select("pdf_url, actualizado_en")
    .eq("torneo_id", torneoId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/torneos"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Torneos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Reglamento — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>
      {reglamentoError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudo cargar el reglamento actual. Intenta de nuevo.
        </p>
      ) : reglamento?.pdf_url ? (
        <p className="text-sm">
          Reglamento actual:{" "}
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-azul underline"
          >
            ver PDF
          </a>
        </p>
      ) : (
        <p className="text-sm text-tinta-2">Todavía no se ha subido un reglamento.</p>
      )}
      <ReglamentoForm torneoId={torneoId} />
    </div>
  );
}
