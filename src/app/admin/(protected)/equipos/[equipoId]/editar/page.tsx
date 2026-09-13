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

  const { data: equipo } = await supabase
    .from("equipos")
    .select("id, nombre, logo_url, torneo_id")
    .eq("id", equipoId)
    .maybeSingle();

  if (!equipo) {
    notFound();
  }

  const actualizarConIds = actualizarEquipo.bind(null, equipo.id, equipo.torneo_id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar equipo</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          await actualizarConIds({ errors: {} }, formData);
        }}
        className="flex flex-col gap-3 max-w-sm"
      >
        <label className="flex flex-col gap-1">
          <span>Nombre</span>
          <input
            name="nombre"
            defaultValue={equipo.nombre}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Logo (link, opcional)</span>
          <input
            name="logoUrl"
            defaultValue={equipo.logo_url ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
