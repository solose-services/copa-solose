"use client";

import { useActionState } from "react";
import { crearJornada, type CrearJornadaState } from "./actions";

const estadoInicial: CrearJornadaState = { errors: {} };

export function JornadaForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(
    crearJornada.bind(null, torneoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Etiqueta</span>
        <input name="etiqueta" className="rounded border px-3 py-2" placeholder="Jornada 1" />
        {state.errors.etiqueta && (
          <span className="text-sm text-red-600">{state.errors.etiqueta}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Tipo</span>
        <select name="tipo" className="rounded border px-3 py-2" defaultValue="regular">
          <option value="regular">Regular</option>
          <option value="liguilla">Liguilla</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-red-600">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span>Orden</span>
        <input name="orden" className="rounded border px-3 py-2" placeholder="1" />
        {state.errors.orden && <span className="text-sm text-red-600">{state.errors.orden}</span>}
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear jornada"}
      </button>
    </form>
  );
}
