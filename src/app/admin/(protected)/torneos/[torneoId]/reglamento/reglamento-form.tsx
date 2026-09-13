"use client";

import { useActionState } from "react";
import { subirReglamento } from "./actions";

async function accion(torneoId: string, _prevState: { error?: string }, formData: FormData) {
  return subirReglamento(torneoId, formData);
}

export function ReglamentoForm({ torneoId }: { torneoId: string }) {
  const [state, formAction, pending] = useActionState(accion.bind(null, torneoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Archivo PDF</span>
        <input
          type="file"
          name="archivo"
          accept="application/pdf"
          className="rounded border px-3 py-2"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Subiendo…" : "Subir reglamento"}
      </button>
    </form>
  );
}
