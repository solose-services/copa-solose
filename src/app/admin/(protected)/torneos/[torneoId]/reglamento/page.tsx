import Link from "next/link";
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
      <Link href="/admin/torneos" className="underline">
        ← Volver a Torneos
      </Link>
      <h1 className="text-xl font-semibold">Reglamento — {torneo?.nombre ?? "Torneo"}</h1>
      {reglamentoError ? (
        <p className="text-red-600">No se pudo cargar el reglamento actual. Intenta de nuevo.</p>
      ) : reglamento?.pdf_url ? (
        <p>
          Reglamento actual:{" "}
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            ver PDF
          </a>
        </p>
      ) : (
        <p className="text-gray-600">Todavía no se ha subido un reglamento.</p>
      )}
      <ReglamentoForm torneoId={torneoId} />
    </div>
  );
}
