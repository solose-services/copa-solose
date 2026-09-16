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
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Incidencias</span>
        <textarea
          name="incidencias"
          defaultValue={incidenciasActuales ?? ""}
          placeholder="Notas del partido (opcional)"
          className="min-h-24 rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
