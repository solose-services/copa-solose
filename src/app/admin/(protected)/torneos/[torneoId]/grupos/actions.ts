"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CrearGrupoState {
  error?: string;
}

export async function crearGrupo(
  torneoId: string,
  _prevState: CrearGrupoState,
  formData: FormData
): Promise<CrearGrupoState> {
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!nombre) {
    return { error: "El nombre del grupo es obligatorio." };
  }

  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("grupos")
      .select("id", { count: "exact", head: true })
      .eq("torneo_id", torneoId);

    const { error } = await supabase.from("grupos").insert({
      torneo_id: torneoId,
      nombre,
      orden: count ?? 0,
    });

    if (error) {
      return { error: "No se pudo crear el grupo. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/grupos`);
    return {};
  } catch {
    return { error: "No se pudo crear el grupo. Intenta de nuevo." };
  }
}

export async function eliminarGrupo(
  grupoId: string,
  torneoId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("grupos").delete().eq("id", grupoId);

    if (error) {
      return { error: "No se pudo eliminar el grupo. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/grupos`);
    return {};
  } catch {
    return { error: "No se pudo eliminar el grupo. Intenta de nuevo." };
  }
}

export async function asignarGrupoEquipo(
  equipoId: string,
  torneoId: string,
  grupoId: string | null
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("equipos")
      .update({ grupo_id: grupoId })
      .eq("id", equipoId);

    if (error) {
      return { error: "No se pudo actualizar el grupo del equipo. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/grupos`);
    return {};
  } catch {
    return { error: "No se pudo actualizar el grupo del equipo. Intenta de nuevo." };
  }
}
