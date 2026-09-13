"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateJornadaForm, type JornadaFormErrors } from "@/lib/validation/jornada";

export interface CrearJornadaState {
  errors: JornadaFormErrors;
  errorGeneral?: string;
}

export async function crearJornada(
  torneoId: string,
  _prevState: CrearJornadaState,
  formData: FormData
): Promise<CrearJornadaState> {
  const values = {
    etiqueta: String(formData.get("etiqueta") ?? ""),
    tipo: String(formData.get("tipo") ?? ""),
    orden: String(formData.get("orden") ?? ""),
  };

  const errors = validateJornadaForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("jornadas").insert({
      torneo_id: torneoId,
      etiqueta: values.etiqueta,
      tipo: values.tipo,
      orden: Number(values.orden),
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo crear la jornada. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/jornadas`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo crear la jornada. Intenta de nuevo." };
  }
}
