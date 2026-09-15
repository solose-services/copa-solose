import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarMarcador } from "@/lib/marcador";
import { Avatar } from "@/components/ui/avatar";

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
        (jornadas ?? []).map((jornada) => (
          <section key={jornada.id} className="flex flex-col gap-2">
            <p className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
              {jornada.etiqueta}
            </p>
            <ul className="flex flex-col gap-2">
              {(partidosPorJornada.get(jornada.id) ?? []).map((partido) => {
                const yaJugado = Boolean(partido.fecha && partido.fecha <= hoy);
                const { golesLocal, golesVisitante } = contarMarcador(
                  golesPorPartido.get(partido.id) ?? [],
                  idsPorEquipo.get(partido.equipo_local_id) ?? new Set(),
                  idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set()
                );
                const local = equipoInfoPorId.get(partido.equipo_local_id);
                const visitante = equipoInfoPorId.get(partido.equipo_visitante_id);

                return (
                  <li key={partido.id} className="border-b border-linea-2 pb-2 last:border-b-0">
                    <Link
                      href={`/partidos/${partido.id}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Avatar src={local?.logoUrl ?? null} nombre={local?.nombre ?? "Equipo"} size={20} />
                        {local?.nombre ?? "Equipo"}
                        {yaJugado ? (
                          <span className="font-mono">
                            {golesLocal} — {golesVisitante}
                          </span>
                        ) : (
                          <span className="font-mono text-tinta-3">vs</span>
                        )}
                        <Avatar
                          src={visitante?.logoUrl ?? null}
                          nombre={visitante?.nombre ?? "Equipo"}
                          size={20}
                        />
                        {visitante?.nombre ?? "Equipo"}
                      </span>
                      <span className="font-mono text-[.6rem] text-tinta-3">
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
