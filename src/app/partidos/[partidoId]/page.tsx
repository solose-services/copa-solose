import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { BackButton } from "@/components/public/back-button";
import { BottomNav } from "@/components/public/bottom-nav";
import { FichaHero, FichaCuerpo, EtiquetaHero } from "@/components/public/ficha-layout";
import { formatearFechaCorta, formatearHora } from "@/lib/fecha";
import { contarMarcador } from "@/lib/marcador";
import { formatearEtiquetaJornada } from "@/lib/jornada";
import { CajaEquipo } from "./caja-equipo";

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
      <div className="mx-auto flex w-full max-w-[1160px] flex-col px-4 pb-28">
        <div className="flex flex-col gap-6 p-6">
          <BackButton />
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
          >
            No se pudo cargar el detalle del partido. Intenta de nuevo.
          </p>
        </div>
        <BottomNav torneoId={null} />
      </div>
    );
  }

  const [
    { data: jornada, error: jornadaError },
    { data: equipoLocal, error: equipoLocalError },
    { data: equipoVisitante, error: equipoVisitanteError },
    { data: jugadorasLocal, error: jugadorasLocalError },
    { data: jugadorasVisitante, error: jugadorasVisitanteError },
    { data: alineaciones, error: alineacionesError },
    { data: goles, error: golesError },
    { data: tarjetas, error: tarjetasError },
  ] = await Promise.all([
    supabase
      .from("jornadas")
      .select("etiqueta, torneo_id")
      .eq("id", partido.jornada_id)
      .maybeSingle(),
    supabase
      .from("equipos")
      .select("nombre, logo_url")
      .eq("id", partido.equipo_local_id)
      .maybeSingle(),
    supabase
      .from("equipos")
      .select("nombre, logo_url")
      .eq("id", partido.equipo_visitante_id)
      .maybeSingle(),
    supabase
      .from("jugadoras")
      .select("id, nombre, foto_url, numero_camiseta")
      .eq("equipo_id", partido.equipo_local_id),
    supabase
      .from("jugadoras")
      .select("id, nombre, foto_url, numero_camiseta")
      .eq("equipo_id", partido.equipo_visitante_id),
    supabase.from("alineaciones").select("jugadora_id").eq("partido_id", partidoId),
    supabase
      .from("goles")
      .select("jugadora_id, minuto")
      .eq("partido_id", partidoId)
      .order("minuto"),
    supabase
      .from("tarjetas")
      .select("jugadora_id, tipo, minuto")
      .eq("partido_id", partidoId)
      .order("minuto"),
  ]);

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const jugadoraPorId = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      { nombre: jugadora.nombre, fotoUrl: jugadora.foto_url },
    ])
  );

  const equipoLocalId = partido.equipo_local_id;
  const equipoVisitanteId = partido.equipo_visitante_id;

  function equipoIdDeJugadora(jugadoraId: string): string {
    return idsVisitante.has(jugadoraId) ? equipoVisitanteId : equipoLocalId;
  }

  function nombreEquipoDeJugadora(jugadoraId: string): string {
    if (idsLocal.has(jugadoraId)) return equipoLocal?.nombre ?? "Local";
    if (idsVisitante.has(jugadoraId)) return equipoVisitante?.nombre ?? "Visitante";
    return "Equipo";
  }

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

  const jugadorasQueJugaronLocal = (jugadorasLocal ?? [])
    .filter((jugadora) => (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id))
    .sort((a, b) => (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99));
  const jugadorasQueJugaronVisitante = (jugadorasVisitante ?? [])
    .filter((jugadora) => (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id))
    .sort((a, b) => (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99));

  const fechaTexto = [
    jornada ? formatearEtiquetaJornada(jornada.etiqueta) : "Jornada",
    partido.fecha ? formatearFechaCorta(partido.fecha) : "Sin fecha",
    partido.hora ? formatearHora(partido.hora) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const filaJugadora = (jugadora: (typeof jugadorasQueJugaronLocal)[number]) => (
    <li key={jugadora.id} className="flex items-center gap-2">
      <span className="w-6 text-right font-tit text-sm text-vino">
        {jugadora.numero_camiseta ?? ""}
      </span>
      <NombreJugadora
        id={jugadora.id}
        nombre={jugadora.nombre}
        fotoUrl={jugadora.foto_url}
        tono="vino"
      />
    </li>
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
            No se pudo cargar el detalle del partido. Intenta de nuevo.
          </p>
        </FichaCuerpo>
      ) : (
        <>
          <FichaHero>
            <BackButton amarillo />
            <div className="flex flex-col items-center gap-5">
              <EtiquetaHero>{fechaTexto}</EtiquetaHero>
              <div className="grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-10">
                <CajaEquipo
                  equipoId={partido.equipo_local_id}
                  nombre={equipoLocal?.nombre ?? "Local"}
                  logoUrl={equipoLocal?.logo_url ?? null}
                />
                <span className="font-tit text-5xl leading-none text-azul sm:text-7xl">
                  {golesLocal}&ndash;{golesVisitante}
                </span>
                <CajaEquipo
                  equipoId={partido.equipo_visitante_id}
                  nombre={equipoVisitante?.nombre ?? "Visitante"}
                  logoUrl={equipoVisitante?.logo_url ?? null}
                />
              </div>
            </div>
          </FichaHero>

          <FichaCuerpo className="grid items-start gap-8 lg:grid-cols-2">
            <section>
              <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Alineaciones
                </h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Link href={`/equipos/${partido.equipo_local_id}`} className="w-fit hover:opacity-70">
                    <EtiquetaHero>{equipoLocal?.nombre ?? "Local"}</EtiquetaHero>
                  </Link>
                  <ul className="flex flex-col gap-2">
                    {jugadorasQueJugaronLocal.map(filaJugadora)}
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href={`/equipos/${partido.equipo_visitante_id}`} className="w-fit hover:opacity-70">
                    <EtiquetaHero>{equipoVisitante?.nombre ?? "Visitante"}</EtiquetaHero>
                  </Link>
                  <ul className="flex flex-col gap-2">
                    {jugadorasQueJugaronVisitante.map(filaJugadora)}
                  </ul>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-8">
              <section>
                <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                  <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                    Goles
                  </h2>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {(goles ?? []).map((gol, indice) => (
                    <li key={indice} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <NombreJugadora
                        id={gol.jugadora_id}
                        nombre={jugadoraPorId.get(gol.jugadora_id)?.nombre ?? "Jugadora"}
                        fotoUrl={jugadoraPorId.get(gol.jugadora_id)?.fotoUrl ?? null}
                        tono="vino"
                      />
                      <span className="font-mono text-[.68rem] text-tinta-3">
                        <Link href={`/equipos/${equipoIdDeJugadora(gol.jugadora_id)}`} className="hover:text-azul">
                          {nombreEquipoDeJugadora(gol.jugadora_id)}
                        </Link>
                      </span>
                      <span className="ml-auto font-tit text-vino">{gol.minuto}&apos;</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                  <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                    Tarjetas
                  </h2>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {(tarjetas ?? []).map((tarjeta, indice) => (
                    <li key={indice} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <span
                        aria-label={tarjeta.tipo}
                        className="inline-block h-3.5 w-3 flex-none rounded-[2px]"
                        style={{
                          background:
                            tarjeta.tipo === "roja"
                              ? "var(--tarjeta-roja)"
                              : "var(--tarjeta-amarilla)",
                        }}
                      />
                      <NombreJugadora
                        id={tarjeta.jugadora_id}
                        nombre={jugadoraPorId.get(tarjeta.jugadora_id)?.nombre ?? "Jugadora"}
                        fotoUrl={jugadoraPorId.get(tarjeta.jugadora_id)?.fotoUrl ?? null}
                        tono="vino"
                      />
                      <span className="font-mono text-[.68rem] text-tinta-3">
                        <Link href={`/equipos/${equipoIdDeJugadora(tarjeta.jugadora_id)}`} className="hover:text-azul">
                          {nombreEquipoDeJugadora(tarjeta.jugadora_id)}
                        </Link>
                      </span>
                      <span className="ml-auto font-tit text-vino">{tarjeta.minuto}&apos;</span>
                    </li>
                  ))}
                </ul>
              </section>

              {partido.mvp_jugadora_id && (
                <section
                  className="flex flex-col gap-1.5 rounded-md border-l-4 border-azul p-4"
                  style={{ background: "var(--amarillo-suave)" }}
                >
                  <EtiquetaHero>Jugadora del partido</EtiquetaHero>
                  <span className="font-tit text-lg text-vino">
                    <NombreJugadora
                      id={partido.mvp_jugadora_id}
                      nombre={jugadoraPorId.get(partido.mvp_jugadora_id)?.nombre ?? "Jugadora"}
                      fotoUrl={jugadoraPorId.get(partido.mvp_jugadora_id)?.fotoUrl ?? null}
                      tono="vino"
                    />
                  </span>
                </section>
              )}
            </div>

            {partido.incidencias && (
              <section className="lg:col-span-2">
                <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                  <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                    Incidencias
                  </h2>
                </div>
                <p className="mt-3 text-sm">{partido.incidencias}</p>
              </section>
            )}
          </FichaCuerpo>
        </>
      )}
      <BottomNav torneoId={jornada?.torneo_id ?? null} />
    </div>
  );
}
