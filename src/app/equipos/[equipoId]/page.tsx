import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { Avatar } from "@/components/ui/avatar";

export default async function FichaEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
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

  const hayError = Boolean(
    jugadorasError ||
      partidosLocalError ||
      partidosVisitanteError ||
      golesError ||
      tarjetasError
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar src={equipo.logo_url} nombre={equipo.nombre} size={64} />
        <h1 className="font-tit text-xl uppercase tracking-tight">{equipo.nombre}</h1>
      </div>

      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la información del equipo. Intenta de nuevo.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">PJ</dt>
              <dd className="text-lg font-semibold">{partidosJugados}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">PG</dt>
              <dd className="text-lg font-semibold">{ganados}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">PE</dt>
              <dd className="text-lg font-semibold">{empatados}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">PP</dt>
              <dd className="text-lg font-semibold">{perdidos}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">Pts</dt>
              <dd className="text-lg font-semibold">{puntos}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">GF</dt>
              <dd className="text-lg font-semibold">{golesFavor}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">GC</dt>
              <dd className="text-lg font-semibold">{golesContra}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">DG</dt>
              <dd className="text-lg font-semibold">{diferenciaGoles}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                TA / TR
              </dt>
              <dd className="text-lg font-semibold">
                {tarjetasAmarillas} / {tarjetasRojas}
              </dd>
            </div>
          </dl>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
              <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                Jugadoras
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
        </>
      )}
    </div>
  );
}
