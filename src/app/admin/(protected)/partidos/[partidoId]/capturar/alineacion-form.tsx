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
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2 border-b-2 border-azul pb-2">
        <h2 className="font-tit text-[.82rem] uppercase tracking-[.13em] text-azul">
          Alineación
        </h2>
      </div>
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-tinta">{nombreLocal}</span>
          {jugadorasLocal.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="jugadorasLocal"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
                className="h-[19px] w-[19px] appearance-none rounded-full border-[1.5px] border-linea bg-papel checked:border-azul checked:bg-azul"
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-tinta">{nombreVisitante}</span>
          {jugadorasVisitante.map((jugadora) => (
            <label key={jugadora.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="jugadorasVisitante"
                value={jugadora.id}
                defaultChecked={seleccionadasIniciales.includes(jugadora.id)}
                className="h-[19px] w-[19px] appearance-none rounded-full border-[1.5px] border-linea bg-papel checked:border-azul checked:bg-azul"
              />
              {jugadora.nombre}
            </label>
          ))}
        </div>
      </div>
      {state.error && <p className="text-sm text-vino">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-azul px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar alineación"}
      </button>
    </form>
  );
}
