import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { SuspensionForm } from "@/app/admin/(protected)/suspensiones/suspension-form";
import { eliminarSuspension } from "@/app/admin/(protected)/suspensiones/actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

export default async function SuspendidasTorneoPage({
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
    .select("id, nombre")
    .eq("torneo_id", torneoId);

  const equipoIds = (equipos ?? []).map((equipo) => equipo.id);
  const nombreEquipoPorId = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));

  const { data: jugadorasRaw, error: jugadorasError } =
    equipoIds.length > 0
      ? await supabase
          .from("jugadoras")
          .select("id, nombre, foto_url, equipo_id")
          .in("equipo_id", equipoIds)
          .order("nombre")
      : {
          data: [] as { id: string; nombre: string; foto_url: string | null; equipo_id: string }[],
          error: null,
        };

  // Etiquetas planas para los <select> del formulario (un <option> no puede llevar imagen).
  const jugadoras = (jugadorasRaw ?? []).map((jugadora) => ({
    id: jugadora.id,
    etiqueta: `${jugadora.nombre} (${nombreEquipoPorId.get(jugadora.equipo_id) ?? "Equipo"})`,
  }));

  // Detalle completo (con avatar) para la tabla de suspensiones ya registradas.
  const jugadoraDetallePorId = new Map(
    (jugadorasRaw ?? []).map((jugadora) => [
      jugadora.id,
      {
        nombre: jugadora.nombre,
        fotoUrl: jugadora.foto_url,
        equipoNombre: nombreEquipoPorId.get(jugadora.equipo_id) ?? "Equipo",
      },
    ])
  );

  const { data: jornadasRaw, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta")
    .eq("torneo_id", torneoId)
    .order("orden");

  const jornadas = (jornadasRaw ?? []).map((jornada) => ({
    id: jornada.id,
    etiqueta: jornada.etiqueta,
  }));

  const jornadaPorId = new Map(jornadas.map((jornada) => [jornada.id, jornada.etiqueta]));
  const jornadaIds = jornadas.map((jornada) => jornada.id);

  const { data: suspensiones, error: suspensionesError } =
    jornadaIds.length > 0
      ? await supabase
          .from("suspensiones")
          .select("id, jugadora_id, jornada_desde_id, jornada_hasta_id, motivo, created_at")
          .in("jornada_desde_id", jornadaIds)
          .order("created_at", { ascending: false })
      : {
          data: [] as {
            id: string;
            jugadora_id: string;
            jornada_desde_id: string;
            jornada_hasta_id: string;
            motivo: string | null;
            created_at: string;
          }[],
          error: null,
        };

  const hayErrorDeApoyo = Boolean(equiposError || jugadorasError || jornadasError);

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
          Suspendidas — {torneo?.nombre ?? "Torneo"}
        </h1>
      </div>
      {hayErrorDeApoyo ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudo cargar la información necesaria para el formulario. Intenta de nuevo.
        </p>
      ) : (
        <FormularioColapsable etiqueta="Nueva suspensión…">
          <SuspensionForm jugadoras={jugadoras} jornadas={jornadas} torneoId={torneoId} />
        </FormularioColapsable>
      )}
      {suspensionesError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar las suspensiones. Intenta de nuevo.
        </p>
      ) : (suspensiones ?? []).length === 0 ? (
        <p className="text-sm text-tinta-2">Este torneo no tiene suspensiones registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Jugadora
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Desde
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Hasta
                </th>
                <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                  Motivo
                </th>
                <th className="border-b border-linea p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(suspensiones ?? []).map((suspension) => {
                const detalle = jugadoraDetallePorId.get(suspension.jugadora_id);
                return (
                  <tr key={suspension.id} className="border-b border-linea-2">
                    <td className="p-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar
                          src={detalle?.fotoUrl ?? null}
                          nombre={detalle?.nombre ?? "Jugadora"}
                          size={20}
                        />
                        {detalle ? `${detalle.nombre} (${detalle.equipoNombre})` : "Jugadora"}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      {jornadaPorId.get(suspension.jornada_desde_id) ?? "—"}
                    </td>
                    <td className="p-2 text-sm">
                      {jornadaPorId.get(suspension.jornada_hasta_id) ?? "—"}
                    </td>
                    <td className="p-2 text-sm">{suspension.motivo ?? "—"}</td>
                    <td className="p-2">
                      <DeleteButton
                        onDelete={eliminarSuspension.bind(null, torneoId, suspension.id)}
                        confirmMessage="¿Eliminar esta suspensión? Esto no se puede deshacer."
                      />
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
