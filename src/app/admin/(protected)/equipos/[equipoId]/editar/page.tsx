import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { actualizarEquipo } from "../../../torneos/[torneoId]/equipos/actions";
import { notFound } from "next/navigation";

export default async function EditarEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>;
}) {
  const { equipoId } = await params;
  const supabase = await createClient();

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, torneo_id")
    .eq("id", equipoId)
    .maybeSingle();

  if (!equipo && !equipoError) {
    notFound();
  }

  if (equipoError || !equipo) {
    return (
      <div className="flex flex-col gap-4">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudo cargar el equipo. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const actualizarConIds = actualizarEquipo.bind(null, equipo.id, equipo.torneo_id);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/torneos/${equipo.torneo_id}/equipos`}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Equipos
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Editar equipo
        </h1>
      </div>
      <form
        action={async (formData: FormData) => {
          "use server";
          await actualizarConIds({ errors: {} }, formData);
        }}
        className="flex max-w-sm flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Nombre</span>
          <input
            name="nombre"
            defaultValue={equipo.nombre}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Logo (link, opcional)</span>
          <input
            name="logoUrl"
            defaultValue={equipo.logo_url ?? ""}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
