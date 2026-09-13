"use client";

import { useActionState } from "react";
import { guardarMvp } from "./actions";

async function accion(
  partidoId: string,
  _prevState: { error?: string },
  formData: FormData
) {
  return guardarMvp(partidoId, formData);
}

export function MvpForm({
  partidoId,
  jugadorasQueJugaron,
  mvpActual,
}: {
  partidoId: string;
  jugadorasQueJugaron: { id: string; nombre: string }[];
  mvpActual: string | null;
}) {
  const [state, formAction, pending] = useActionState(accion.bind(null, partidoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Jugadora del partido</span>
        <select
          name="mvpJugadoraId"
          className="rounded border px-3 py-2"
          defaultValue={mvpActual ?? ""}
        >
          <option value="">Sin asignar</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
