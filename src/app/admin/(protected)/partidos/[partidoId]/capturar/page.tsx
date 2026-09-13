import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlineacionForm } from "./alineacion-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { GolForm } from "./gol-form";
import { eliminarGol } from "./actions";
import { TarjetaForm } from "./tarjeta-form";
import { eliminarTarjeta } from "./actions";
import { MvpForm } from "./mvp-form";
import { IncidenciasForm } from "./incidencias-form";

export default async function CapturarPartidoPage({
  params,
}: {
  params: Promise<{ partidoId: string }>;
}) {
  const { partidoId } = await params;
  const supabase = await createClient();

  const { data: partido } = await supabase
    .from("partidos")
    .select(
      "id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora, mvp_jugadora_id, incidencias"
    )
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

  const { data: golesDetalle, error: golesError } = await supabase
    .from("goles")
    .select("id, jugadora_id, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const { data: tarjetasDetalle, error: tarjetasError } = await supabase
    .from("tarjetas")
    .select("id, jugadora_id, tipo, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const jugadorasQueJugaron = [
    ...(jugadorasLocal ?? []).filter((jugadora) =>
      (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
    ),
    ...(jugadorasVisitante ?? []).filter((jugadora) =>
      (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
    ),
  ];

  const nombrePorJugadora = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      jugadora.nombre,
    ])
  );

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const golesLocal = (golesDetalle ?? []).filter((gol) => idsLocal.has(gol.jugadora_id)).length;
  const golesVisitante = (golesDetalle ?? []).filter((gol) =>
    idsVisitante.has(gol.jugadora_id)
  ).length;

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
      <section className="flex flex-col gap-3 rounded border p-4">
        <h2 className="font-semibold">Goles</h2>
        <GolForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {golesError ? (
          <p className="text-red-600">No se pudieron cargar los goles. Intenta de nuevo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(golesDetalle ?? []).map((gol) => (
              <li key={gol.id} className="flex items-center gap-3">
                <span>
                  {nombrePorJugadora.get(gol.jugadora_id) ?? "Jugadora"} — min. {gol.minuto}
                </span>
                <DeleteButton
                  onDelete={eliminarGol.bind(null, gol.id, partidoId)}
                  confirmMessage="¿Eliminar este gol? Esto no se puede deshacer."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded border p-4">
        <h2 className="font-semibold">Tarjetas</h2>
        <TarjetaForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {tarjetasError ? (
          <p className="text-red-600">No se pudieron cargar las tarjetas. Intenta de nuevo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(tarjetasDetalle ?? []).map((tarjeta) => (
              <li key={tarjeta.id} className="flex items-center gap-3">
                <span>
                  {nombrePorJugadora.get(tarjeta.jugadora_id) ?? "Jugadora"} — {tarjeta.tipo} —
                  min. {tarjeta.minuto}
                </span>
                <DeleteButton
                  onDelete={eliminarTarjeta.bind(null, tarjeta.id, partidoId)}
                  confirmMessage="¿Eliminar esta tarjeta? Esto no se puede deshacer."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <MvpForm
        partidoId={partidoId}
        jugadorasQueJugaron={jugadorasQueJugaron}
        mvpActual={partido.mvp_jugadora_id}
      />
      <IncidenciasForm partidoId={partidoId} incidenciasActuales={partido.incidencias} />
    </div>
  );
}
