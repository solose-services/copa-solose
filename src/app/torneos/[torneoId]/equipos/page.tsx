import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";

export default async function EquiposTorneoPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const [{ data: equipos, error: equiposError }, { data: grupos }] = await Promise.all([
    supabase
      .from("equipos")
      .select("id, nombre, logo_url, grupo_id")
      .eq("torneo_id", torneoId)
      .order("nombre"),
    supabase.from("grupos").select("id, nombre").eq("torneo_id", torneoId).order("orden"),
  ]);

  const hayGrupos = (grupos ?? []).length > 0;

  function TarjetaEquipo({
    equipo,
  }: {
    equipo: { id: string; nombre: string; logo_url: string | null };
  }) {
    return (
      <Link
        href={`/equipos/${equipo.id}`}
        className="flex items-center gap-3 rounded-md border border-linea bg-papel px-4 py-3 hover:border-azul"
      >
        <Avatar src={equipo.logo_url} nombre={equipo.nombre} size={36} />
        <span className="font-medium">{equipo.nombre}</span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Equipos</h1>
      </div>
      {equiposError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar los equipos. Intenta de nuevo.
        </p>
      ) : (equipos ?? []).length === 0 ? (
        <p className="text-sm text-tinta-2">Todavía no hay equipos registrados.</p>
      ) : hayGrupos ? (
        <div className="flex flex-col gap-6">
          {(grupos ?? []).map((grupo) => {
            const equiposDelGrupo = (equipos ?? []).filter(
              (equipo) => equipo.grupo_id === grupo.id
            );
            if (equiposDelGrupo.length === 0) return null;
            return (
              <section key={grupo.id} className="flex flex-col gap-3">
                <h2 className="font-tit text-sm uppercase tracking-[.1em] text-tinta-2">
                  {grupo.nombre}
                </h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {equiposDelGrupo.map((equipo) => (
                    <TarjetaEquipo key={equipo.id} equipo={equipo} />
                  ))}
                </div>
              </section>
            );
          })}
          {(() => {
            const sinGrupo = (equipos ?? []).filter((equipo) => !equipo.grupo_id);
            if (sinGrupo.length === 0) return null;
            return (
              <section className="flex flex-col gap-3">
                <h2 className="font-tit text-sm uppercase tracking-[.1em] text-tinta-2">
                  Sin grupo
                </h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sinGrupo.map((equipo) => (
                    <TarjetaEquipo key={equipo.id} equipo={equipo} />
                  ))}
                </div>
              </section>
            );
          })()}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(equipos ?? []).map((equipo) => (
            <TarjetaEquipo key={equipo.id} equipo={equipo} />
          ))}
        </div>
      )}
    </div>
  );
}
