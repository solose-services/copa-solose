"use client";

import { useState, useTransition } from "react";
import { asignarGrupoEquipo } from "./actions";

export function AsignarGrupoSelect({
  equipoId,
  torneoId,
  grupoIdActual,
  grupos,
}: {
  equipoId: string;
  torneoId: string;
  grupoIdActual: string | null;
  grupos: { id: string; nombre: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const grupoId = event.target.value || null;
    setError(null);
    startTransition(async () => {
      const result = await asignarGrupoEquipo(equipoId, torneoId, grupoId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        defaultValue={grupoIdActual ?? ""}
        onChange={handleChange}
        disabled={pending}
        className="rounded-md border border-linea bg-papel px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-azul/20 disabled:opacity-50"
      >
        <option value="">Sin grupo</option>
        {grupos.map((grupo) => (
          <option key={grupo.id} value={grupo.id}>
            {grupo.nombre}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-vino">{error}</span>}
    </div>
  );
}
