"use client";

import { useActionState } from "react";
import { guardarAlineacion } from "./actions";

interface Jugadora {
  id: string;
  nombre: string;
}

export function AlineacionForm({
  partidoId,
  equipoLocalId,
  equipoVisitanteId,
  nombreLocal,
  nombreVisitante,
  jugadorasLocal,
  jugadorasVisitante,
  seleccionadasIniciales,
}: {
  partidoId: string;
  equipoLocalId: string;
  equipoVisitanteId: string;
  nombreLocal: string;
  nombreVisitante: string;
  jugadorasLocal: Jugadora[];
  jugadorasVisitante: Jugadora[];
  seleccionadasIniciales: string[];
}) {
  const [state, formAction, pending] = useActionState(
    guardarAlineacion.bind(null, partidoId, equipoLocalId, equipoVisitanteId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded border p-4">
      <h2 className="font-semibold">Alineación</h2>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{nombreLocal}</span>
          {jugadorasLocal.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="jugadorasLocal"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-medium">{nombreVisitante}</span>
          {jugadorasVisitante.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="jugadorasVisitante"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar alineación"}
      </button>
    </form>
  );
}
