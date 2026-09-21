import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PartidoForm } from "./partido-form";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

export default async function PartidosPage({
  params,
}: {
  params: Promise<{ torneoId: string; jornadaId: string }>;
}) {
  const { torneoId, jornadaId } = await params;
  const supabase = await createClient();

  const { data: jornada } = await supabase
    .from("jornadas")
    .select("etiqueta")
    .eq("id", jornadaId)
    .maybeSingle();

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, grupo_id")
    .eq("torneo_id", torneoId)
    .order("nombre");

  const { data: grupos } = await supabase
    .from("grupos")
    .select("id, nombre")
    .eq("torneo_id", torneoId)
    .order("orden");

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );

  const { data: partidos, error: partidosError } = await supabase
    .from("partidos")
    .select("id, equipo_local_id, equipo_visitante_id, fecha, hora")
    .eq("jornada_id", jornadaId)
    .order("fecha");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/torneos/${torneoId}/jornadas`}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Jornadas
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Partidos — {jornada?.etiqueta ?? "Jornada"}
        </h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo partido…">
        <PartidoForm
          jornadaId={jornadaId}
          torneoId={torneoId}
          equipos={(equipos ?? []).map((equipo) => ({
            id: equipo.id,
            nombre: equipo.nombre,
            grupoId: equipo.grupo_id,
          }))}
          grupos={grupos ?? []}
        />
      </FormularioColapsable>
      {partidosError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar los partidos. Intenta de nuevo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Local
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Visitante
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Fecha
                </th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(partidos ?? []).map((partido) => {
                const local = equipoInfoPorId.get(partido.equipo_local_id);
                const visitante = equipoInfoPorId.get(partido.equipo_visitante_id);
                return (
                  <tr key={partido.id} className="border-b border-linea-2">
                    <td className="p-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar src={local?.logoUrl ?? null} nombre={local?.nombre ?? "Equipo"} size={20} />
                        {local?.nombre ?? "Equipo"}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar
                          src={visitante?.logoUrl ?? null}
                          nombre={visitante?.nombre ?? "Equipo"}
                          size={20}
                        />
                        {visitante?.nombre ?? "Equipo"}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-sm">
                      {partido.fecha ?? "—"}
                      {partido.hora ? ` · ${partido.hora.slice(0, 5)}` : ""}
                    </td>
                    <td className="p-2">
                      <Link
                        href={`/admin/partidos/${partido.id}/capturar`}
                        className="text-sm font-medium text-azul underline"
                      >
                        Capturar
                      </Link>
                    </td>
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
