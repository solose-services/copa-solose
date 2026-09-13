import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { AvisoForm } from "./aviso-form";
import { eliminarAviso } from "./actions";

export default async function AvisosPage() {
  const supabase = await createClient();

  const { data: avisos, error: avisosError } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, fecha_publicacion")
    .order("fecha_publicacion", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="underline">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold">Avisos</h1>
      <AvisoForm />
      {avisosError ? (
        <p className="text-red-600">No se pudieron cargar los avisos. Intenta de nuevo.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(avisos ?? []).map((aviso) => (
            <li key={aviso.id} className="flex flex-col gap-1 rounded border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{aviso.titulo}</span>
                <DeleteButton
                  onDelete={eliminarAviso.bind(null, aviso.id)}
                  confirmMessage={`¿Eliminar el aviso "${aviso.titulo}"? Esto no se puede deshacer.`}
                />
              </div>
              <p className="text-sm text-gray-700">{aviso.cuerpo}</p>
              <span className="text-xs text-gray-500">
                {new Date(aviso.fecha_publicacion).toLocaleDateString("es-MX")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
