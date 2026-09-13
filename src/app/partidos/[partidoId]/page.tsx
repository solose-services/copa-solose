import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { contarMarcador } from "@/lib/marcador";

export default async function DetallePartidoPage({
  params,
}: {
  params: Promise<{ partidoId: string }>;
}) {
  const { partidoId } = await params;
  const supabase = await createClient();

  const { data: partido, error: partidoError } = await supabase
    .from("partidos")
    .select(
      "id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora, mvp_jugadora_id, incidencias"
    )
    .eq("id", partidoId)
    .maybeSingle();

  if (!partido && !partidoError) {
    notFound();
  }

  if (partidoError || !partido) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <p className="text-red-600">No se pudo cargar el detalle del partido. Intenta de nuevo.</p>
      </div>
    );
  }

  const { data: jornada, error: jornadaError } = await supabase
    .from("jornadas")
    .select("etiqueta")
    .eq("id", partido.jornada_id)
    .maybeSingle();

  const { data: equipoLocal, error: equipoLocalError } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_local_id)
    .maybeSingle();

  const { data: equipoVisitante, error: equipoVisitanteError } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_visitante_id)
    .maybeSingle();

  const { data: jugadorasLocal, error: jugadorasLocalError } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_local_id);

  const { data: jugadorasVisitante, error: jugadorasVisitanteError } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_visitante_id);

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const nombrePorJugadora = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      jugadora.nombre,
    ])
  );

  const { data: alineaciones, error: alineacionesError } = await supabase
    .from("alineaciones")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const { data: goles, error: golesError } = await supabase
    .from("goles")
    .select("jugadora_id, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const { data: tarjetas, error: tarjetasError } = await supabase
    .from("tarjetas")
    .select("jugadora_id, tipo, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const hayError = Boolean(
    jornadaError ||
      equipoLocalError ||
      equipoVisitanteError ||
      jugadorasLocalError ||
      jugadorasVisitanteError ||
      alineacionesError ||
      golesError ||
      tarjetasError
  );

  const { golesLocal, golesVisitante } = contarMarcador(
    (goles ?? []).map((gol) => ({ jugadoraId: gol.jugadora_id })),
    idsLocal,
    idsVisitante
  );

  const jugadorasQueJugaronLocal = (jugadorasLocal ?? []).filter((jugadora) =>
    (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
  );
  const jugadorasQueJugaronVisitante = (jugadorasVisitante ?? []).filter((jugadora) =>
    (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      {hayError ? (
        <p className="text-red-600">No se pudo cargar el detalle del partido. Intenta de nuevo.</p>
      ) : (
        <>
          <h1 className="text-xl font-semibold">
            <NombreEquipo id={partido.equipo_local_id} nombre={equipoLocal?.nombre ?? "Local"} />{" "}
            {golesLocal} — {golesVisitante}{" "}
            <NombreEquipo
              id={partido.equipo_visitante_id}
              nombre={equipoVisitante?.nombre ?? "Visitante"}
            />
          </h1>
          <p className="text-sm text-gray-600">
            {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
          </p>

          <section>
            <h2 className="font-semibold">Alineaciones</h2>
            <div className="flex flex-wrap gap-8">
              <ul>
                {jugadorasQueJugaronLocal.map((jugadora) => (
                  <li key={jugadora.id}>
                    <NombreJugadora id={jugadora.id} nombre={jugadora.nombre} />
                  </li>
                ))}
              </ul>
              <ul>
                {jugadorasQueJugaronVisitante.map((jugadora) => (
                  <li key={jugadora.id}>
                    <NombreJugadora id={jugadora.id} nombre={jugadora.nombre} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-semibold">Goles</h2>
            <ul>
              {(goles ?? []).map((gol, indice) => (
                <li key={indice}>
                  <NombreJugadora
                    id={gol.jugadora_id}
                    nombre={nombrePorJugadora.get(gol.jugadora_id) ?? "Jugadora"}
                  />{" "}
                  — min. {gol.minuto}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-semibold">Tarjetas</h2>
            <ul>
              {(tarjetas ?? []).map((tarjeta, indice) => (
                <li key={indice}>
                  <NombreJugadora
                    id={tarjeta.jugadora_id}
                    nombre={nombrePorJugadora.get(tarjeta.jugadora_id) ?? "Jugadora"}
                  />{" "}
                  — {tarjeta.tipo} — min. {tarjeta.minuto}
                </li>
              ))}
            </ul>
          </section>

          {partido.mvp_jugadora_id && (
            <p>
              Jugadora del partido:{" "}
              <NombreJugadora
                id={partido.mvp_jugadora_id}
                nombre={nombrePorJugadora.get(partido.mvp_jugadora_id) ?? "Jugadora"}
              />
            </p>
          )}

          {partido.incidencias && (
            <section>
              <h2 className="font-semibold">Incidencias</h2>
              <p>{partido.incidencias}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
