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

export interface AgregarGolState {
  errors: { jugadoraId?: string; minuto?: string };
  errorGeneral?: string;
}

export async function agregarGol(
  partidoId: string,
  _prevState: AgregarGolState,
  formData: FormData
): Promise<AgregarGolState> {
  const jugadoraId = String(formData.get("jugadoraId") ?? "");
  const minutoRaw = String(formData.get("minuto") ?? "");

  const errors: AgregarGolState["errors"] = {};
  if (!jugadoraId) {
    errors.jugadoraId = "Selecciona quién anotó.";
  }
  if (!/^\d+$/.test(minutoRaw.trim())) {
    errors.minuto = "El minuto debe ser un número entero.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("goles").insert({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      minuto: Number(minutoRaw),
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo registrar el gol. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo registrar el gol. Intenta de nuevo." };
  }
}

export async function eliminarGol(
  golId: string,
  partidoId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("goles").delete().eq("id", golId);

    if (error) {
      return { error: "No se pudo eliminar el gol. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudo eliminar el gol. Intenta de nuevo." };
  }
}

export interface AgregarTarjetaState {
  errors: { jugadoraId?: string; tipo?: string; minuto?: string };
  errorGeneral?: string;
}

export async function agregarTarjeta(
  partidoId: string,
  _prevState: AgregarTarjetaState,
  formData: FormData
): Promise<AgregarTarjetaState> {
  const jugadoraId = String(formData.get("jugadoraId") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const minutoRaw = String(formData.get("minuto") ?? "");

  const errors: AgregarTarjetaState["errors"] = {};
  if (!jugadoraId) {
    errors.jugadoraId = "Selecciona a la jugadora.";
  }
  if (tipo !== "amarilla" && tipo !== "roja") {
    errors.tipo = "Selecciona un tipo de tarjeta válido.";
  }
  if (!/^\d+$/.test(minutoRaw.trim())) {
    errors.minuto = "El minuto debe ser un número entero.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tarjetas").insert({
      partido_id: partidoId,
      jugadora_id: jugadoraId,
      tipo,
      minuto: Number(minutoRaw),
    });

    if (error) {
      return { errors: {}, errorGeneral: "No se pudo registrar la tarjeta. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return { errors: {} };
  } catch {
    return { errors: {}, errorGeneral: "No se pudo registrar la tarjeta. Intenta de nuevo." };
  }
}

export async function eliminarTarjeta(
  tarjetaId: string,
  partidoId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tarjetas").delete().eq("id", tarjetaId);

    if (error) {
      return { error: "No se pudo eliminar la tarjeta. Intenta de nuevo." };
    }

    revalidatePath(`/admin/partidos/${partidoId}/capturar`);
    return {};
  } catch {
    return { error: "No se pudo eliminar la tarjeta. Intenta de nuevo." };
  }
}
