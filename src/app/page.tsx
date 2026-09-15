import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";

export default async function PrincipalPage() {
  const supabase = await createClient();

  const { data: avisos, error: avisosError } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, fecha_publicacion")
    .order("fecha_publicacion", { ascending: false })
    .limit(10);

  const { data: torneos, error: torneosError } = await supabase
    .from("torneos")
    .select("id, nombre, categoria")
    .eq("activo", true)
    .order("nombre");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <h1>
        <Logo />
      </h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Avisos</h2>
        {avisosError ? (
          <p className="text-red-600">No se pudieron cargar los avisos. Intenta de nuevo.</p>
        ) : (avisos ?? []).length === 0 ? (
          <p className="text-gray-600">No hay avisos por el momento.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(avisos ?? []).map((aviso) => (
              <li key={aviso.id} className="rounded border p-4">
                <p className="font-semibold">{aviso.titulo}</p>
                <p className="text-sm text-gray-700">{aviso.cuerpo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Elige un torneo</h2>
        {torneosError ? (
          <p className="text-red-600">No se pudieron cargar los torneos. Intenta de nuevo.</p>
        ) : (torneos ?? []).length === 0 ? (
          <p className="text-gray-600">Todavía no hay torneos activos.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {(torneos ?? []).map((torneo) => (
              <Link
                key={torneo.id}
                href={`/torneos/${torneo.id}/calendario`}
                className="rounded border p-6 text-center font-semibold underline"
              >
                {torneo.nombre}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
