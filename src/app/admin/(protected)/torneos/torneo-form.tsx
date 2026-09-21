"use client";

import { useActionState } from "react";
import { crearTorneo, type CrearTorneoState } from "./actions";

const estadoInicial: CrearTorneoState = { errors: {} };

export function TorneoForm() {
  const [state, formAction, pending] = useActionState(crearTorneo, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Nombre</span>
        <input
          name="nombre"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.nombre && <span className="text-sm text-vino">{state.errors.nombre}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Categoría</span>
        <input
          name="categoria"
          placeholder="femenil, mixto…"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.categoria && (
          <span className="text-sm text-vino">{state.errors.categoria}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Temporada</span>
        <input
          name="temporada"
          placeholder="2026"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.temporada && (
          <span className="text-sm text-vino">{state.errors.temporada}</span>
        )}
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
        {pending ? "Creando…" : "Crear torneo"}
      </button>
    </form>
  );
}
