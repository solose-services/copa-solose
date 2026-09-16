import { createClient } from "@/lib/supabase/server";
import { NombreJugadora } from "@/components/public/nombre-jugadora";
import { NombreEquipo } from "@/components/public/nombre-equipo";
import { formatearEtiquetaJornada } from "@/lib/jornada";

export default async function SuspendidasPage({
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

  const { data: jugadorasRaw, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, foto_url, equipo_id")
          .in("equipo_id", equipoIds)
      : {
          data: [] as { id: string; nombre: string; foto_url: string | null; equipo_id: string }[],
          error: null,
        };

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
          .order("created_at", { ascending: false })
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
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Suspendidas
        </h1>
      </div>
      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las suspensiones. Intenta de nuevo.
        </p>
      ) : (suspensiones ?? []).length === 0 ? (
        <p className="text-sm text-tinta-2">No hay jugadoras suspendidas por el momento.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Jugadora
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Equipo
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Desde
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Hasta
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody>
              {(suspensiones ?? []).map((suspension) => {
                const jugadora = jugadoraPorId.get(suspension.jugadora_id);
                const equipoInfo = jugadora ? equipoInfoPorId.get(jugadora.equipo_id) : undefined;
                return (
                  <tr key={suspension.id} className="border-b border-linea-2">
                    <td className="p-2 text-sm">
                      {jugadora ? (
                        <NombreJugadora
                          id={jugadora.id}
                          nombre={jugadora.nombre}
                          fotoUrl={jugadora.foto_url}
                        />
                      ) : (
                        "Jugadora"
                      )}
                    </td>
                    <td className="p-2 text-sm">
                      {jugadora ? (
                        <NombreEquipo
                          id={jugadora.equipo_id}
                          nombre={equipoInfo?.nombre ?? "Equipo"}
                          logoUrl={equipoInfo?.logoUrl ?? null}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 text-sm">
                      {(() => {
                        const etiqueta = etiquetaPorJornada.get(suspension.jornada_desde_id);
                        return etiqueta ? formatearEtiquetaJornada(etiqueta) : "—";
                      })()}
                    </td>
                    <td className="p-2 text-sm">
                      {(() => {
                        const etiqueta = etiquetaPorJornada.get(suspension.jornada_hasta_id);
                        return etiqueta ? formatearEtiquetaJornada(etiqueta) : "—";
                      })()}
                    </td>
                    <td className="p-2 text-sm">{suspension.motivo ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
