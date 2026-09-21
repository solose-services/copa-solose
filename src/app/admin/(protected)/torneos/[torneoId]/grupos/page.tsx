import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";
import { GrupoForm } from "./grupo-form";
import { AsignarGrupoSelect } from "./asignar-grupo-select";
import { eliminarGrupo } from "./actions";

export default async function GruposPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const [{ data: torneo }, { data: grupos, error: gruposError }, { data: equipos, error: equiposError }] =
    await Promise.all([
      supabase.from("torneos").select("nombre").eq("id", torneoId).maybeSingle(),
      supabase.from("grupos").select("id, nombre").eq("torneo_id", torneoId).order("orden"),
      supabase
        .from("equipos")
        .select("id, nombre, logo_url, grupo_id")
        .eq("torneo_id", torneoId)
        .order("nombre"),
    ]);

  const hayError = Boolean(gruposError || equiposError);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/torneos"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Torneos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Grupos — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>

      {hayError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar los grupos. Intenta de nuevo.
        </p>
      ) : (
        <>
          <FormularioColapsable etiqueta="Nuevo grupo…">
            <GrupoForm torneoId={torneoId} />
          </FormularioColapsable>

          {(grupos ?? []).length === 0 ? (
            <p className="text-sm text-tinta-2">
              Este torneo todavía no tiene grupos. Si no creas ninguno, las posiciones y los
              partidos funcionan como un torneo de tabla única, igual que antes.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {(grupos ?? []).map((grupo) => (
                <li
                  key={grupo.id}
                  className="flex items-center gap-2 rounded-md border border-linea bg-papel px-3 py-1.5 text-sm"
                >
                  {grupo.nombre}
                  <DeleteButton
                    onDelete={eliminarGrupo.bind(null, grupo.id, torneoId)}
                    confirmMessage={`¿Eliminar "${grupo.nombre}"? Los equipos asignados quedarán sin grupo.`}
                  />
                </li>
              ))}
            </ul>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
              <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
                Asignar equipos
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                      Equipo
                    </th>
                    <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                      Grupo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(equipos ?? []).map((equipo) => (
                    <tr key={equipo.id} className="border-b border-linea-2">
                      <td className="p-2 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <Avatar src={equipo.logo_url} nombre={equipo.nombre} size={20} />
                          {equipo.nombre}
                        </span>
                      </td>
                      <td className="p-2">
                        <AsignarGrupoSelect
                          equipoId={equipo.id}
                          torneoId={torneoId}
                          grupoIdActual={equipo.grupo_id}
                          grupos={grupos ?? []}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
