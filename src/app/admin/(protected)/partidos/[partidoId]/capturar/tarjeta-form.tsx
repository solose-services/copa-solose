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
        <span>Jugadora</span>
        <select name="jugadoraId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {jugadorasQueJugaron.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </select>
        {state.errors.jugadoraId && (
          <span className="text-sm text-red-600">{state.errors.jugadoraId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Tipo</span>
        <select name="tipo" className="rounded border px-3 py-2" defaultValue="amarilla">
          <option value="amarilla">Amarilla</option>
          <option value="roja">Roja</option>
        </select>
        {state.errors.tipo && <span className="text-sm text-red-600">{state.errors.tipo}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span>Minuto</span>
        <input name="minuto" className="w-20 rounded border px-3 py-2" />
        {state.errors.minuto && (
          <span className="text-sm text-red-600">{state.errors.minuto}</span>
        )}
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar tarjeta"}
      </button>
    </form>
  );
}
