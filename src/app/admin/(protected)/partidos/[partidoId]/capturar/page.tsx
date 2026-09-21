import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlineacionForm } from "./alineacion-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { GolForm } from "./gol-form";
import { eliminarGol } from "./actions";
import { TarjetaForm } from "./tarjeta-form";
import { eliminarTarjeta } from "./actions";
import { MvpForm } from "./mvp-form";
import { IncidenciasForm } from "./incidencias-form";
import { FechaHoraForm } from "./fecha-hora-form";

export default async function CapturarPartidoPage({
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
      <div className="flex flex-col gap-4">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudo cargar el partido. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const { data: jornada } = await supabase
    .from("jornadas")
    .select("torneo_id, etiqueta")
    .eq("id", partido.jornada_id)
    .maybeSingle();

  const { data: equipoLocal } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_local_id)
    .maybeSingle();

  const { data: equipoVisitante } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", partido.equipo_visitante_id)
    .maybeSingle();

  const {
    data: jugadorasLocal,
    error: jugadorasLocalError,
  } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_local_id)
    .order("nombre");

  const {
    data: jugadorasVisitante,
    error: jugadorasVisitanteError,
  } = await supabase
    .from("jugadoras")
    .select("id, nombre")
    .eq("equipo_id", partido.equipo_visitante_id)
    .order("nombre");

  const { data: alineaciones, error: alineacionesError } = await supabase
    .from("alineaciones")
    .select("jugadora_id")
    .eq("partido_id", partidoId);

  const hayErrorAlineacion = Boolean(
    jugadorasLocalError || jugadorasVisitanteError || alineacionesError
  );

  const { data: golesDetalle, error: golesError } = await supabase
    .from("goles")
    .select("id, jugadora_id, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const { data: tarjetasDetalle, error: tarjetasError } = await supabase
    .from("tarjetas")
    .select("id, jugadora_id, tipo, minuto")
    .eq("partido_id", partidoId)
    .order("minuto");

  const jugadorasQueJugaron = [
    ...(jugadorasLocal ?? []).filter((jugadora) =>
      (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
    ),
    ...(jugadorasVisitante ?? []).filter((jugadora) =>
      (alineaciones ?? []).some((fila) => fila.jugadora_id === jugadora.id)
    ),
  ];

  const nombrePorJugadora = new Map(
    [...(jugadorasLocal ?? []), ...(jugadorasVisitante ?? [])].map((jugadora) => [
      jugadora.id,
      jugadora.nombre,
    ])
  );

  const mvpEnLista = jugadorasQueJugaron.some((j) => j.id === partido.mvp_jugadora_id);
  const opcionesMvp =
    partido.mvp_jugadora_id && !mvpEnLista
      ? [
          ...jugadorasQueJugaron,
          {
            id: partido.mvp_jugadora_id,
            nombre: nombrePorJugadora.get(partido.mvp_jugadora_id) ?? "Jugadora",
          },
        ]
      : jugadorasQueJugaron;

  const idsLocal = new Set((jugadorasLocal ?? []).map((jugadora) => jugadora.id));
  const idsVisitante = new Set((jugadorasVisitante ?? []).map((jugadora) => jugadora.id));
  const golesLocal = (golesDetalle ?? []).filter((gol) => idsLocal.has(gol.jugadora_id)).length;
  const golesVisitante = (golesDetalle ?? []).filter((gol) =>
    idsVisitante.has(gol.jugadora_id)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={
          jornada?.torneo_id
            ? `/admin/torneos/${jornada.torneo_id}/jornadas/${partido.jornada_id}/partidos`
            : "/admin/torneos"
        }
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Partidos
      </Link>
      <h1 className="font-tit text-xl uppercase tracking-tight">
        {equipoLocal?.nombre ?? "Local"}{" "}
        <span className="font-mono">{golesLocal} — {golesVisitante}</span>{" "}
        {equipoVisitante?.nombre ?? "Visitante"}
      </h1>
      <p className="font-mono text-[.68rem] uppercase tracking-wider text-tinta-2">
        {jornada?.etiqueta ?? "Jornada"} · {partido.fecha ?? "Sin fecha"}
        {partido.hora ? ` · ${partido.hora.slice(0, 5)}` : ""}
      </p>
      <FechaHoraForm partidoId={partidoId} fechaActual={partido.fecha} horaActual={partido.hora} />
      {hayErrorAlineacion ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudo cargar la información de la alineación. Intenta de nuevo.
        </p>
      ) : (
        <AlineacionForm
          partidoId={partidoId}
          equipoLocalId={partido.equipo_local_id}
          equipoVisitanteId={partido.equipo_visitante_id}
          nombreLocal={equipoLocal?.nombre ?? "Local"}
          nombreVisitante={equipoVisitante?.nombre ?? "Visitante"}
          jugadorasLocal={jugadorasLocal ?? []}
          jugadorasVisitante={jugadorasVisitante ?? []}
          seleccionadasIniciales={(alineaciones ?? []).map((fila) => fila.jugadora_id)}
        />
      )}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Goles</h2>
        </div>
        <GolForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {golesError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
          >
            No se pudieron cargar los goles. Intenta de nuevo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(golesDetalle ?? []).map((gol) => (
              <li key={gol.id} className="flex items-center gap-3 text-sm">
                <span>
                  {nombrePorJugadora.get(gol.jugadora_id) ?? "Jugadora"}{" "}
                  <span className="font-mono text-tinta-2">min. {gol.minuto}</span>
                </span>
                <DeleteButton
                  onDelete={eliminarGol.bind(null, gol.id, partidoId)}
                  confirmMessage="¿Eliminar este gol? Esto no se puede deshacer."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
            Tarjetas
          </h2>
        </div>
        <TarjetaForm partidoId={partidoId} jugadorasQueJugaron={jugadorasQueJugaron} />
        {tarjetasError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
          >
            No se pudieron cargar las tarjetas. Intenta de nuevo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(tarjetasDetalle ?? []).map((tarjeta) => (
              <li key={tarjeta.id} className="flex items-center gap-3 text-sm">
                <span>
                  {nombrePorJugadora.get(tarjeta.jugadora_id) ?? "Jugadora"}{" "}
                  <span className="font-mono text-tinta-2">
                    {tarjeta.tipo} — min. {tarjeta.minuto}
                  </span>
                </span>
                <DeleteButton
                  onDelete={eliminarTarjeta.bind(null, tarjeta.id, partidoId)}
                  confirmMessage="¿Eliminar esta tarjeta? Esto no se puede deshacer."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <MvpForm
        partidoId={partidoId}
        jugadorasQueJugaron={opcionesMvp}
        mvpActual={partido.mvp_jugadora_id}
      />
      <IncidenciasForm partidoId={partidoId} incidenciasActuales={partido.incidencias} />
    </div>
  );
}
