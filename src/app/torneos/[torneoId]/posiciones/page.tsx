import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { calcularPosiciones, type PartidoParaPosiciones } from "@/lib/posiciones";

export default async function PosicionesPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, orden_desempate_manual")
    .eq("torneo_id", torneoId)
    .order("nombre");

  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);
  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
  const ordenDesempateManualPorEquipo = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, equipo.orden_desempate_manual])
  );

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

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id")
    .eq("torneo_id", torneoId)
    .eq("tipo", "regular");

  const jornadaIds = (jornadas ?? []).map((jornada) => jornada.id);

  const { data: partidosRaw, error: partidosError } =
    jornadaIds.length > 0
      ? await supabase
          .from("partidos")
          .select("id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIds)
      : {
          data: [] as {
            id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        };

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const partidosJugados = (partidosRaw ?? []).filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIds = partidosJugados.map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("partido_id, jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string; tipo: string }[], error: null };

  const partidosParaCalculo: PartidoParaPosiciones[] = partidosJugados.map((partido) => {
    const idsLocal = idsPorEquipo.get(partido.equipo_local_id) ?? new Set<string>();
    const idsVisitante = idsPorEquipo.get(partido.equipo_visitante_id) ?? new Set<string>();

    let golesLocal = 0;
    let golesVisitante = 0;
    for (const gol of goles ?? []) {
      if (gol.partido_id !== partido.id) continue;
      if (idsLocal.has(gol.jugadora_id)) golesLocal += 1;
      else if (idsVisitante.has(gol.jugadora_id)) golesVisitante += 1;
    }

    let tarjetasAmarillasLocal = 0;
    let tarjetasRojasLocal = 0;
    let tarjetasAmarillasVisitante = 0;
    let tarjetasRojasVisitante = 0;
    for (const tarjeta of tarjetas ?? []) {
      if (tarjeta.partido_id !== partido.id) continue;
      const esLocal = idsLocal.has(tarjeta.jugadora_id);
      const esVisitante = idsVisitante.has(tarjeta.jugadora_id);
      if (esLocal && tarjeta.tipo === "amarilla") tarjetasAmarillasLocal += 1;
      else if (esLocal && tarjeta.tipo === "roja") tarjetasRojasLocal += 1;
      else if (esVisitante && tarjeta.tipo === "amarilla") tarjetasAmarillasVisitante += 1;
      else if (esVisitante && tarjeta.tipo === "roja") tarjetasRojasVisitante += 1;
    }

    return {
      equipoLocalId: partido.equipo_local_id,
      equipoVisitanteId: partido.equipo_visitante_id,
      golesLocal,
      golesVisitante,
      tarjetasAmarillasLocal,
      tarjetasRojasLocal,
      tarjetasAmarillasVisitante,
      tarjetasRojasVisitante,
    };
  });

  const tabla = calcularPosiciones(equipoIds, partidosParaCalculo, ordenDesempateManualPorEquipo);

  const hayError = Boolean(
    equiposError ||
      jugadorasError ||
      jornadasError ||
      partidosError ||
      golesError ||
      tarjetasError
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Posiciones</h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las posiciones. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Equipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  PJ
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Pts
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  GF
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  GC
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  DG
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  TA
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  TR
                </th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => (
                <tr key={fila.equipoId} className="border-b border-linea-2">
                  <td className="p-2 text-sm">
                    <NombreEquipo
                      id={fila.equipoId}
                      nombre={equipoInfoPorId.get(fila.equipoId)?.nombre ?? "Equipo"}
                      logoUrl={equipoInfoPorId.get(fila.equipoId)?.logoUrl ?? null}
                    />
                  </td>
                  <td className="p-2 text-sm">{fila.partidosJugados}</td>
                  <td className="p-2 text-sm font-medium">{fila.puntos}</td>
                  <td className="p-2 text-sm">{fila.golesFavor}</td>
                  <td className="p-2 text-sm">{fila.golesContra}</td>
                  <td className="p-2 text-sm">{fila.diferenciaGoles}</td>
                  <td className="p-2 text-sm">{fila.tarjetasAmarillas}</td>
                  <td className="p-2 text-sm">{fila.tarjetasRojas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
