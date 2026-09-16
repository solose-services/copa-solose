import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarMarcador } from "@/lib/marcador";
import { formatearEtiquetaJornada, tituloJornada } from "@/lib/jornada";
import { formatearHora, formatearFechaCorta } from "@/lib/fecha";
import { Avatar } from "@/components/ui/avatar";

export default async function CalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ torneoId: string }>;
  searchParams: Promise<{ jornada?: string }>;
}) {
  const { torneoId } = await params;
  const { jornada: jornadaSeleccionadaId } = await searchParams;
  const supabase = await createClient();

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta, orden")
    .eq("torneo_id", torneoId)
    .order("orden");

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId);

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
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
          .select("id, jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora")
          .in("jornada_id", jornadaIds)
      : {
          data: [] as {
            id: string;
            jornada_id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
            hora: string | null;
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

  const jornadasOrdenadas = jornadas ?? [];
  const jornadaConPartidoJugado = new Set(
    (partidos ?? [])
      .filter((partido) => partido.fecha && partido.fecha <= hoy)
      .map((partido) => partido.jornada_id)
  );
  let jornadaActualId: string | undefined = jornadasOrdenadas[0]?.id;
  for (const jornada of jornadasOrdenadas) {
    if (jornadaConPartidoJugado.has(jornada.id)) {
      jornadaActualId = jornada.id;
    }
  }

  const jornadaSeleccionada =
    jornadasOrdenadas.find((jornada) => jornada.id === jornadaSeleccionadaId) ??
    jornadasOrdenadas.find((jornada) => jornada.id === jornadaActualId) ??
    jornadasOrdenadas[0];

  const indiceSeleccionada = jornadasOrdenadas.findIndex(
    (jornada) => jornada.id === jornadaSeleccionada?.id
  );
  const jornadaAnterior = indiceSeleccionada > 0 ? jornadasOrdenadas[indiceSeleccionada - 1] : undefined;

  function fechaMasTempranaDeJornada(jornadaId: string): string | null {
    const fechas = (partidosPorJornada.get(jornadaId) ?? [])
      .map((partido) => partido.fecha)
      .filter((fecha): fecha is string => Boolean(fecha));
    if (fechas.length === 0) return null;
    return fechas.reduce((minima, fecha) => (fecha < minima ? fecha : minima));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Calendario</h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el calendario. Intenta de nuevo.
        </p>
      ) : (
        <>
          <nav className="flex gap-3 overflow-x-auto pb-1">
            {jornadasOrdenadas.map((jornada) => {
              const activa = jornada.id === jornadaSeleccionada?.id;
              return (
                <Link
                  key={jornada.id}
                  href={`?jornada=${jornada.id}`}
                  className={
                    activa
                      ? "flex-none border-b-2 border-azul pb-1 font-mono text-[.68rem] uppercase tracking-wider text-azul"
                      : "flex-none border-b-2 border-transparent pb-1 font-mono text-[.68rem] uppercase tracking-wider text-tinta-2"
                  }
                >
                  {formatearEtiquetaJornada(jornada.etiqueta)}
                </Link>
              );
            })}
          </nav>

          {jornadaSeleccionada ? (
            <>
              <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2 border-b-2 border-azul pb-2">
                  <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                    {tituloJornada(jornadaSeleccionada.etiqueta)}
                  </h2>
                  {fechaMasTempranaDeJornada(jornadaSeleccionada.id) && (
                    <span className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                      {formatearFechaCorta(fechaMasTempranaDeJornada(jornadaSeleccionada.id)!)}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col">
                  {(partidosPorJornada.get(jornadaSeleccionada.id) ?? []).map((partido) => {
                    const yaJugado = Boolean(partido.fecha && partido.fecha <= hoy);
                    const { golesLocal, golesVisitante } = contarMarcador(
                      golesPorPartido.get(partido.id) ?? [],
                      idsPorEquipo.get(partido.equipo_local_id) ?? new Set(),
                      idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set()
                    );
                    const local = equipoInfoPorId.get(partido.equipo_local_id);
                    const visitante = equipoInfoPorId.get(partido.equipo_visitante_id);

                    return (
                      <li key={partido.id} className="border-b border-linea-2 last:border-b-0">
                        <Link
                          href={`/partidos/${partido.id}`}
                          className="flex items-stretch gap-3 py-3 hover:text-azul"
                        >
                          <span className="w-10 flex-none pt-0.5 font-mono text-xs text-tinta-2">
                            {partido.hora ? formatearHora(partido.hora) : ""}
                          </span>
                          <div className="flex flex-1 flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-sm font-medium text-azul">
                                <Avatar
                                  src={local?.logoUrl ?? null}
                                  nombre={local?.nombre ?? "Equipo"}
                                  size={18}
                                />
                                {local?.nombre ?? "Equipo"}
                              </span>
                              {yaJugado && (
                                <span className="font-mono text-sm font-medium text-azul">
                                  {golesLocal}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-sm text-tinta-2">
                                <Avatar
                                  src={visitante?.logoUrl ?? null}
                                  nombre={visitante?.nombre ?? "Equipo"}
                                  size={18}
                                />
                                {visitante?.nombre ?? "Equipo"}
                              </span>
                              {yaJugado && (
                                <span className="font-mono text-sm text-tinta-2">
                                  {golesVisitante}
                                </span>
                              )}
                            </div>
                          </div>
                          {!yaJugado && (
                            <span className="flex-none self-center rounded-full border border-linea px-2.5 py-1 font-mono text-[.58rem] uppercase tracking-wider text-tinta-2">
                              Por jugarse
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {jornadaAnterior && (
                <section className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2 border-b-2 border-azul pb-2">
                    <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                      {tituloJornada(jornadaAnterior.etiqueta)}
                    </h2>
                    <span className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                      Finalizada
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {(partidosPorJornada.get(jornadaAnterior.id) ?? []).map((partido) => {
                      const yaJugado = Boolean(partido.fecha && partido.fecha <= hoy);
                      const { golesLocal, golesVisitante } = contarMarcador(
                        golesPorPartido.get(partido.id) ?? [],
                        idsPorEquipo.get(partido.equipo_local_id) ?? new Set(),
                        idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set()
                      );
                      const local = equipoInfoPorId.get(partido.equipo_local_id);
                      const visitante = equipoInfoPorId.get(partido.equipo_visitante_id);

                      return (
                        <li key={partido.id} className="border-b border-linea-2 last:border-b-0">
                          <Link
                            href={`/partidos/${partido.id}`}
                            className="flex items-center justify-between gap-2 py-2.5 text-sm hover:text-azul"
                          >
                            <span className="flex-1 font-medium text-azul">
                              {local?.nombre ?? "Equipo"}
                            </span>
                            <span className="flex-none font-mono">
                              {yaJugado ? `${golesLocal} — ${golesVisitante}` : "vs"}
                            </span>
                            <span className="flex-1 text-right text-tinta-2">
                              {visitante?.nombre ?? "Equipo"}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          ) : (
            <p className="text-sm text-tinta-2">Todavía no hay jornadas registradas.</p>
          )}
        </>
      )}
    </div>
  );
}
