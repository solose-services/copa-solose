import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { SuspensionForm } from "./suspension-form";
import { eliminarSuspension } from "./actions";

export default async function SuspensionesPage() {
  const supabase = await createClient();

  const { data: jugadorasRaw, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, equipo_id")
    .order("nombre");

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre");

  const nombrePorEquipo = new Map((equipos ?? []).map((equipo) => [equipo.id, equipo.nombre]));

  const jugadoras = (jugadorasRaw ?? []).map((jugadora) => ({
    id: jugadora.id,
    etiqueta: `${jugadora.nombre} (${nombrePorEquipo.get(jugadora.equipo_id) ?? "Equipo"})`,
  }));

  const { data: jornadasRaw, error: jornadasError } = await supabase
    .from("jornadas")
    .select("id, etiqueta, torneo_id")
    .order("orden");

  const { data: torneos, error: torneosError } = await supabase
    .from("torneos")
    .select("id, nombre");

  const nombrePorTorneo = new Map((torneos ?? []).map((torneo) => [torneo.id, torneo.nombre]));

  const jornadas = (jornadasRaw ?? []).map((jornada) => ({
    id: jornada.id,
    etiqueta: `${nombrePorTorneo.get(jornada.torneo_id) ?? "Torneo"} — ${jornada.etiqueta}`,
  }));

  const jugadoraPorId = new Map(jugadoras.map((jugadora) => [jugadora.id, jugadora.etiqueta]));
  const jornadaPorId = new Map(jornadas.map((jornada) => [jornada.id, jornada.etiqueta]));

  const { data: suspensiones, error: suspensionesError } = await supabase
    .from("suspensiones")
    .select("id, jugadora_id, jornada_desde_id, jornada_hasta_id, motivo")
    .order("id", { ascending: false });

  const hayErrorDeApoyo = Boolean(jugadorasError || equiposError || jornadasError || torneosError);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="underline">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold">Suspensiones</h1>
      {hayErrorDeApoyo ? (
        <p className="text-red-600">
          No se pudo cargar la información necesaria para el formulario. Intenta de nuevo.
        </p>
      ) : (
        <SuspensionForm jugadoras={jugadoras} jornadas={jornadas} />
      )}
      {suspensionesError ? (
        <p className="text-red-600">No se pudieron cargar las suspensiones. Intenta de nuevo.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Jugadora</th>
              <th className="p-2">Desde</th>
              <th className="p-2">Hasta</th>
              <th className="p-2">Motivo</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(suspensiones ?? []).map((suspension) => (
              <tr key={suspension.id} className="border-t">
                <td className="p-2">
                  {jugadoraPorId.get(suspension.jugadora_id) ?? "Jugadora"}
                </td>
                <td className="p-2">
                  {jornadaPorId.get(suspension.jornada_desde_id) ?? "—"}
                </td>
                <td className="p-2">
                  {jornadaPorId.get(suspension.jornada_hasta_id) ?? "—"}
                </td>
                <td className="p-2">{suspension.motivo ?? "—"}</td>
                <td className="p-2">
                  <DeleteButton
                    onDelete={eliminarSuspension.bind(null, suspension.id)}
                    confirmMessage="¿Eliminar esta suspensión? Esto no se puede deshacer."
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
