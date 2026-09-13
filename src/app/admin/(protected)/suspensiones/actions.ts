"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validateSuspensionForm,
  type SuspensionFormErrors,
} from "@/lib/validation/suspension";

export interface CrearSuspensionState {
  errors: SuspensionFormErrors;
  errorGeneral?: string;
}

export async function crearSuspension(
  _prevState: CrearSuspensionState,
  formData: FormData
): Promise<CrearSuspensionState> {
  const values = {
    jugadoraId: String(formData.get("jugadoraId") ?? ""),
    jornadaDesdeId: String(formData.get("jornadaDesdeId") ?? ""),
    jornadaHastaId: String(formData.get("jornadaHastaId") ?? ""),
    motivo: String(formData.get("motivo") ?? ""),
  };

  const errors = validateSuspensionForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("suspensiones").insert({
      jugadora_id: values.jugadoraId,
      jornada_desde_id: values.jornadaDesdeId,
      jornada_hasta_id: values.jornadaHastaId,
      motivo: values.motivo || null,
    });

    if (error) {
      return {
        errors: {},
        errorGeneral: "No se pudo registrar la suspensión. Intenta de nuevo.",
      };
    }

    revalidatePath("/admin/suspensiones");
    return { errors: {} };
  } catch {
    return {
      errors: {},
      errorGeneral: "No se pudo registrar la suspensión. Intenta de nuevo.",
    };
  }
}

export async function eliminarSuspension(
  suspensionId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("suspensiones")
      .delete()
      .eq("id", suspensionId);

    if (error) {
      return { error: "No se pudo eliminar la suspensión. Intenta de nuevo." };
    }

    revalidatePath("/admin/suspensiones");
    return {};
  } catch {
    return { error: "No se pudo eliminar la suspensión. Intenta de nuevo." };
  }
}
