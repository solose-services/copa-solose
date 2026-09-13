import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarMarcador } from "@/lib/marcador";

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta, orden")
    .eq("torneo_id", torneoId)
    .order("orden");

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre")
    .eq("torneo_id", torneoId);

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));
  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase.from("jugadoras").select("id, equipo_id").in("equipo_id", equipoIds)
      : { data: [] as { id: string; equipo_id: string }[], error: null };

  const idsPorEquipo = new Map<string, Set<string>>();
  for (const jugadora of jugadoras ?? []) {
    const set = idsPorEquipo.get(jugadora.equipo_id) ?? new Set<string>();
    set.add(jugadora.id);
    idsPorEquipo.set(jugadora.equipo_id, set);
  }

  const jornadaIds = (jornadas ?? []).map((jornada) => jornada.id);

  const { data: partidos, error: partidosError } =
    jornadaIds.length > 0
      ? await supabase
          .from("partidos")
          .select("id, jornada_id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIds)
      : {
          data: [] as {
            id: string;
            jornada_id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        };

  const partidoIds = (partidos ?? []).map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const golesPorPartido = new Map<string, { jugadoraId: string }[]>();
  for (const gol of goles ?? []) {
    const lista = golesPorPartido.get(gol.partido_id) ?? [];
    lista.push({ jugadoraId: gol.jugadora_id });
    golesPorPartido.set(gol.partido_id, lista);
  }

  const partidosPorJornada = new Map<string, typeof partidos>();
  for (const partido of partidos ?? []) {
    const lista = partidosPorJornada.get(partido.jornada_id) ?? [];
    lista.push(partido);
    partidosPorJornada.set(partido.jornada_id, lista);
  }

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const hayError = Boolean(
    jornadasError || equiposError || jugadorasError || partidosError || golesError
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Calendario</h1>
      {hayError ? (
        <p className="text-red-600">No se pudo cargar el calendario. Intenta de nuevo.</p>
      ) : (
        (jornadas ?? []).map((jornada) => (
          <section key={jornada.id} className="flex flex-col gap-2">
            <h2 className="font-semibold">{jornada.etiqueta}</h2>
            <ul className="flex flex-col gap-2">
              {(partidosPorJornada.get(jornada.id) ?? []).map((partido) => {
                const yaJugado = Boolean(partido.fecha && partido.fecha <= hoy);
                const { golesLocal, golesVisitante } = contarMarcador(
                  golesPorPartido.get(partido.id) ?? [],
                  idsPorEquipo.get(partido.equipo_local_id) ?? new Set(),
                  idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set()
                );

                return (
                  <li key={partido.id} className="rounded border p-3">
                    <Link
                      href={`/partidos/${partido.id}`}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {nombrePorEquipo.get(partido.equipo_local_id) ?? "Equipo"}
                        {yaJugado ? ` ${golesLocal} — ${golesVisitante} ` : " vs "}
                        {nombrePorEquipo.get(partido.equipo_visitante_id) ?? "Equipo"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {partido.fecha ?? "Sin fecha"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
