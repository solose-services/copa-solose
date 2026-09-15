import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { NombreEquipo } from "@/components/public/nombre-equipo";

export default async function GoleadorasPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId);

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );
  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, foto_url, equipo_id")
          .in("equipo_id", equipoIds)
          .order("nombre")
      : {
          data: [] as { id: string; nombre: string; foto_url: string | null; equipo_id: string }[],
          error: null,
        };

  const jugadoraIds = (jugadoras ?? []).map((jugadora) => jugadora.id);

  const { data: goles, error: golesError } =
    jugadoraIds.length > 0
      ? await supabase.from("goles").select("jugadora_id").in("jugadora_id", jugadoraIds)
      : { data: [] as { jugadora_id: string }[], error: null };

  const golesPorJugadora = new Map<string, number>();
  for (const gol of goles ?? []) {
    golesPorJugadora.set(gol.jugadora_id, (golesPorJugadora.get(gol.jugadora_id) ?? 0) + 1);
  }

  const tabla = (jugadoras ?? [])
    .map((jugadora) => ({
      id: jugadora.id,
      nombre: jugadora.nombre,
      fotoUrl: jugadora.foto_url,
      equipoId: jugadora.equipo_id,
      goles: golesPorJugadora.get(jugadora.id) ?? 0,
    }))
    .filter((fila) => fila.goles > 0)
    .sort((a, b) => b.goles - a.goles || a.nombre.localeCompare(b.nombre));

  const hayError = Boolean(equiposError || jugadorasError || golesError);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Goleadoras</h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las goleadoras. Intenta de nuevo.
        </p>
      ) : tabla.length === 0 ? (
        <p className="text-sm text-tinta-3">Todavía no hay goles registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Jugadora
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Equipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-3">
                  Goles
                </th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => (
                <tr key={fila.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">
                    <NombreJugadora id={fila.id} nombre={fila.nombre} fotoUrl={fila.fotoUrl} />
                  </td>
                  <td className="p-2 text-sm">
                    <NombreEquipo
                      id={fila.equipoId}
                      nombre={equipoInfoPorId.get(fila.equipoId)?.nombre ?? "Equipo"}
                      logoUrl={equipoInfoPorId.get(fila.equipoId)?.logoUrl ?? null}
                    />
                  </td>
                  <td className="p-2 text-sm font-medium">{fila.goles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
