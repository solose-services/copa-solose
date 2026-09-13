"use client";

import { useActionState } from "react";
import { crearJugadora, type CrearJugadoraState } from "./actions";

const estadoInicial: CrearJugadoraState = { errors: {} };

export function JugadoraForm({ equipoId }: { equipoId: string }) {
  const [state, formAction, pending] = useActionState(
    crearJugadora.bind(null, equipoId),
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
        <span>Número de camiseta (opcional)</span>
        <input name="numeroCamiseta" className="rounded border px-3 py-2" />
        {state.errors.numeroCamiseta && (
          <span className="text-sm text-red-600">{state.errors.numeroCamiseta}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Foto (link, opcional)</span>
        <input name="fotoUrl" className="rounded border px-3 py-2" placeholder="https://…" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar jugadora"}
      </button>
    </form>
  );
}
