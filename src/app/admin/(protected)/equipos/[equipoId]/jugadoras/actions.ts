"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateJugadoraForm, type JugadoraFormErrors } from "@/lib/validation/jugadora";

export interface CrearJugadoraState {
  errors: JugadoraFormErrors;
  errorGeneral?: string;
}

function parseNumeroCamiseta(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export async function crearJugadora(
  equipoId: string,
  _prevState: CrearJugadoraState,
  formData: FormData
): Promise<CrearJugadoraState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    numeroCamiseta: String(formData.get("numeroCamiseta") ?? ""),
    fotoUrl: String(formData.get("fotoUrl") ?? ""),
  };

  const errors = validateJugadoraForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("jugadoras").insert({
      equipo_id: equipoId,
      nombre: values.nombre,
      numero_camiseta: parseNumeroCamiseta(values.numeroCamiseta),
      foto_url: values.fotoUrl || null,
    });

    if (error) {
      if (error.code === "23505") {
        return {
          errors: {
            numeroCamiseta: "Ese número de camiseta ya está asignado en este equipo.",
          },
        };
      }

      return {
        errors: {},
        errorGeneral: "No se pudo registrar a la jugadora. Intenta de nuevo.",
      };
    }

    revalidatePath(`/admin/equipos/${equipoId}/jugadoras`);
    return { errors: {} };
  } catch {
    return {
      errors: {},
      errorGeneral: "No se pudo registrar a la jugadora. Intenta de nuevo.",
    };
  }
}

export async function actualizarJugadora(
  jugadoraId: string,
  equipoId: string,
  _prevState: CrearJugadoraState,
  formData: FormData
): Promise<CrearJugadoraState> {
  const values = {
    nombre: String(formData.get("nombre") ?? ""),
    numeroCamiseta: String(formData.get("numeroCamiseta") ?? ""),
    fotoUrl: String(formData.get("fotoUrl") ?? ""),
  };

  const errors = validateJugadoraForm(values);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("jugadoras")
      .update({
        nombre: values.nombre,
        numero_camiseta: parseNumeroCamiseta(values.numeroCamiseta),
        foto_url: values.fotoUrl || null,
      })
      .eq("id", jugadoraId);

    if (error) {
      if (error.code === "23505") {
        return {
          errors: {
            numeroCamiseta: "Ese número de camiseta ya está asignado en este equipo.",
          },
        };
      }

      return { errors: {}, errorGeneral: "No se pudo guardar el cambio. Intenta de nuevo." };
    }
  } catch {
    return { errors: {}, errorGeneral: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidatePath(`/admin/equipos/${equipoId}/jugadoras`);
  redirect(`/admin/equipos/${equipoId}/jugadoras`);
}

export async function eliminarJugadora(
  jugadoraId: string,
  equipoId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("jugadoras").delete().eq("id", jugadoraId);

    if (error) {
      return { error: "No se pudo eliminar a la jugadora. Intenta de nuevo." };
    }

    revalidatePath(`/admin/equipos/${equipoId}/jugadoras`);
    return {};
  } catch {
    return { error: "No se pudo eliminar a la jugadora. Intenta de nuevo." };
  }
}
