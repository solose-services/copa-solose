"use client";

import { useActionState } from "react";
import { guardarFechaHora } from "./actions";

async function accion(partidoId: string, _prevState: { error?: string }, formData: FormData) {
  return guardarFechaHora(partidoId, formData);
}

export function FechaHoraForm({
  partidoId,
  fechaActual,
  horaActual,
}: {
  partidoId: string;
  fechaActual: string | null;
  horaActual: string | null;
}) {
  const [state, formAction, pending] = useActionState(accion.bind(null, partidoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Fecha</span>
        <input
          type="date"
          name="fecha"
          defaultValue={fechaActual ?? ""}
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Horario</span>
        <input
          type="time"
          name="hora"
          defaultValue={horaActual ? horaActual.slice(0, 5) : ""}
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
