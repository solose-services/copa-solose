import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { JugadoraForm } from "./jugadora-form";
import { eliminarJugadora } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

export default async function JugadorasPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipos")
    .select("nombre, torneo_id")
    .eq("id", equipoId)
    .maybeSingle();

  const { data: jugadoras, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, numero_camiseta")
    .eq("equipo_id", equipoId)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={equipo?.torneo_id ? `/admin/torneos/${equipo.torneo_id}/equipos` : "/admin/torneos"}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Equipos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Jugadoras — {equipo?.nombre ?? "Equipo"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nueva jugadora…">
        <JugadoraForm equipoId={equipoId} />
      </FormularioColapsable>
      {jugadorasError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar las jugadoras. Intenta de nuevo.
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
                  Número
                </th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(jugadoras ?? []).map((jugadora) => (
                <tr key={jugadora.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar src={jugadora.foto_url} nombre={jugadora.nombre} size={20} />
                      {jugadora.nombre}
                    </span>
                  </td>
                  <td className="p-2 text-sm">{jugadora.numero_camiseta ?? "—"}</td>
                  <td className="p-2">
                    <Link
                      href={`/admin/jugadoras/${jugadora.id}/editar`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-azul underline"
                    >
                      <Pencil size={13} strokeWidth={1.7} />
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
        </div>
      )}
    </div>
  );
}
