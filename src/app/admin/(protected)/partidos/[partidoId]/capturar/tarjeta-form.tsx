"use client";

import { useActionState } from "react";
import { agregarTarjeta, type AgregarTarjetaState } from "./actions";

const estadoInicial: AgregarTarjetaState = { errors: {} };

export function TarjetaForm({
  partidoId,
  jugadorasQueJugaron,
}: {
  partidoId: string;
  jugadorasQueJugaron: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    agregarTarjeta.bind(null, partidoId),
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
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-vino">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Tipo</span>
        <select
          name="tipo"
          defaultValue="amarilla"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="amarilla">Amarilla</option>
          <option value="roja">Roja</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-vino">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Minuto</span>
        <input
          name="minuto"
          className="w-20 rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.minuto && <span className="text-sm text-vino">{state.errors.minuto}</span>}
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
        {pending ? "Agregando…" : "Agregar tarjeta"}
      </button>
    </form>
  );
}
