"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEquipoForm, type EquipoFormErrors } from "@/lib/validation/equipo";

export interface CrearEquipoState {
  errors: EquipoFormErrors;
  errorGeneral?: string;
}

export async function crearEquipo(
  torneoId: string,
  _prevState: CrearEquipoState,
  formData: FormData
): Promise<CrearEquipoState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
  };

  const errors = validateEquipoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("equipos").insert({
      torneo_id: torneoId,
      nombre: values.nombre,
      logo_url: values.logoUrl || null,
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo crear el equipo. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/equipos`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo crear el equipo. Intenta de nuevo." };
  }
}

export async function actualizarEquipo(
  equipoId: string,
  torneoId: string,
  _prevState: CrearEquipoState,
  formData: FormData
): Promise<CrearEquipoState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
  };

  const errors = validateEquipoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("equipos")
      .update({ nombre: values.nombre, logo_url: values.logoUrl || null })
      .eq("id", equipoId);

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo guardar el cambio. Intenta de nuevo." };
    }
  } catch {
    return { errors: {}, errorGeneral: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidatePath(`/admin/torneos/${torneoId}/equipos`);
  redirect(`/admin/torneos/${torneoId}/equipos`);
}

export async function eliminarEquipo(
  equipoId: string,
  torneoId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("equipos").delete().eq("id", equipoId);

    if (error) {
      return { error: "No se pudo eliminar el equipo. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/equipos`);
    return {};
  } catch {
    return { error: "No se pudo eliminar el equipo. Intenta de nuevo." };
  }
}
