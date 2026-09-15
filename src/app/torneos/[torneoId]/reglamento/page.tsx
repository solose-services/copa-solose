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
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Reglamento</h1>
      </div>
      {reglamentoError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el reglamento. Intenta de nuevo.
        </p>
      ) : reglamento?.pdf_url ? (
        <div className="flex flex-col gap-3">
          <a
            href={reglamento.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-azul underline"
          >
            Abrir el reglamento en una pestaña nueva
          </a>
          <p className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
            Si no ves el PDF abajo, ábrelo en una pestaña nueva con el enlace de arriba.
          </p>
          <iframe
            src={reglamento.pdf_url}
            title="Reglamento del torneo"
            className="h-[70vh] w-full rounded-md border border-linea"
          />
        </div>
      ) : (
        <p className="text-sm text-tinta-2">
          Todavía no se ha publicado el reglamento de este torneo.
        </p>
      )}
    </div>
  );
}
