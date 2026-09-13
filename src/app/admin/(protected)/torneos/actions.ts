"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTorneoForm, type TorneoFormErrors } from "@/lib/validation/torneo";

export interface CrearTorneoState {
  errors: TorneoFormErrors;
  errorGeneral?: string;
}

export async function crearTorneo(
  _prevState: CrearTorneoState,
  formData: FormData
): Promise<CrearTorneoState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    categoria: String(formData.get("categoria") ?? ""),
    temporada: String(formData.get("temporada") ?? ""),
  };

  const errors = validateTorneoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("torneos").insert({
      nombre: values.nombre,
      categoria: values.categoria,
      temporada: values.temporada,
      activo: true,
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo crear el torneo. Intenta de nuevo." };
    }

    revalidatePath("/admin/torneos");
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo crear el torneo. Intenta de nuevo." };
  }
}

export async function alternarTorneoActivo(
  id: string,
  activoActual: boolean
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("torneos")
      .update({ activo: !activoActual })
      .eq("id", id);

    if (error) {
      return { error: "No se pudo actualizar el torneo. Intenta de nuevo." };
    }

    revalidatePath("/admin/torneos");
    return {};
  } catch {
    return { error: "No se pudo actualizar el torneo. Intenta de nuevo." };
  }
}
