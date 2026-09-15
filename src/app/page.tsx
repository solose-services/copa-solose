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
    <main className="mx-auto flex max-w-[1160px] flex-col gap-8 p-6">
      <h1>
        <Logo />
      </h1>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Avisos</h2>
        </div>
        {avisosError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudieron cargar los avisos. Intenta de nuevo.
          </p>
        ) : (avisos ?? []).length === 0 ? (
          <p className="text-sm text-tinta-3">No hay avisos por el momento.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(avisos ?? []).map((aviso) => (
              <li
                key={aviso.id}
                className="rounded-sm border-l-2 border-azul px-3 py-2.5"
                style={{ background: "rgba(27,63,209,.07)" }}
              >
                <p className="font-medium">{aviso.titulo}</p>
                <p className="text-sm text-tinta-2">{aviso.cuerpo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
          <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
            Elige un torneo
          </h2>
        </div>
        {torneosError ? (
          <p
            className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
          >
            No se pudieron cargar los torneos. Intenta de nuevo.
          </p>
        ) : (torneos ?? []).length === 0 ? (
          <p className="text-sm text-tinta-3">Todavía no hay torneos activos.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {(torneos ?? []).map((torneo) => (
              <Link
                key={torneo.id}
                href={`/torneos/${torneo.id}/calendario`}
                className="rounded-sm border border-linea bg-papel p-6 text-center font-medium text-tinta hover:border-azul hover:text-azul"
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
