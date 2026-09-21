"use client";

import { useActionState } from "react";
import { guardarMvp } from "./actions";
import { OpcionesJugadora, type JugadoraOpcion } from "./opciones-jugadora";

async function accion(
  partidoId: string,
  _prevState: { error?: string },
  formData: FormData
) {
  return guardarMvp(partidoId, formData);
}

export function MvpForm({
  partidoId,
  jugadorasQueJugaron,
  mvpActual,
  equipoLocalId,
  nombreLocal,
  equipoVisitanteId,
  nombreVisitante,
}: {
  partidoId: string;
  jugadorasQueJugaron: JugadoraOpcion[];
  mvpActual: string | null;
  equipoLocalId: string;
  nombreLocal: string;
  equipoVisitanteId: string;
  nombreVisitante: string;
}) {
  const [state, formAction, pending] = useActionState(accion.bind(null, partidoId), {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Jugadora del partido</span>
        <select
          name="mvpJugadoraId"
          defaultValue={mvpActual ?? ""}
          className="rounded-md border border-azul bg-papel px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Sin asignar</option>
          <OpcionesJugadora
            jugadoras={jugadorasQueJugaron}
            equipoLocalId={equipoLocalId}
            nombreLocal={nombreLocal}
            equipoVisitanteId={equipoVisitanteId}
            nombreVisitante={nombreVisitante}
          />
        </select>
      </label>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
