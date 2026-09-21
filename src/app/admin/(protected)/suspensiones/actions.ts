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
  torneoId: string | null,
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

    const { data: jugadora, error: jugadoraError } = await supabase
      .from("jugadoras")
      .select("equipo_id")
      .eq("id", values.jugadoraId)
      .maybeSingle();

    const { data: equipo, error: equipoError } = jugadora
      ? await supabase
          .from("equipos")
          .select("torneo_id")
          .eq("id", jugadora.equipo_id)
          .maybeSingle()
      : { data: null, error: null };

    const { data: jornadaDesde, error: jornadaDesdeError } = await supabase
      .from("jornadas")
      .select("torneo_id, orden")
      .eq("id", values.jornadaDesdeId)
      .maybeSingle();

    const { data: jornadaHasta, error: jornadaHastaError } = await supabase
      .from("jornadas")
      .select("torneo_id, orden")
      .eq("id", values.jornadaHastaId)
      .maybeSingle();

    if (jugadoraError || equipoError || jornadaDesdeError || jornadaHastaError) {
      return {
        errors: {},
        errorGeneral: "No se pudo validar la información. Intenta de nuevo.",
      };
    }

    if (!jugadora || !equipo || !jornadaDesde || !jornadaHasta) {
      return {
        errors: {},
        errorGeneral: "No se pudo encontrar la información seleccionada. Intenta de nuevo.",
      };
    }

    if (jornadaDesde.torneo_id !== equipo.torneo_id || jornadaHasta.torneo_id !== equipo.torneo_id) {
      return {
        errors: {
          jornadaDesdeId: "Las jornadas deben ser del mismo torneo que el equipo de la jugadora.",
        },
      };
    }

    if (jornadaHasta.orden < jornadaDesde.orden) {
      return {
        errors: {
          jornadaHastaId: "La jornada final no puede ser anterior a la jornada de inicio.",
        },
      };
    }

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
    if (torneoId) revalidatePath(`/admin/torneos/${torneoId}/jornadas/suspendidas`);
    return { errors: {} };
  } catch {
    return {
      errors: {},
      errorGeneral: "No se pudo registrar la suspensión. Intenta de nuevo.",
    };
  }
}

export async function eliminarSuspension(
  torneoId: string | null,
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
    if (torneoId) revalidatePath(`/admin/torneos/${torneoId}/jornadas/suspendidas`);
    return {};
  } catch {
    return { error: "No se pudo eliminar la suspensión. Intenta de nuevo." };
  }
}
