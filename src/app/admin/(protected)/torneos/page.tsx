import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TorneoForm } from "./torneo-form";
import { ToggleActivoButton } from "./toggle-activo-button";

export default async function TorneosPage() {
  const supabase = await createClient();
  const { data: torneos } = await supabase
    .from("torneos")
    .select("id, nombre, categoria, temporada, activo")
    .order("temporada", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Torneos</h1>
      <TorneoForm />
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Nombre</th>
            <th className="p-2">Categoría</th>
            <th className="p-2">Temporada</th>
            <th className="p-2">Activo</th>
            <th className="p-2"></th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(torneos ?? []).map((torneo) => (
            <tr key={torneo.id} className="border-t">
              <td className="p-2">{torneo.nombre}</td>
              <td className="p-2">{torneo.categoria}</td>
              <td className="p-2">{torneo.temporada}</td>
              <td className="p-2">{torneo.activo ? "Sí" : "No"}</td>
              <td className="p-2">
                <ToggleActivoButton id={torneo.id} activo={torneo.activo} />
              </td>
              <td className="p-2">
                <Link href={`/admin/torneos/${torneo.id}/equipos`} className="underline">
                  Ver equipos
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
