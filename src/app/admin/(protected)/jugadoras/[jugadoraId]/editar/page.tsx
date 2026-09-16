import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const { data: jugadora, error: jugadoraError } = await supabase
    .from("jugadoras")
    .select("id, nombre, numero_camiseta, foto_url, equipo_id")
    .eq("id", jugadoraId)
    .maybeSingle();

  if (!jugadora && !jugadoraError) {
    notFound();
  }

  if (jugadoraError || !jugadora) {
    return (
      <div className="flex flex-col gap-4">
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          No se pudo cargar la jugadora. Intenta de nuevo.
        </p>
      </div>
    );
  }

  const actualizarConIds = actualizarJugadora.bind(null, jugadora.id, jugadora.equipo_id);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/equipos/${jugadora.equipo_id}/jugadoras`}
        className="inline-flex items-center gap-1 text-sm text-tinta-2 hover:text-azul"
      >
        <ArrowLeft size={14} strokeWidth={1.7} />
        Volver a Jugadoras
      </Link>
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Editar jugadora
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
            defaultValue={jugadora.nombre}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Número de camiseta (opcional)</span>
          <input
            name="numeroCamiseta"
            defaultValue={jugadora.numero_camiseta ?? ""}
            className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">Foto (link, opcional)</span>
          <input
            name="fotoUrl"
            defaultValue={jugadora.foto_url ?? ""}
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
