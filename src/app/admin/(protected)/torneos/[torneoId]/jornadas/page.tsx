import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JornadaForm } from "./jornada-form";

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
      <Link href="/admin/torneos" className="underline">
        ← Volver a Torneos
      </Link>
      <h1 className="text-xl font-semibold">
        Jornadas — {torneo?.nombre ?? "Torneo"}
      </h1>
      <JornadaForm torneoId={torneoId} />
      {jornadasError ? (
        <p className="text-red-600">No se pudieron cargar las jornadas. Intenta de nuevo.</p>
      ) : (
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Etiqueta</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Orden</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(jornadas ?? []).map((jornada) => (
            <tr key={jornada.id} className="border-t">
              <td className="p-2">{jornada.etiqueta}</td>
              <td className="p-2">{jornada.tipo}</td>
              <td className="p-2">{jornada.orden}</td>
              <td className="p-2">
                <Link
                  href={`/admin/torneos/${torneoId}/jornadas/${jornada.id}/partidos`}
                  className="underline"
                >
                  Ver partidos
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
