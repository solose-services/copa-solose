import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarJugadora } from "../../../equipos/[equipoId]/jugadoras/actions";

export default async function EditarJugadoraPage({
  params,
}: {
  params: Promise<{ jugadoraId: string }>;
}) {
  const { jugadoraId } = await params;
  const supabase = await createClient();

  const { data: jugadora } = await supabase
    .from("jugadoras")
    .select("id, nombre, numero_camiseta, foto_url, equipo_id")
    .eq("id", jugadoraId)
    .maybeSingle();

  if (!jugadora) {
    notFound();
  }

  const actualizarConIds = actualizarJugadora.bind(null, jugadora.id, jugadora.equipo_id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar jugadora</h1>
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
            defaultValue={jugadora.nombre}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Número de camiseta (opcional)</span>
          <input
            name="numeroCamiseta"
            defaultValue={jugadora.numero_camiseta ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Foto (link, opcional)</span>
          <input
            name="fotoUrl"
            defaultValue={jugadora.foto_url ?? ""}
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
