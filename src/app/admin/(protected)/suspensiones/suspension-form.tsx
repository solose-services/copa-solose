"use client";

import { useActionState } from "react";
import { crearSuspension, type CrearSuspensionState } from "./actions";

const estadoInicial: CrearSuspensionState = { errors: {} };

export function SuspensionForm({
  jugadoras,
  jornadas,
}: {
  jugadoras: { id: string; etiqueta: string }[];
  jornadas: { id: string; etiqueta: string }[];
}) {
  const [state, formAction, pending] = useActionState(crearSuspension, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Jugadora</span>
        <select name="jugadoraId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jugadoras.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-red-600">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Desde jornada</span>
        <select name="jornadaDesdeId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaDesdeId && (
          <span className="text-sm text-red-600">{state.errors.jornadaDesdeId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Hasta jornada</span>
        <select name="jornadaHastaId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaHastaId && (
          <span className="text-sm text-red-600">{state.errors.jornadaHastaId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Motivo (opcional)</span>
        <input name="motivo" className="rounded border px-3 py-2" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar suspensión"}
      </button>
    </form>
  );
}
