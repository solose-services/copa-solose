import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { BackButton } from "@/components/public/back-button";
import { BottomNav } from "@/components/public/bottom-nav";
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
      <div className="mx-auto flex max-w-2xl flex-col pb-24">
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col pb-24">
      {hayError ? (
        <div className="flex flex-col gap-6 p-6">
          <BackButton />
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
          >
            No se pudo cargar el detalle del partido. Intenta de nuevo.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-6 py-8" style={{ background: "var(--vino)" }}>
            <BackButton oscuro />
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-6">
                <CajaEquipo
                  nombre={equipoLocal?.nombre ?? "Local"}
                  logoUrl={equipoLocal?.logo_url ?? null}
                />
                <span className="font-tit text-4xl font-semibold" style={{ color: "var(--azul)" }}>
                  {golesLocal}&ndash;{golesVisitante}
                </span>
                <CajaEquipo
                  nombre={equipoVisitante?.nombre ?? "Visitante"}
                  logoUrl={equipoVisitante?.logo_url ?? null}
                />
              </div>
              <p
                className="font-mono text-[.62rem] uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,.5)" }}
              >
                {jornada ? formatearEtiquetaJornada(jornada.etiqueta) : "Jornada"} ·{" "}
                {partido.fecha ?? "Sin fecha"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <section>
              <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Alineaciones
                </h2>
              </div>
              <div className="mt-3 flex flex-wrap gap-8">
                <ul className="flex flex-col gap-1.5">
                  {jugadorasQueJugaronLocal.map((jugadora) => (
                    <li key={jugadora.id} className="flex items-center gap-2">
                      {jugadora.numero_camiseta != null && (
                        <span className="w-5 text-right font-mono text-xs text-tinta-2">
                          {jugadora.numero_camiseta}
                        </span>
                      )}
                      <NombreJugadora
                        id={jugadora.id}
                        nombre={jugadora.nombre}
                        fotoUrl={jugadora.foto_url}
                        tono="vino"
                      />
                    </li>
                  ))}
                </ul>
                <ul className="flex flex-col gap-1.5">
                  {jugadorasQueJugaronVisitante.map((jugadora) => (
                    <li key={jugadora.id} className="flex items-center gap-2">
                      {jugadora.numero_camiseta != null && (
                        <span className="w-5 text-right font-mono text-xs text-tinta-2">
                          {jugadora.numero_camiseta}
                        </span>
                      )}
                      <NombreJugadora
                        id={jugadora.id}
                        nombre={jugadora.nombre}
                        fotoUrl={jugadora.foto_url}
                        tono="vino"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                  Goles
                </h2>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {(goles ?? []).map((gol, indice) => (
                  <li key={indice} className="flex items-center gap-2 text-sm">
                    <NombreJugadora
                      id={gol.jugadora_id}
                      nombre={jugadoraPorId.get(gol.jugadora_id)?.nombre ?? "Jugadora"}
                      fotoUrl={jugadoraPorId.get(gol.jugadora_id)?.fotoUrl ?? null}
                      tono="vino"
                    />
                    <span className="font-mono text-[.68rem] text-tinta-3">
                      {nombreEquipoDeJugadora(gol.jugadora_id)}
                    </span>
                    <span className="ml-auto font-mono text-tinta-2">{gol.minuto}&apos;</span>
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
              <ul className="mt-3 flex flex-col gap-1.5">
                {(tarjetas ?? []).map((tarjeta, indice) => (
                  <li key={indice} className="flex items-center gap-2 text-sm">
                    <span
                      aria-label={tarjeta.tipo}
                      className="inline-block h-3 w-2.5 flex-none rounded-[2px]"
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
                      {nombreEquipoDeJugadora(tarjeta.jugadora_id)}
                    </span>
                    <span className="ml-auto font-mono text-tinta-2">{tarjeta.minuto}&apos;</span>
                  </li>
                ))}
              </ul>
            </section>

            {partido.mvp_jugadora_id && (
              <section
                className="flex flex-col gap-1 rounded-md border border-linea p-3"
                style={{ background: "var(--papel)" }}
              >
                <span className="font-mono text-[.6rem] uppercase tracking-wider text-tinta-2">
                  Jugadora del partido
                </span>
                <NombreJugadora
                  id={partido.mvp_jugadora_id}
                  nombre={jugadoraPorId.get(partido.mvp_jugadora_id)?.nombre ?? "Jugadora"}
                  fotoUrl={jugadoraPorId.get(partido.mvp_jugadora_id)?.fotoUrl ?? null}
                  tono="vino"
                />
              </section>
            )}

            {partido.incidencias && (
              <section>
                <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
                  <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                    Incidencias
                  </h2>
                </div>
                <p className="mt-3 text-sm">{partido.incidencias}</p>
              </section>
            )}
          </div>
        </>
      )}
      <BottomNav torneoId={jornada?.torneo_id ?? null} />
    </div>
  );
}
