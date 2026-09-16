import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { contarMarcador } from "@/lib/marcador";
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
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar el detalle del partido. Intenta de nuevo.
        </p>
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
    .select("nombre, logo_url")
    .eq("id", partido.equipo_local_id)
    .maybeSingle();

  const { data: equipoVisitante, error: equipoVisitanteError } = await supabase
    .from("equipos")
    .select("nombre, logo_url")
    .eq("id", partido.equipo_visitante_id)
    .maybeSingle();

  const { data: jugadorasLocal, error: jugadorasLocalError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta")
    .eq("equipo_id", partido.equipo_local_id);

  const { data: jugadorasVisitante, error: jugadorasVisitanteError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta")
    .eq("equipo_id", partido.equipo_visitante_id);

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const jugadoraPorId = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      { nombre: jugadora.nombre, fotoUrl: jugadora.foto_url },
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

  const jugadorasQueJugaronLocal = (jugadorasLocal ?? [])
    .filter((jugadora) => (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id))
    .sort((a, b) => (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99));
  const jugadorasQueJugaronVisitante = (jugadorasVisitante ?? [])
    .filter((jugadora) => (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id))
    .sort((a, b) => (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99));

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {hayError ? (
        <div className="p-6">
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudo cargar el detalle del partido. Intenta de nuevo.
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex flex-col items-center gap-3 px-6 py-8"
            style={{ background: "var(--tinta)" }}
          >
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
              style={{ color: "rgba(244,237,224,.5)" }}
            >
              {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
            </p>
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
                    />
                    <span className="font-mono text-tinta-3">min. {gol.minuto}</span>
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
                    <NombreJugadora
                      id={tarjeta.jugadora_id}
                      nombre={jugadoraPorId.get(tarjeta.jugadora_id)?.nombre ?? "Jugadora"}
                      fotoUrl={jugadoraPorId.get(tarjeta.jugadora_id)?.fotoUrl ?? null}
                    />
                    <span className="font-mono text-tinta-3">
                      {tarjeta.tipo} — min. {tarjeta.minuto}
                    </span>
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
    </div>
  );
}
