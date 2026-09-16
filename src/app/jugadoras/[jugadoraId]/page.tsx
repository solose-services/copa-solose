import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { Avatar } from "@/components/ui/avatar";

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
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información de la jugadora. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, torneo_id")
    .eq("id", jugadora.equipo_id)
    .maybeSingle();

  const { data: companeras, error: companerasError } = await supabase
    .from("jugadoras")
    .select("id")
    .eq("equipo_id", jugadora.equipo_id);

  const idsCompaneras = new Set((companeras ?? []).map((fila) => fila.id));

  const { data: alineaciones, error: alineacionesError } = await supabase
    .from("alineaciones")
    .select("partido_id")
    .eq("jugadora_id", jugadoraId);

  const partidoIds = (alineaciones ?? []).map((fila) => fila.partido_id);

  const { data: partidos, error: partidosError } =
    partidoIds.length > 0
      ? await supabase.from("partidos").select("id").in("id", partidoIds)
      : { data: [] as { id: string }[], error: null };

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

  const { count: vecesMvp, error: mvpError } = await supabase
    .from("partidos")
    .select("id", { count: "exact", head: true })
    .eq("mvp_jugadora_id", jugadoraId);

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
      contextoGoleoError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {hayError ? (
        <div className="p-6">
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudo cargar la información de la jugadora. Intenta de nuevo.
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex items-center gap-4 px-6 py-8"
            style={{ background: "var(--tinta)", color: "var(--crema)" }}
          >
            <Avatar src={jugadora.foto_url} nombre={jugadora.nombre} size={56} />
            <div>
              <h1 className="font-tit text-xl uppercase tracking-tight">{jugadora.nombre}</h1>
              {equipo && (
                <NombreEquipo id={equipo.id} nombre={equipo.nombre} logoUrl={equipo.logo_url} />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6">
            {contextoGoleo && (
              <p
                className="rounded-sm border-l-2 border-azul px-3 py-2.5 text-sm"
                style={{ background: "rgba(27,63,209,.07)" }}
              >
                {contextoGoleo} · {totalGoles} gol{totalGoles === 1 ? "" : "es"} en el torneo
              </p>
            )}

            <dl className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Jugados
                </dt>
                <dd className="text-2xl font-semibold">{partidoIds.length}</dd>
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
                  Goles
                </dt>
                <dd className="text-2xl font-semibold">{totalGoles}</dd>
              </div>
              <div>
                <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  MVP
                </dt>
                <dd className="text-2xl font-semibold">{vecesMvp ?? 0}</dd>
              </div>
            </dl>
            <div className="flex gap-6">
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "#B26A12" }}
                />
                {totalAmarillas} amarillas
              </span>
              <span className="text-sm">
                <span
                  className="mr-1.5 inline-block h-3 w-2.5 rounded-[2px]"
                  style={{ background: "var(--vino)" }}
                />
                {totalRojas} rojas
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
