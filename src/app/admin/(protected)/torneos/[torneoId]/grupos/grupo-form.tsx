"use client";

import { useActionState } from "react";
import { crearGrupo, type CrearGrupoState } from "./actions";

const estadoInicial: CrearGrupoState = {};

export function GrupoForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(
    crearGrupo.bind(null, torneoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Nombre del grupo</span>
        <input
          name="nombre"
          placeholder="Grupo A"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.error && <span className="text-sm text-vino">{state.error}</span>}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear grupo"}
      </button>
    </form>
  );
}
