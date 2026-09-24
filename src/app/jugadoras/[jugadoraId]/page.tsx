import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { Avatar } from "@/components/ui/avatar";
import { BackButton } from "@/components/public/back-button";
import { BottomNav } from "@/components/public/bottom-nav";
import { FichaHero, FichaCuerpo, EtiquetaHero, DatoHero } from "@/components/public/ficha-layout";
import { formatearEtiquetaJornada } from "@/lib/jornada";

export default async function FichaJugadoraPage({
  params,
}: {
  params: Promise<{ jugadoraId: string }>;
}) {
  const { jugadoraId } = await params;
  const supabase = await createClient();

  const { data: jugadora, error: jugadoraError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta, equipo_id")
    .eq("id", jugadoraId)
    .maybeSingle();

  if (!jugadora && !jugadoraError) {
    notFound();
  }

  if (jugadoraError || !jugadora) {
    return (
      <div className="mx-auto flex w-full max-w-[1160px] flex-col px-4 pb-28">
        <div className="flex flex-col gap-6 p-6">
          <BackButton />
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
          >
            No se pudo cargar la información de la jugadora. Intenta de nuevo.
          </p>
        </div>
        <BottomNav torneoId={null} />
      </div>
    );
  }

  const [
    { data: equipo, error: equipoError },
    { data: companeras, error: companerasError },
    { data: alineaciones, error: alineacionesError },
  ] = await Promise.all([
    supabase
      .from("equipos")
      .select("id, nombre, logo_url, torneo_id")
      .eq("id", jugadora.equipo_id)
      .maybeSingle(),
    supabase.from("jugadoras").select("id").eq("equipo_id", jugadora.equipo_id),
    supabase.from("alineaciones").select("partido_id").eq("jugadora_id", jugadoraId),
  ]);

  const idsCompaneras = new Set((companeras ?? []).map((fila) => fila.id));
  const partidoIds = (alineaciones ?? []).map((fila) => fila.partido_id);

  const [
    { data: partidos, error: partidosError },
    { data: goles, error: golesError },
    { data: tarjetas, error: tarjetasError },
    { count: vecesMvp, error: mvpError },
  ] = await Promise.all([
    partidoIds.length > 0
      ? supabase
          .from("partidos")
          .select("id, jornada_id, equipo_local_id, equipo_visitante_id, fecha")
          .in("id", partidoIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            jornada_id: string;
            equipo_local_id: string;
            equipo_visitante_id: string;
            fecha: string | null;
          }[],
          error: null,
        }),
    partidoIds.length > 0
      ? supabase.from("goles").select("partido_id, jugadora_id").in("partido_id", partidoIds)
      : Promise.resolve({ data: [] as { partido_id: string; jugadora_id: string }[], error: null }),
    partidoIds.length > 0
      ? supabase.from("tarjetas").select("jugadora_id, tipo").in("partido_id", partidoIds)
      : Promise.resolve({ data: [] as { jugadora_id: string; tipo: string }[], error: null }),
    supabase
      .from("partidos")
      .select("id", { count: "exact", head: true })
      .eq("mvp_jugadora_id", jugadoraId),
  ]);

  const golesPorPartido = new Map<string, { propios: number; rivales: number }>();
  for (const partido of partidos ?? []) {
    golesPorPartido.set(partido.id, { propios: 0, rivales: 0 });
  }
  for (const gol of goles ?? []) {
    const entrada = golesPorPartido.get(gol.partido_id);
    if (!entrada) continue;
    if (idsCompaneras.has(gol.jugadora_id)) {
      entrada.propios += 1;
    } else {
      entrada.rivales += 1;
    }
  }

  let ganados = 0;
  let empatados = 0;
  let perdidos = 0;
  for (const { propios, rivales } of golesPorPartido.values()) {
    if (propios > rivales) ganados += 1;
    else if (propios < rivales) perdidos += 1;
    else empatados += 1;
  }

  const jornadaIdsDePartidos = [...new Set((partidos ?? []).map((partido) => partido.jornada_id))];
  const rivalIdPorPartido = new Map(
    (partidos ?? []).map((partido) => [
      partido.id,
      partido.equipo_local_id === jugadora.equipo_id
        ? partido.equipo_visitante_id
        : partido.equipo_local_id,
    ])
  );
  const rivalIds = [...new Set(rivalIdPorPartido.values())];

  const [
    { data: jornadasDePartidos, error: jornadasDePartidosError },
    { data: equiposRivales, error: equiposRivalesError },
  ] = await Promise.all([
    jornadaIdsDePartidos.length > 0
      ? supabase.from("jornadas").select("id, etiqueta, orden").in("id", jornadaIdsDePartidos)
      : Promise.resolve({ data: [] as { id: string; etiqueta: string; orden: number }[], error: null }),
    rivalIds.length > 0
      ? supabase.from("equipos").select("id, nombre").in("id", rivalIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[], error: null }),
  ]);

  const jornadaPorId = new Map((jornadasDePartidos ?? []).map((jornada) => [jornada.id, jornada]));
  const nombreRivalPorId = new Map((equiposRivales ?? []).map((equipo) => [equipo.id, equipo.nombre]));

  const misGolesPorPartido = new Map<string, number>();
  for (const gol of goles ?? []) {
    if (gol.jugadora_id !== jugadoraId) continue;
    misGolesPorPartido.set(gol.partido_id, (misGolesPorPartido.get(gol.partido_id) ?? 0) + 1);
  }

  const ultimosPartidos = (partidos ?? [])
    .map((partido) => ({
      partidoId: partido.id,
      jornada: jornadaPorId.get(partido.jornada_id),
      rivalNombre: nombreRivalPorId.get(rivalIdPorPartido.get(partido.id) ?? "") ?? "Rival",
      marcador: golesPorPartido.get(partido.id) ?? { propios: 0, rivales: 0 },
      misGoles: misGolesPorPartido.get(partido.id) ?? 0,
    }))
    .sort((a, b) => (b.jornada?.orden ?? 0) - (a.jornada?.orden ?? 0));

  const totalGoles = (goles ?? []).filter((gol) => gol.jugadora_id === jugadoraId).length;
  const totalAmarillas = (tarjetas ?? []).filter(
    (tarjeta) => tarjeta.jugadora_id === jugadoraId && tarjeta.tipo === "amarilla"
  ).length;
  const totalRojas = (tarjetas ?? []).filter(
    (tarjeta) => tarjeta.jugadora_id === jugadoraId && tarjeta.tipo === "roja"
  ).length;

  let contextoGoleo: string | null = null;
  let contextoGoleoError = false;
  if (equipo?.torneo_id && totalGoles > 0) {
    const { data: equiposTorneo, error: equiposTorneoError } = await supabase
      .from("equipos")
      .select("id")
      .eq("torneo_id", equipo.torneo_id);
    const equipoIdsTorneo = (equiposTorneo ?? []).map((fila) => fila.id);

    const { data: jugadorasTorneo, error: jugadorasTorneoError } =
      equipoIdsTorneo.length > 0
        ? await supabase.from("jugadoras").select("id").in("equipo_id", equipoIdsTorneo)
        : { data: [] as { id: string }[], error: null };
    const jugadoraIdsTorneo = (jugadorasTorneo ?? []).map((fila) => fila.id);

    const { data: golesTorneo, error: golesTorneoError } =
      jugadoraIdsTorneo.length > 0
        ? await supabase.from("goles").select("jugadora_id").in("jugadora_id", jugadoraIdsTorneo)
        : { data: [] as { jugadora_id: string }[], error: null };

    contextoGoleoError = Boolean(equiposTorneoError || jugadorasTorneoError || golesTorneoError);

    const golesPorJugadoraTorneo = new Map<string, number>();
    for (const gol of golesTorneo ?? []) {
      golesPorJugadoraTorneo.set(
        gol.jugadora_id,
        (golesPorJugadoraTorneo.get(gol.jugadora_id) ?? 0) + 1
      );
    }

    const maxGoles = Math.max(0, ...golesPorJugadoraTorneo.values());
    if (totalGoles >= maxGoles) {
      contextoGoleo = "Líder de goleo";
    } else {
      const diferencia = maxGoles - totalGoles;
      contextoGoleo = `A ${diferencia} gol${diferencia === 1 ? "" : "es"} de la líder`;
    }
  }

  const hayError = Boolean(
    equipoError ||
      companerasError ||
      alineacionesError ||
      partidosError ||
      golesError ||
      tarjetasError ||
      mvpError ||
      contextoGoleoError ||
      jornadasDePartidosError ||
      equiposRivalesError
  );

  return (
    <div className="flex w-full flex-col pb-28">
      {hayError ? (
        <FichaCuerpo className="flex flex-col gap-6">
          <BackButton />
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
          >
            No se pudo cargar la información de la jugadora. Intenta de nuevo.
          </p>
        </FichaCuerpo>
      ) : (
        <>
          <FichaHero>
            <BackButton amarillo />
            <div className="flex items-center gap-4 sm:gap-6">
              <Avatar
                src={jugadora.foto_url}
                nombre={jugadora.nombre}
                size={80}
                tono="vinoSolido"
              />
              <div className="flex min-w-0 flex-col gap-1.5">
                <EtiquetaHero>
                  Jugadora{jugadora.numero_camiseta != null ? ` · #${jugadora.numero_camiseta}` : ""}
                </EtiquetaHero>
                <h1 className="font-tit text-3xl uppercase leading-none sm:text-5xl">
                  {jugadora.nombre}
                </h1>
                {equipo && (
                  <span className="font-tit text-base uppercase tracking-wide">
                    <NombreEquipo
                      id={equipo.id}
                      nombre={equipo.nombre}
                      logoUrl={equipo.logo_url}
                      tono="vinoSolido"
                    />
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <DatoHero etiqueta="Jugados" valor={partidoIds.length} />
              <DatoHero etiqueta="G-E-P" valor={`${ganados}-${empatados}-${perdidos}`} />
              <DatoHero etiqueta="Goles" valor={totalGoles} />
              <DatoHero etiqueta="MVP" valor={vecesMvp ?? 0} />
            </div>
          </FichaHero>

          <FichaCuerpo className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <div className="flex flex-col gap-5">
              {contextoGoleo && (
                <p
                  className="rounded-sm border-l-4 border-azul px-4 py-3 font-tit text-sm uppercase tracking-wide text-vino"
                  style={{ background: "var(--amarillo-suave)" }}
                >
                  {contextoGoleo} · {totalGoles} gol{totalGoles === 1 ? "" : "es"} en el torneo
                </p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <span className="text-sm">
                  <span
                    className="mr-1.5 inline-block h-3.5 w-3 rounded-[2px] align-middle"
                    style={{ background: "var(--tarjeta-amarilla)" }}
                  />
                  {totalAmarillas} amarillas
                </span>
                <span className="text-sm">
                  <span
                    className="mr-1.5 inline-block h-3.5 w-3 rounded-[2px] align-middle"
                    style={{ background: "var(--tarjeta-roja)" }}
                  />
                  {totalRojas} rojas
                </span>
              </div>
            </div>

            {ultimosPartidos.length > 0 && (
              <section className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                  <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                    Últimos partidos
                  </h2>
                </div>
                <ul className="flex flex-col">
                  {ultimosPartidos.map((partido) => (
                    <li
                      key={partido.partidoId}
                      className="border-b border-linea-2 last:border-b-0"
                    >
                      <Link
                        href={`/partidos/${partido.partidoId}`}
                        className="flex items-center gap-3 py-3 text-sm hover:text-azul"
                      >
                        <span className="w-8 flex-none font-tit text-sm text-vino">
                          {partido.jornada ? formatearEtiquetaJornada(partido.jornada.etiqueta) : ""}
                        </span>
                        <span className="flex-1">vs {partido.rivalNombre}</span>
                        <span className="font-tit text-base">
                          {partido.marcador.propios}&ndash;{partido.marcador.rivales}
                        </span>
                        <span className="w-16 flex-none text-right font-mono text-xs text-tinta-2">
                          {partido.misGoles > 0
                            ? `${partido.misGoles} gol${partido.misGoles === 1 ? "" : "es"}`
                            : "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </FichaCuerpo>
        </>
      )}
      <BottomNav torneoId={equipo?.torneo_id ?? null} />
    </div>
  );
}
