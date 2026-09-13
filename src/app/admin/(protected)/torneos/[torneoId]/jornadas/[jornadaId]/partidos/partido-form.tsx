"use client";

import { useActionState } from "react";
import { crearPartido, type CrearPartidoState } from "./actions";

const estadoInicial: CrearPartidoState = { errors: {} };

export function PartidoForm({
  jornadaId,
  torneoId,
  equipos,
}: {
  jornadaId: string;
  torneoId: string;
  equipos: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    crearPartido.bind(null, jornadaId, torneoId),
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="flex flex-col gap-1">
        <span>Equipo local</span>
        <select name="equipoLocalId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoLocalId && (
          <span className="text-sm text-red-600">{state.errors.equipoLocalId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Equipo visitante</span>
        <select name="equipoVisitanteId" className="rounded border px-3 py-2" defaultValue="">
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoVisitanteId && (
          <span className="text-sm text-red-600">{state.errors.equipoVisitanteId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Fecha</span>
        <input type="date" name="fecha" className="rounded border px-3 py-2" />
        {state.errors.fecha && <span className="text-sm text-red-600">{state.errors.fecha}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span>Hora (opcional)</span>
        <input type="time" name="hora" className="rounded border px-3 py-2" />
      </label>
      {state.errorGeneral && <p className="text-sm text-red-600">{state.errorGeneral}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear partido"}
      </button>
    </form>
  );
}
