"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function subirReglamento(
  torneoId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const archivo = formData.get("archivo");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo PDF." };
  }

  if (archivo.type !== "application/pdf") {
    return { error: "El archivo debe ser un PDF." };
  }

  try {
    const supabase = await createClient();
    const ruta = `reglamentos/${torneoId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(ruta, archivo, { upsert: true, contentType: "application/pdf" });

    if (uploadError) {
      return { error: "No se pudo subir el archivo. Intenta de nuevo." };
    }

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(ruta);

    const { error: dbError } = await supabase.from("reglamentos").upsert(
      {
        torneo_id: torneoId,
        pdf_url: publicUrlData.publicUrl,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "torneo_id" }
    );

    if (dbError) {
      return { error: "No se pudo guardar el reglamento. Intenta de nuevo." };
    }

    revalidatePath(`/admin/torneos/${torneoId}/reglamento`);
    return {};
  } catch {
    return { error: "No se pudo subir el archivo. Intenta de nuevo." };
  }
}
