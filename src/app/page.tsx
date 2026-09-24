import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";

export default async function PrincipalPage() {
  const supabase = await createClient();

  const [
    { data: avisos, error: avisosError },
    { data: torneos, error: torneosError },
  ] = await Promise.all([
    supabase
      .from("avisos")
      .select("id, titulo, cuerpo, fecha_publicacion")
      .order("fecha_publicacion", { ascending: false })
      .limit(10),
    supabase.from("torneos").select("id, nombre, categoria").eq("activo", true).order("nombre"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col">
      <main className="flex flex-col gap-8 p-6">
        <h1>
          <Logo className="h-11 w-auto" />
        </h1>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
            <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Avisos</h2>
          </div>
          {avisosError ? (
            <p
              className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
            >
              No se pudieron cargar los avisos. Intenta de nuevo.
            </p>
          ) : (avisos ?? []).length === 0 ? (
            <p className="text-sm text-tinta-2">No hay avisos por el momento.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(avisos ?? []).map((aviso) => (
                <li
                  key={aviso.id}
                  className="rounded-sm border-l-2 border-azul px-3 py-2.5"
                  style={{ background: "rgba(22,0,251,.07)" }}
                >
                  <p className="font-tit text-lg">{aviso.titulo}</p>
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
              style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
            >
              No se pudieron cargar los torneos. Intenta de nuevo.
            </p>
          ) : (torneos ?? []).length === 0 ? (
            <p className="text-sm text-tinta-2">Todavía no hay torneos activos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(torneos ?? []).map((torneo) => (
                <Link
                  key={torneo.id}
                  href={`/torneos/${torneo.id}/calendario`}
                  className="rounded-sm border-2 border-azul bg-papel px-6 py-7 text-center font-tit text-xl uppercase tracking-[.06em] text-azul [word-spacing:.35em] hover:bg-azul hover:text-white"
                >
                  {torneo.nombre}
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
