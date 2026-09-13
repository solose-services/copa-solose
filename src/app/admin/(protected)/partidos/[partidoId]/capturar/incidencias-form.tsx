"use client";

import { useActionState } from "react";
import { guardarIncidencias } from "./actions";

async function accion(
  partidoId: string,
  _prevState: { error?: string },
  formData: FormData
) {
  return guardarIncidencias(partidoId, formData);
}

export function IncidenciasForm({
  partidoId,
  incidenciasActuales,
}: {
  partidoId: string;
  incidenciasActuales: string | null;
}) {
  const [state, formAction, pending] = useActionState(accion.bind(null, partidoId), {});

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Incidencias</span>
        <textarea
          name="incidencias"
          defaultValue={incidenciasActuales ?? ""}
          className="min-h-24 rounded border px-3 py-2"
          placeholder="Notas del partido (opcional)"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
