"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateAvisoForm, type AvisoFormErrors } from "@/lib/validation/aviso";

export interface CrearAvisoState {
  errors: AvisoFormErrors;
  errorGeneral?: string;
}

export async function crearAviso(
  _prevState: CrearAvisoState,
  formData: FormData
): Promise<CrearAvisoState> {
  const values = {
    titulo: String(formData.get("titulo") ?? ""),
    cuerpo: String(formData.get("cuerpo") ?? ""),
    imagenUrl: String(formData.get("imagenUrl") ?? ""),
  };

  const errors = validateAvisoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("avisos").insert({
      titulo: values.titulo,
      cuerpo: values.cuerpo,
      imagen_url: values.imagenUrl || null,
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo publicar el aviso. Intenta de nuevo." };
    }

    revalidatePath("/admin/avisos");
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo publicar el aviso. Intenta de nuevo." };
  }
}

export async function eliminarAviso(avisoId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("avisos").delete().eq("id", avisoId);

    if (error) {
      return { error: "No se pudo eliminar el aviso. Intenta de nuevo." };
    }

    revalidatePath("/admin/avisos");
    return {};
  } catch {
    return { error: "No se pudo eliminar el aviso. Intenta de nuevo." };
  }
}
