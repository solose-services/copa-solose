"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function guardarAlineacion(
  partidoId: string,
  equipoLocalId: string,
  equipoVisitanteId: string,
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const jugadorasLocal = formData.getAll("jugadorasLocal").map(String);
  const jugadorasVisitante = formData.getAll("jugadorasVisitante").map(String);

  const filas = [
    ...jugadorasLocal.map((jugadoraId) => ({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      equipo_id: equipoLocalId,
    })),
    ...jugadorasVisitante.map((jugadoraId) => ({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      equipo_id: equipoVisitanteId,
    })),
  ];

  try {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("alineaciones")
      .delete()
      .eq("partido_id", partidoId);

    if (deleteError) {
      return { error: "No se pudo guardar la alineación. Intenta de nuevo." };
    }

    if (filas.length > 0) {
      const { error: insertError } = await supabase.from("alineaciones").insert(filas);
      if (insertError) {
        return { error: "No se pudo guardar la alineación. Intenta de nuevo." };
      }
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudo guardar la alineación. Intenta de nuevo." };
  }
}
