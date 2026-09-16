import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JornadaForm } from "./jornada-form";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";

export default async function JornadasPage({
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

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta, tipo, orden")
    .eq("torneo_id", torneoId)
    .order("orden");

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
          Jornadas — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nueva jornada…">
        <JornadaForm torneoId={torneoId} />
      </FormularioColapsable>
      {jornadasError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las jornadas. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Etiqueta
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Tipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Orden
                </th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(jornadas ?? []).map((jornada) => (
                <tr key={jornada.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">{jornada.etiqueta}</td>
                  <td className="p-2 text-sm">{jornada.tipo}</td>
                  <td className="p-2 text-sm">{jornada.orden}</td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneoId}/jornadas/${jornada.id}/partidos`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver partidos
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
