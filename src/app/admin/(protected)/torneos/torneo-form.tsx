"use client";

import { useActionState } from "react";
import { crearTorneo, type CrearTorneoState } from "./actions";

const estadoInicial: CrearTorneoState = { errors: {} };

export function TorneoForm() {
  const [state, formAction, pending] = useActionState(crearTorneo, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Nombre</span>
        <input name="nombre" className="rounded border px-3 py-2" />
        {state.errors.nombre && (
          <span className="text-sm text-red-600">{state.errors.nombre}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Categoría</span>
        <input name="categoria" className="rounded border px-3 py-2" placeholder="femenil, mixto…" />
        {state.errors.categoria && (
          <span className="text-sm text-red-600">{state.errors.categoria}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Temporada</span>
        <input name="temporada" className="rounded border px-3 py-2" placeholder="2026" />
        {state.errors.temporada && (
          <span className="text-sm text-red-600">{state.errors.temporada}</span>
        )}
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear torneo"}
      </button>
    </form>
  );
}
