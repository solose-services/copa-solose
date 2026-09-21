"use client";

import { useActionState } from "react";
import { crearAviso, type CrearAvisoState } from "./actions";

const estadoInicial: CrearAvisoState = { errors: {} };

export function AvisoForm() {
  const [state, formAction, pending] = useActionState(crearAviso, estadoInicial);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Título</span>
        <input
          name="titulo"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.titulo && <span className="text-sm text-vino">{state.errors.titulo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Cuerpo</span>
        <textarea
          name="cuerpo"
          className="min-h-24 rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.cuerpo && <span className="text-sm text-vino">{state.errors.cuerpo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Imagen (link, opcional)</span>
        <input
          name="imagenUrl"
          placeholder="https://…"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
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
        className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Publicando…" : "Publicar aviso"}
      </button>
    </form>
  );
}
