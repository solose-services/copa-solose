"use client";

import { useActionState } from "react";
import { crearEquipo, type CrearEquipoState } from "./actions";

const estadoInicial: CrearEquipoState = { errors: {} };

export function EquipoForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(
    crearEquipo.bind(null, torneoId),
    estadoInicial
  );

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
        <span>Logo (link, opcional)</span>
        <input name="logoUrl" className="rounded border px-3 py-2" placeholder="https://…" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear equipo"}
      </button>
    </form>
  );
}
