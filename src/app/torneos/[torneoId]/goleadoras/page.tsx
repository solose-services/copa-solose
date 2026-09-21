import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";

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
          .select("id, nombre, foto_url, equipo_id, numero_camiseta")
          .in("equipo_id", equipoIds)
          .order("nombre")
      : {
          data: [] as {
            id: string;
            nombre: string;
            foto_url: string | null;
            equipo_id: string;
            numero_camiseta: number | null;
          }[],
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
      numeroCamiseta: jugadora.numero_camiseta,
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
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar las goleadoras. Intenta de nuevo.
        </p>
      ) : tabla.length === 0 ? (
        <p className="text-sm text-tinta-2">Todavía no hay goles registrados.</p>
      ) : (
        <ol className="flex flex-col">
          {tabla.map((fila, indice) => {
            const esLider = indice === 0;
            const equipoInfo = equipoInfoPorId.get(fila.equipoId);
            const subtitulo = [
              equipoInfo?.nombre ?? "Equipo",
              fila.numeroCamiseta != null ? `#${fila.numeroCamiseta}` : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={fila.id}
                className={
                  esLider
                    ? "border-b-2 border-azul pb-3"
                    : "border-b border-linea-2 last:border-b-0"
                }
              >
                <Link
                  href={`/jugadoras/${fila.id}`}
                  className={
                    esLider
                      ? "flex items-center gap-3 pt-1 hover:text-azul"
                      : "flex items-center gap-3 py-2.5 hover:text-azul"
                  }
                >
                  <span
                    className={
                      esLider
                        ? "w-5 flex-none text-right font-mono text-sm font-semibold text-azul"
                        : "w-5 flex-none text-right font-mono text-xs text-tinta-2"
                    }
                  >
                    {indice + 1}
                  </span>
                  <Avatar src={fila.fotoUrl} nombre={fila.nombre} size={esLider ? 40 : 28} />
                  <span className="flex flex-1 flex-col">
                    <span
                      className={
                        esLider
                          ? "font-tit text-lg uppercase tracking-tight text-azul"
                          : "text-sm font-medium"
                      }
                    >
                      {fila.nombre}
                    </span>
                    <span className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                      {subtitulo}
                    </span>
                  </span>
                  <span
                    className={
                      esLider
                        ? "font-tit text-3xl font-semibold text-azul"
                        : "font-mono text-lg font-semibold"
                    }
                  >
                    {fila.goles}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
