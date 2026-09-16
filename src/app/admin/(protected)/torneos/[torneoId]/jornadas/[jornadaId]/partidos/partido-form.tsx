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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Equipo local</span>
        <select
          name="equipoLocalId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoLocalId && (
          <span className="text-sm text-vino">{state.errors.equipoLocalId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Equipo visitante</span>
        <select
          name="equipoVisitanteId"
          defaultValue=""
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Selecciona…</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
        {state.errors.equipoVisitanteId && (
          <span className="text-sm text-vino">{state.errors.equipoVisitanteId}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Fecha</span>
        <input
          type="date"
          name="fecha"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
        {state.errors.fecha && <span className="text-sm text-vino">{state.errors.fecha}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Hora (opcional)</span>
        <input
          type="time"
          name="hora"
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        />
      </label>
      {state.errorGeneral && (
        <p
          className="rounded-sm border-l-2 px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--vino)", background: "rgba(90,42,34,.09)" }}
        >
          {state.errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear partido"}
      </button>
    </form>
  );
}
