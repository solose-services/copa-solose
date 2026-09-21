import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { calcularPosiciones, type PartidoParaPosiciones } from "@/lib/posiciones";
import { TablaPosiciones } from "@/components/public/tabla-posiciones";

export default async function PosicionesPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const [
    { data: equipos, error: equiposError },
    { data: grupos },
    { data: jornadas, error: jornadasError },
  ] = await Promise.all([
    supabase
      .from("equipos")
      .select("id, nombre, logo_url, orden_desempate_manual, grupo_id")
      .eq("torneo_id", torneoId)
      .order("nombre"),
    supabase.from("grupos").select("id, nombre").eq("torneo_id", torneoId).order("orden"),
    supabase.from("jornadas").select("id").eq("torneo_id", torneoId).eq("tipo", "regular"),
  ]);

  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);
  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
  const ordenDesempateManualPorEquipo = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, equipo.orden_desempate_manual])
  );
  const jornadaIds = (jornadas ?? []).map((jornada) => jornada.id);

  const [
    { data: jugadoras, error: jugadorasError },
    { data: partidosRaw, error: partidosError },
  ] = await Promise.all([
    equipoIds.length > 0
      ? supabase.from("jugadoras").select("id, equipo_id").in("equipo_id", equipoIds)
      : Promise.resolve({ data: [] as { id: string; equipo_id: string }[], error: null }),
    jornadaIds.length > 0
      ? supabase
          .from("partidos")
          .select("id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        }),
  ]);

  const idsPorEquipo = new Map<string, Set<string>>();
  for (const jugadora of jugadoras ?? []) {
    const set = idsPorEquipo.get(jugadora.equipo_id) ?? new Set<string>();
    set.add(jugadora.id);
    idsPorEquipo.set(jugadora.equipo_id, set);
  }

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const partidosJugados = (partidosRaw ?? []).filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIds = partidosJugados.map((partido) => partido.id);

  const [
    { data: goles, error: golesError },
    { data: tarjetas, error: tarjetasError },
  ] = await Promise.all([
    partidoIds.length > 0
      ? supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : Promise.resolve({ data: [] as { partido_id: string; jugadora_id: string }[], error: null }),
    partidoIds.length > 0
      ? supabase
          .from("tarjetas")
          .select("partido_id, jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : Promise.resolve({
          data: [] as { partido_id: string; jugadora_id: string; tipo: string }[],
          error: null,
        }),
  ]);

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

  const gruposList = grupos ?? [];
  const equipoIdsPorGrupo = new Map<string, string[]>();
  for (const grupo of gruposList) {
    equipoIdsPorGrupo.set(
      grupo.id,
      (equipos ?? []).filter((equipo) => equipo.grupo_id === grupo.id).map((equipo) => equipo.id)
    );
  }
  const equipoIdsSinGrupo = (equipos ?? [])
    .filter((equipo) => !equipo.grupo_id)
    .map((equipo) => equipo.id);

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
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar las posiciones. Intenta de nuevo.
        </p>
      ) : gruposList.length > 0 ? (
        <>
          {gruposList.map((grupo) => {
            const idsDelGrupo = equipoIdsPorGrupo.get(grupo.id) ?? [];
            if (idsDelGrupo.length === 0) return null;
            const tablaGrupo = calcularPosiciones(
              idsDelGrupo,
              partidosParaCalculo,
              ordenDesempateManualPorEquipo
            );
            return (
              <TablaPosiciones
                key={grupo.id}
                titulo={grupo.nombre}
                tabla={tablaGrupo}
                equipoInfoPorId={equipoInfoPorId}
              />
            );
          })}
          {equipoIdsSinGrupo.length > 0 && (
            <TablaPosiciones
              titulo="Sin grupo"
              tabla={calcularPosiciones(
                equipoIdsSinGrupo,
                partidosParaCalculo,
                ordenDesempateManualPorEquipo
              )}
              equipoInfoPorId={equipoInfoPorId}
            />
          )}
          <div
            className="flex items-center gap-3 rounded-md border-l-4 border-azul px-4 py-3"
            style={{ background: "color-mix(in srgb, var(--azul) 8%, var(--papel))" }}
          >
            <Trophy size={18} strokeWidth={1.7} className="flex-none text-azul" />
            <p className="font-tit text-sm uppercase tracking-wide text-azul">
              Los primeros de cada grupo pasan a semifinales
            </p>
          </div>
        </>
      ) : (
        <>
          <TablaPosiciones tabla={tabla} equipoInfoPorId={equipoInfoPorId} />
          <div
            className="flex items-center gap-3 rounded-md border-l-4 border-azul px-4 py-3"
            style={{ background: "color-mix(in srgb, var(--azul) 8%, var(--papel))" }}
          >
            <Trophy size={18} strokeWidth={1.7} className="flex-none text-azul" />
            <p className="font-tit text-sm uppercase tracking-wide text-azul">
              Los cuatro primeros pasan a semifinales
            </p>
          </div>
        </>
      )}
    </div>
  );
}
