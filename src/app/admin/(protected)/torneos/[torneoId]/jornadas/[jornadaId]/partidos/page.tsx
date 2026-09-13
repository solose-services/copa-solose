import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PartidoForm } from "./partido-form";

export default async function PartidosPage({
  params,
}: {
  params: Promise<{ torneoId: string; jornadaId: string }>;
}) {
  const { torneoId, jornadaId } = await params;
  const supabase = await createClient();

  const { data: jornada } = await supabase
    .from("jornadas")
    .select("etiqueta")
    .eq("id", jornadaId)
    .maybeSingle();

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre")
    .eq("torneo_id", torneoId)
    .order("nombre");

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));

  const { data: partidos, error: partidosError } = await supabase
    .from("partidos")
    .select("id, equipo_local_id, equipo_visitante_id, fecha, hora")
    .eq("jornada_id", jornadaId)
    .order("fecha");

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/admin/torneos/${torneoId}/jornadas`} className="underline">
        ← Volver a Jornadas
      </Link>
      <h1 className="text-xl font-semibold">
        Partidos — {jornada?.etiqueta ?? "Jornada"}
      </h1>
      <PartidoForm jornadaId={jornadaId} torneoId={torneoId} equipos={equipos ?? []} />
      {partidosError ? (
        <p className="text-red-600">No se pudieron cargar los partidos. Intenta de nuevo.</p>
      ) : (
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Local</th>
            <th className="p-2">Visitante</th>
            <th className="p-2">Fecha</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(partidos ?? []).map((partido) => (
            <tr key={partido.id} className="border-t">
              <td className="p-2">
                {nombrePorEquipo.get(partido.equipo_local_id) ?? "Equipo"}
              </td>
              <td className="p-2">
                {nombrePorEquipo.get(partido.equipo_visitante_id) ?? "Equipo"}
              </td>
              <td className="p-2">{partido.fecha ?? "—"}</td>
              <td className="p-2">
                <Link href={`/admin/partidos/${partido.id}/capturar`} className="underline">
                  Capturar
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
