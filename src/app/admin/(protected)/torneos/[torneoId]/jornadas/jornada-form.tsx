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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Etiqueta</span>
        <input
          name="etiqueta"
          placeholder="Jornada 1"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.etiqueta && (
          <span className="text-sm text-vino">{state.errors.etiqueta}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Tipo</span>
        <select
          name="tipo"
          defaultValue="regular"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="regular">Regular</option>
          <option value="liguilla">Liguilla</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-vino">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Orden</span>
        <input
          name="orden"
          placeholder="1"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.orden && <span className="text-sm text-vino">{state.errors.orden}</span>}
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "color-mix(in srgb, var(--vino) 9%, var(--papel))" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear jornada"}
      </button>
    </form>
  );
}
