"use client";

import { useActionState } from "react";
import { crearSuspension, type CrearSuspensionState } from "./actions";

const estadoInicial: CrearSuspensionState = { errors: {} };

export function SuspensionForm({
  jugadoras,
  jornadas,
  torneoId = null,
}: {
  jugadoras: { id: string; etiqueta: string }[];
  jornadas: { id: string; etiqueta: string }[];
  torneoId?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    crearSuspension.bind(null, torneoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Jugadora</span>
        <select
          name="jugadoraId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jugadoras.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-vino">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Desde jornada</span>
        <select
          name="jornadaDesdeId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaDesdeId && (
          <span className="text-sm text-vino">{state.errors.jornadaDesdeId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Hasta jornada</span>
        <select
          name="jornadaHastaId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {jornadas.map((jornada) => (
            <option key={jornada.id} value={jornada.id}>
              {jornada.etiqueta}
            </option>
          ))}
        </select>
        {state.errors.jornadaHastaId && (
          <span className="text-sm text-vino">{state.errors.jornadaHastaId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Motivo (opcional)</span>
        <input
          name="motivo"
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
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar suspensión"}
      </button>
    </form>
  );
}
