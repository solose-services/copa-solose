import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { JugadoraForm } from "./jugadora-form";
import { eliminarJugadora } from "./actions";

export default async function JugadorasPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipos")
    .select("nombre")
    .eq("id", equipoId)
    .maybeSingle();

  const { data: jugadoras, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, numero_camiseta")
    .eq("equipo_id", equipoId)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        Jugadoras — {equipo?.nombre ?? "Equipo"}
      </h1>
      <JugadoraForm equipoId={equipoId} />
      {jugadorasError ? (
        <p className="text-red-600">No se pudieron cargar las jugadoras. Intenta de nuevo.</p>
      ) : (
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Nombre</th>
            <th className="p-2">Número</th>
            <th className="p-2"></th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(jugadoras ?? []).map((jugadora) => (
            <tr key={jugadora.id} className="border-t">
              <td className="p-2">{jugadora.nombre}</td>
              <td className="p-2">{jugadora.numero_camiseta ?? "—"}</td>
              <td className="p-2">
                <Link href={`/admin/jugadoras/${jugadora.id}/editar`} className="underline">
                  Editar
                </Link>
              </td>
              <td className="p-2">
                <DeleteButton
                  onDelete={eliminarJugadora.bind(null, jugadora.id, equipoId)}
                  confirmMessage={`¿Eliminar a ${jugadora.nombre}? Esto no se puede deshacer.`}
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
