import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TorneoForm } from "./torneo-form";
import { ToggleActivoButton } from "./toggle-activo-button";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";

export default async function TorneosPage() {
  const supabase = await createClient();
  const { data: torneos, error } = await supabase
    .from("torneos")
    .select("id, nombre, categoria, temporada, activo")
    .order("temporada", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Torneos</h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo torneo…">
        <TorneoForm />
      </FormularioColapsable>
      {error ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudieron cargar los torneos. Intenta de nuevo.
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
                  Categoría
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Temporada
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Activo
                </th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(torneos ?? []).map((torneo) => (
                <tr key={torneo.id} className="border-b border-linea-2">
                  <td className="p-2 text-sm">{torneo.nombre}</td>
                  <td className="p-2 text-sm">{torneo.categoria}</td>
                  <td className="p-2 text-sm">{torneo.temporada}</td>
                  <td className="p-2 text-sm">{torneo.activo ? "Sí" : "No"}</td>
                  <td className="p-2">
                    <ToggleActivoButton id={torneo.id} activo={torneo.activo} />
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneo.id}/equipos`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver equipos
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneo.id}/jornadas`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Ver jornadas
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/torneos/${torneo.id}/reglamento`}
                      className="text-sm font-medium text-azul underline"
                    >
                      Reglamento
                    </Link>
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
