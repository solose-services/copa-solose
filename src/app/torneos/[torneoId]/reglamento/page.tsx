import { createClient } from "@/lib/supabase/server";

export default async function ReglamentoPublicoPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: reglamento, error: reglamentoError } = await supabase
    .from("reglamentos")
    .select("pdf_url")
    .eq("torneo_id", torneoId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Reglamento</h1>
      {reglamentoError ? (
        <p className="text-red-600">No se pudo cargar el reglamento. Intenta de nuevo.</p>
      ) : reglamento?.pdf_url ? (
        <div className="flex flex-col gap-3">
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Abrir el reglamento en una pestaña nueva
          </a>
          <iframe
            src={reglamento.pdf_url}
            title="Reglamento del torneo"
            className="h-[70vh] w-full rounded border"
          />
        </div>
      ) : (
        <p className="text-gray-600">Todavía no se ha publicado el reglamento de este torneo.</p>
      )}
    </div>
  );
}
