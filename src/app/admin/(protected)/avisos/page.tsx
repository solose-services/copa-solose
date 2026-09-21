import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { AvisoForm } from "./aviso-form";
import { eliminarAviso } from "./actions";
import { FormularioColapsable } from "@/components/admin/formulario-colapsable";

export default async function AvisosPage() {
  const supabase = await createClient();

  const { data: avisos, error: avisosError } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, fecha_publicacion")
    .order("fecha_publicacion", { ascending: false });

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
        <h1 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">Avisos</h1>
      </div>
      <FormularioColapsable etiqueta="Nuevo aviso…">
        <AvisoForm />
      </FormularioColapsable>
      {avisosError ? (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          No se pudieron cargar los avisos. Intenta de nuevo.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(avisos ?? []).map((aviso) => (
            <li key={aviso.id} className="flex flex-col gap-1 border-b border-linea-2 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-tit text-base">{aviso.titulo}</span>
                <DeleteButton
                  onDelete={eliminarAviso.bind(null, aviso.id)}
                  confirmMessage={`¿Eliminar el aviso "${aviso.titulo}"? Esto no se puede deshacer.`}
                />
              </div>
              <p className="text-sm text-tinta-2">{aviso.cuerpo}</p>
              <span className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                {new Date(aviso.fecha_publicacion).toLocaleDateString("es-MX")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
