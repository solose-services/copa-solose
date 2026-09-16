import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { Avatar } from "@/components/ui/avatar";
import { calcularPosiciones, type PartidoParaPosiciones } from "@/lib/posiciones";

export default async function FichaEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, torneo_id, orden_desempate_manual")
    .eq("id", equipoId)
    .maybeSingle();

  if (!equipo && !equipoError) {
    notFound();
  }

  if (equipoError || !equipo) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información del equipo. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const { data: torneo, error: torneoError } = await supabase
    .from("torneos")
    .select("categoria")
    .eq("id", equipo.torneo_id)
    .maybeSingle();

  const { data: jugadoras, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta")
    .eq("equipo_id", equipoId)
    .order("nombre");

  const idsPropias = new Set((jugadoras ?? []).map((jugadora) => jugadora.id));

  const { data: partidosLocal, error: partidosLocalError } = await supabase
    .from("partidos")
    .select("id, fecha")
    .eq("equipo_local_id", equipoId);

  const { data: partidosVisitante, error: partidosVisitanteError } = await supabase
    .from("partidos")
    .select("id, fecha")
    .eq("equipo_visitante_id", equipoId);

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date()
  );
  const partidos = [...(partidosLocal ?? []), ...(partidosVisitante ?? [])].filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIds = partidos.map((partido) => partido.id);

  const { data: goles, error: golesError } =
    partidoIds.length > 0
      ? await supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetas, error: tarjetasError } =
    partidoIds.length > 0
      ? await supabase
          .from("tarjetas")
          .select("jugadora_id, tipo")
          .in("partido_id", partidoIds)
      : { data: [] as { jugadora_id: string; tipo: string }[], error: null };

  const golesPorPartido = new Map<string, { propios: number; rivales: number }>();
  for (const partido of partidos) {
    golesPorPartido.set(partido.id, { propios: 0, rivales: 0 });
  }
  for (const gol of goles ?? []) {
    const entrada = golesPorPartido.get(gol.partido_id);
    if (!entrada) continue;
    if (idsPropias.has(gol.jugadora_id)) {
      entrada.propios += 1;
    } else {
      entrada.rivales += 1;
    }
  }

  let ganados = 0;
  let empatados = 0;
  let perdidos = 0;
  let golesFavor = 0;
  let golesContra = 0;
  for (const { propios, rivales } of golesPorPartido.values()) {
    golesFavor += propios;
    golesContra += rivales;
    if (propios > rivales) ganados += 1;
    else if (propios < rivales) perdidos += 1;
    else empatados += 1;
  }

  let tarjetasAmarillas = 0;
  let tarjetasRojas = 0;
  for (const tarjeta of tarjetas ?? []) {
    if (!idsPropias.has(tarjeta.jugadora_id)) continue;
    if (tarjeta.tipo === "amarilla") tarjetasAmarillas += 1;
    else if (tarjeta.tipo === "roja") tarjetasRojas += 1;
  }

  const partidosJugados = partidos.length;
  const puntos = ganados * 3 + empatados;
  const diferenciaGoles = golesFavor - golesContra;

  const { data: equiposTorneo, error: equiposTorneoError } = await supabase
    .from("equipos")
    .select("id, orden_desempate_manual")
    .eq("torneo_id", equipo.torneo_id);

  const equipoIdsTorneo = (equiposTorneo ?? []).map((fila) => fila.id);
  const ordenDesempateManualPorEquipo = new Map(
    (equiposTorneo ?? []).map((fila) => [fila.id, fila.orden_desempate_manual])
  );

  const { data: jugadorasTorneo, error: jugadorasTorneoError } =
    equipoIdsTorneo.length > 0
      ? await supabase.from("jugadoras").select("id, equipo_id").in("equipo_id", equipoIdsTorneo)
      : { data: [] as { id: string; equipo_id: string }[], error: null };

  const idsPorEquipoTorneo = new Map<string, Set<string>>();
  for (const jugadora of jugadorasTorneo ?? []) {
    const set = idsPorEquipoTorneo.get(jugadora.equipo_id) ?? new Set<string>();
    set.add(jugadora.id);
    idsPorEquipoTorneo.set(jugadora.equipo_id, set);
  }

  const { data: jornadasRegulares, error: jornadasRegularesError } = await supabase
    .from("jornadas")
    .select("id")
    .eq("torneo_id", equipo.torneo_id)
    .eq("tipo", "regular");

  const jornadaIdsRegulares = (jornadasRegulares ?? []).map((jornada) => jornada.id);

  const { data: partidosTorneo, error: partidosTorneoError } =
    jornadaIdsRegulares.length > 0
      ? await supabase
          .from("partidos")
          .select("id, equipo_local_id, equipo_visitante_id, fecha")
          .in("jornada_id", jornadaIdsRegulares)
      : {
          data: [] as {
            id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        };

  const partidosTorneoJugados = (partidosTorneo ?? []).filter(
    (partido) => partido.fecha && partido.fecha <= hoy
  );
  const partidoIdsTorneo = partidosTorneoJugados.map((partido) => partido.id);

  const { data: golesTorneo, error: golesTorneoError } =
    partidoIdsTorneo.length > 0
      ? await supabase
          .from("goles")
          .select("partido_id, jugadora_id")
          .in("partido_id", partidoIdsTorneo)
      : { data: [] as { partido_id: string; jugadora_id: string }[], error: null };

  const { data: tarjetasTorneo, error: tarjetasTorneoError } =
    partidoIdsTorneo.length > 0
      ? await supabase
          .from("tarjetas")
          .select("partido_id, jugadora_id, tipo")
          .in("partido_id", partidoIdsTorneo)
      : { data: [] as { partido_id: string; jugadora_id: string; tipo: string }[], error: null };

  const partidosParaCalculo: PartidoParaPosiciones[] = partidosTorneoJugados.map((partido) => {
    const idsLocalT = idsPorEquipoTorneo.get(partido.equipo_local_id) ?? new Set<string>();
    const idsVisitanteT = idsPorEquipoTorneo.get(partido.equipo_visitante_id) ?? new Set<string>();

    let golesLocalCalc = 0;
    let golesVisitanteCalc = 0;
    for (const gol of golesTorneo ?? []) {
      if (gol.partido_id !== partido.id) continue;
      if (idsLocalT.has(gol.jugadora_id)) golesLocalCalc += 1;
      else if (idsVisitanteT.has(gol.jugadora_id)) golesVisitanteCalc += 1;
    }

    let tarjetasAmarillasLocal = 0;
    let tarjetasRojasLocal = 0;
    let tarjetasAmarillasVisitante = 0;
    let tarjetasRojasVisitante = 0;
    for (const tarjeta of tarjetasTorneo ?? []) {
      if (tarjeta.partido_id !== partido.id) continue;
      const esLocal = idsLocalT.has(tarjeta.jugadora_id);
      const esVisitante = idsVisitanteT.has(tarjeta.jugadora_id);
      if (esLocal && tarjeta.tipo === "amarilla") tarjetasAmarillasLocal += 1;
      else if (esLocal && tarjeta.tipo === "roja") tarjetasRojasLocal += 1;
      else if (esVisitante && tarjeta.tipo === "amarilla") tarjetasAmarillasVisitante += 1;
      else if (esVisitante && tarjeta.tipo === "roja") tarjetasRojasVisitante += 1;
    }

    return {
      equipoLocalId: partido.equipo_local_id,
      equipoVisitanteId: partido.equipo_visitante_id,
      golesLocal: golesLocalCalc,
      golesVisitante: golesVisitanteCalc,
      tarjetasAmarillasLocal,
      tarjetasRojasLocal,
      tarjetasAmarillasVisitante,
      tarjetasRojasVisitante,
    };
  });

  const tablaTorneo = calcularPosiciones(
    equipoIdsTorneo,
    partidosParaCalculo,
    ordenDesempateManualPorEquipo
  );
  const posicion = tablaTorneo.findIndex((fila) => fila.equipoId === equipoId) + 1;

  const hayError = Boolean(
    torneoError ||
      jugadorasError ||
      partidosLocalError ||
      partidosVisitanteError ||
      golesError ||
      tarjetasError ||
      equiposTorneoError ||
      jugadorasTorneoError ||
      jornadasRegularesError ||
      partidosTorneoError ||
      golesTorneoError ||
      tarjetasTorneoError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {hayError ? (
        <div className="p-6">
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudo cargar la información del equipo. Intenta de nuevo.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 px-6 py-8" style={{ background: "var(--tinta)" }}>
            <Avatar src={equipo.logo_url} nombre={equipo.nombre} size={56} />
            <div>
              <h1
                className="font-tit text-xl uppercase tracking-tight"
                style={{ color: "var(--crema)" }}
              >
                {equipo.nombre}
              </h1>
              {posicion > 0 && (
                <p
                  className="font-mono text-[.62rem] uppercase tracking-wider"
                  style={{ color: "rgba(244,237,224,.6)" }}
                >
                  {posicion}° lugar{torneo?.categoria ? ` · ${torneo.categoria}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <dl className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Puntos
                </dt>
                <dd className="text-2xl font-semibold">{puntos}</dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Jugados
                </dt>
                <dd className="text-2xl font-semibold">{partidosJugados}</dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  G-E-P
                </dt>
                <dd className="text-2xl font-semibold">
                  {ganados}-{empatados}-{perdidos}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Dif.
                </dt>
                <dd className="text-2xl font-semibold">
                  {diferenciaGoles > 0 ? `+${diferenciaGoles}` : diferenciaGoles}
                </dd>
              </div>
            </dl>
            <div className="flex gap-6">
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "#B26A12" }}
                />
                {tarjetasAmarillas} amarillas
              </span>
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "var(--vino)" }}
                />
                {tarjetasRojas} rojas
              </span>
            </div>

            <section className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Jugadoras registradas · {jugadoras?.length ?? 0}
                </h2>
              </div>
              <ul className="mt-1 flex flex-col gap-1.5">
                {(jugadoras ?? []).map((jugadora) => (
                  <li key={jugadora.id} className="flex items-center gap-2 text-sm">
                    <NombreJugadora
                      id={jugadora.id}
                      nombre={jugadora.nombre}
                      fotoUrl={jugadora.foto_url}
                    />
                    {jugadora.numero_camiseta != null && (
                      <span className="font-mono text-tinta-3">#{jugadora.numero_camiseta}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
