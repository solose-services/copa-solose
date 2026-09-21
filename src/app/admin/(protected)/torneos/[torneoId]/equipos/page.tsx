import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { EquipoForm } from "./equipo-form";
import { eliminarEquipo } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

export default async function EquiposPage({
  params,
}: {
  params: Promise<{ torneoId: string }>;
}) {
  const { torneoId } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("torneos")
    .select("nombre")
    .eq("id", torneoId)
    .maybeSingle();

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, grupo_id")
    .eq("torneo_id", torneoId)
    .order("nombre");

  const { data: grupos } = await supabase
    .from("grupos")
    .select("id, nombre")
    .eq("torneo_id", torneoId)
    .order("orden");

  const nombreGrupoPorId = new Map((grupos ?? []).map((grupo) => [grupo.id, grupo.nombre]));

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
          Equipos — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo equipo…">
        <EquipoForm torneoId={torneoId} />
      </FormularioColapsable>
      {equiposError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar los equipos. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Nombre
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Grupo
                </th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
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
                  <td className="p-2 text-sm text-tinta-2">
                    {equipo.grupo_id ? nombreGrupoPorId.get(equipo.grupo_id) ?? "—" : "—"}
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/equipos/${equipo.id}/editar`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-azul underline"
                    >
                      <Pencil size={13} strokeWidth={1.7} />
                      Editar
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/equipos/${equipo.id}/jugadoras`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver jugadoras
                    </Link>
                  </td>
                  <td className="p-2">
                    <DeleteButton
                      onDelete={eliminarEquipo.bind(null, equipo.id, torneoId)}
                      confirmMessage={`¿Eliminar a ${equipo.nombre}? Esto también eliminará a todas sus jugadoras registradas y no se puede deshacer.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
