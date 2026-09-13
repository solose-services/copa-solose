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
    .select("id, nombre")
    .eq("torneo_id", torneoId);

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));
  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);

  const { data: jugadoras, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, equipo_id")
          .in("equipo_id", equipoIds)
          .order("nombre")
      : { data: [] as { id: string; nombre: string; equipo_id: string }[], error: null };

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
      equipoId: jugadora.equipo_id,
      goles: golesPorJugadora.get(jugadora.id) ?? 0,
    }))
    .filter((fila) => fila.goles > 0)
    .sort((a, b) => b.goles - a.goles || a.nombre.localeCompare(b.nombre));

  const hayError = Boolean(equiposError || jugadorasError || golesError);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Goleadoras</h1>
      {hayError ? (
        <p className="text-red-600">No se pudieron cargar las goleadoras. Intenta de nuevo.</p>
      ) : tabla.length === 0 ? (
        <p className="text-gray-600">Todavía no hay goles registrados.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Jugadora</th>
              <th className="p-2">Equipo</th>
              <th className="p-2">Goles</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((fila) => (
              <tr key={fila.id} className="border-t">
                <td className="p-2">
                  <NombreJugadora id={fila.id} nombre={fila.nombre} />
                </td>
                <td className="p-2">
                  <NombreEquipo
                    id={fila.equipoId}
                    nombre={nombrePorEquipo.get(fila.equipoId) ?? "Equipo"}
                  />
                </td>
                <td className="p-2">{fila.goles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
