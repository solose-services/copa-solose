import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { EquipoForm } from "./equipo-form";
import { eliminarEquipo } from "./actions";

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
    .select("id, nombre, logo_url")
    .eq("torneo_id", torneoId)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/torneos" className="underline">
        ← Volver a Torneos
      </Link>
      <h1 className="text-xl font-semibold">
        Equipos — {torneo?.nombre ?? "Torneo"}
      </h1>
      <EquipoForm torneoId={torneoId} />
      {equiposError ? (
        <p className="text-red-600">No se pudieron cargar los equipos. Intenta de nuevo.</p>
      ) : (
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Nombre</th>
            <th className="p-2"></th>
            <th className="p-2"></th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(equipos ?? []).map((equipo) => (
            <tr key={equipo.id} className="border-t">
              <td className="p-2">{equipo.nombre}</td>
              <td className="p-2">
                <Link href={`/admin/equipos/${equipo.id}/editar`} className="underline">
                  Editar
                </Link>
              </td>
              <td className="p-2">
                <Link href={`/admin/equipos/${equipo.id}/jugadoras`} className="underline">
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
      )}
    </div>
  );
}
