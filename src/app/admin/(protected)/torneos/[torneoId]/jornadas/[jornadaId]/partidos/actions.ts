"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validatePartidoForm, type PartidoFormErrors } from "@/lib/validation/partido";

export interface CrearPartidoState {
  errors: PartidoFormErrors;
  errorGeneral?: string;
}

export async function crearPartido(
  jornadaId: string,
  torneoId: string,
  _prevState: CrearPartidoState,
  formData: FormData
): Promise<CrearPartidoState> {
  const values = {
    equipoLocalId: String(formData.get("equipoLocalId") ?? ""),
    equipoVisitanteId: String(formData.get("equipoVisitanteId") ?? ""),
    fecha: String(formData.get("fecha") ?? ""),
  };
  const hora = String(formData.get("hora") ?? "");

  const errors = validatePartidoForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();

    const { data: equiposSeleccionados, error: equiposError } = await supabase
      .from("equipos")
      .select("id, grupo_id")
      .in("id", [values.equipoLocalId, values.equipoVisitanteId]);

    if (equiposError) {
      return { errors: {}, errorGeneral: "No se pudo crear el partido. Intenta de nuevo." };
    }

    const grupoLocal = equiposSeleccionados?.find((e) => e.id === values.equipoLocalId)?.grupo_id;
    const grupoVisitante = equiposSeleccionados?.find(
      (e) => e.id === values.equipoVisitanteId
    )?.grupo_id;

    if ((grupoLocal ?? null) !== (grupoVisitante ?? null)) {
      return {
        errors: { equipoVisitanteId: "Los equipos deben pertenecer al mismo grupo." },
      };
    }

    const { error } = await supabase.from("partidos").insert({
      jornada_id: jornadaId,
      equipo_local_id: values.equipoLocalId,
      equipo_visitante_id: values.equipoVisitanteId,
      fecha: values.fecha,
      hora: hora || null,
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo crear el partido. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/jornadas/${jornadaId}/partidos`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo crear el partido. Intenta de nuevo." };
  }
}
