import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { NombreEquipo } from "@/components/public/nombre-equipo";

export default async function SuspendidasPage({
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

  const { data: jugadorasRaw, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, equipo_id")
          .in("equipo_id", equipoIds)
      : { data: [] as { id: string; nombre: string; equipo_id: string }[], error: null };

  const jugadoraPorId = new Map((jugadorasRaw ?? []).map((jugadora) => [jugadora.id, jugadora]));
  const jugadoraIds = (jugadorasRaw ?? []).map((jugadora) => jugadora.id);

  const { data: jornadas, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta")
    .eq("torneo_id", torneoId);

  const etiquetaPorJornada = new Map(
    (jornadas ?? []).map((jornada) => [jornada.id, jornada.etiqueta])
  );

  const { data: suspensiones, error: suspensionesError } =
    jugadoraIds.length > 0
      ? await supabase
          .from("suspensiones")
          .select("id, jugadora_id, jornada_desde_id, jornada_hasta_id, motivo")
          .in("jugadora_id", jugadoraIds)
      : {
          data: [] as {
            id: string;
            jugadora_id: string;
            jornada_desde_id: string;
            jornada_hasta_id: string;
            motivo: string | null;
          }[],
          error: null,
        };

  const hayError = Boolean(
    equiposError || jugadorasError || jornadasError || suspensionesError
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Suspendidas</h1>
      {hayError ? (
        <p className="text-red-600">No se pudieron cargar las suspensiones. Intenta de nuevo.</p>
      ) : (suspensiones ?? []).length === 0 ? (
        <p className="text-gray-600">No hay jugadoras suspendidas por el momento.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Jugadora</th>
              <th className="p-2">Equipo</th>
              <th className="p-2">Desde</th>
              <th className="p-2">Hasta</th>
              <th className="p-2">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {(suspensiones ?? []).map((suspension) => {
              const jugadora = jugadoraPorId.get(suspension.jugadora_id);
              return (
                <tr key={suspension.id} className="border-t">
                  <td className="p-2">
                    {jugadora ? (
                      <NombreJugadora id={jugadora.id} nombre={jugadora.nombre} />
                    ) : (
                      "Jugadora"
                    )}
                  </td>
                  <td className="p-2">
                    {jugadora ? (
                      <NombreEquipo
                        id={jugadora.equipo_id}
                        nombre={nombrePorEquipo.get(jugadora.equipo_id) ?? "Equipo"}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    {etiquetaPorJornada.get(suspension.jornada_desde_id) ?? "—"}
                  </td>
                  <td className="p-2">
                    {etiquetaPorJornada.get(suspension.jornada_hasta_id) ?? "—"}
                  </td>
                  <td className="p-2">{suspension.motivo ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
