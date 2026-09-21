import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { SuspensionForm } from "./suspension-form";
import { eliminarSuspension } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";
import { Avatar } from "@/components/ui/avatar";

export default async function SuspensionesPage() {
  const supabase = await createClient();

  const { data: jugadorasRaw, error: jugadorasError } = await supabase
    .from("jugadoras")
    .select("id, nombre, foto_url, equipo_id")
    .order("nombre");

  const { data: equipos, error: equiposError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url");

  const equipoInfoPorId = new Map(
    (equipos ?? []).map((equipo) => [equipo.id, { nombre: equipo.nombre, logoUrl: equipo.logo_url }])
  );

  // Etiquetas planas para los <select> del formulario (un <option> no puede llevar imagen).
  const jugadoras = (jugadorasRaw ?? []).map((jugadora) => ({
    id: jugadora.id,
    etiqueta: `${jugadora.nombre} (${equipoInfoPorId.get(jugadora.equipo_id)?.nombre ?? "Equipo"})`,
  }));

  // Detalle completo (con avatar) para la tabla de suspensiones ya registradas.
  const jugadoraDetallePorId = new Map(
    (jugadorasRaw ?? []).map((jugadora) => [
      jugadora.id,
      {
        nombre: jugadora.nombre,
        fotoUrl: jugadora.foto_url,
        equipoNombre: equipoInfoPorId.get(jugadora.equipo_id)?.nombre ?? "Equipo",
      },
    ])
  );

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

  const jornadaPorId = new Map(jornadas.map((jornada) => [jornada.id, jornada.etiqueta]));

  const { data: suspensiones, error: suspensionesError } = await supabase
    .from("suspensiones")
    .select("id, jugadora_id, jornada_desde_id, jornada_hasta_id, motivo, created_at")
    .order("created_at", { ascending: false });

  const hayErrorDeApoyo = Boolean(jugadorasError || equiposError || jornadasError || torneosError);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Suspensiones
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
          <SuspensionForm jugadoras={jugadoras} jornadas={jornadas} />
        </FormularioColapsable>
      )}
      {suspensionesError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar las suspensiones. Intenta de nuevo.
        </p>
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
                        onDelete={eliminarSuspension.bind(null, suspension.id)}
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
