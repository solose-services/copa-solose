"use client";

import { useActionState } from "react";
import { crearAviso, type CrearAvisoState } from "./actions";

const estadoInicial: CrearAvisoState = { errors: {} };

export function AvisoForm() {
  const [state, formAction, pending] = useActionState(crearAviso, estadoInicial);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4 max-w-lg">
      <label className="flex flex-col gap-1">
        <span>Título</span>
        <input name="titulo" className="rounded border px-3 py-2" />
        {state.errors.titulo && (
          <span className="text-sm text-red-600">{state.errors.titulo}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Cuerpo</span>
        <textarea name="cuerpo" className="min-h-24 rounded border px-3 py-2" />
        {state.errors.cuerpo && (
          <span className="text-sm text-red-600">{state.errors.cuerpo}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Imagen (link, opcional)</span>
        <input name="imagenUrl" className="rounded border px-3 py-2" placeholder="https://…" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Publicando…" : "Publicar aviso"}
      </button>
    </form>
  );
}
