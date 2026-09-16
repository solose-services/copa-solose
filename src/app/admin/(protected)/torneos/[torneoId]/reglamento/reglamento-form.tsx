"use client";

import { useActionState } from "react";
import { subirReglamento } from "./actions";

async function accion(torneoId: string, _prevState: { error?: string }, formData: FormData) {
  return subirReglamento(torneoId, formData);
}

export function ReglamentoForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(accion.bind(null, torneoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Archivo PDF</span>
        <input
          type="file"
          name="archivo"
          accept="application/pdf"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-azul file:px-3 file:py-1.5 file:text-sm file:text-white focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Subiendo…" : "Subir reglamento"}
      </button>
    </form>
  );
}
