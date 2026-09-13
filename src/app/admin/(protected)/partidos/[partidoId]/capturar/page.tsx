import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlineacionForm } from "./alineacion-form";

export default async function CapturarPartidoPage({
  params,
}: {
  params: Promise<{ partidoId: string }>;
}) {
  const { partidoId } = await params;
  const supabase = await createClient();

  const { data: partido } = await supabase
    .from("partidos")
    .select("id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora")
    .eq("id", partidoId)
    .maybeSingle();

  if (!partido) {
    notFound();
  }

  const { data: jornada } = await supabase
    .from("jornadas")
    .select("torneo_id, etiqueta")
    .eq("id", partido.jornada_id)
    .maybeSingle();

  const { data: equipoLocal } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_local_id)
    .maybeSingle();

  const { data: equipoVisitante } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_visitante_id)
    .maybeSingle();

  const { data: jugadorasLocal } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_local_id)
    .order("nombre");

  const { data: jugadorasVisitante } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_visitante_id)
    .order("nombre");

  const { data: alineaciones } = await supabase
    .from("alineaciones")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const { data: goles } = await supabase
    .from("goles")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const golesLocal = (goles ?? []).filter((gol) => idsLocal.has(gol.jugadora_id)).length;
  const golesVisitante = (goles ?? []).filter((gol) => idsVisitante.has(gol.jugadora_id)).length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={
          jornada?.torneo_id
            ? `/admin/torneos/${jornada.torneo_id}/jornadas/${partido.jornada_id}/partidos`
            : "/admin/torneos"
        }
        className="underline"
      >
        ← Volver a Partidos
      </Link>
      <h1 className="text-xl font-semibold">
        {equipoLocal?.nombre ?? "Local"} {golesLocal} — {golesVisitante}{" "}
        {equipoVisitante?.nombre ?? "Visitante"}
      </h1>
      <p className="text-sm text-gray-600">
        {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
      </p>
      <AlineacionForm
        partidoId={partidoId}
        equipoLocalId={partido.equipo_local_id}
        equipoVisitanteId={partido.equipo_visitante_id}
        nombreLocal={equipoLocal?.nombre ?? "Local"}
        nombreVisitante={equipoVisitante?.nombre ?? "Visitante"}
        jugadorasLocal={jugadorasLocal ?? []}
        jugadorasVisitante={jugadorasVisitante ?? []}
        seleccionadasIniciales={(alineaciones ?? []).map((fila) => fila.jugadora_id)}
      />
    </div>
  );
}
