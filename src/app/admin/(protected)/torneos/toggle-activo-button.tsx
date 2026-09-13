"use client";

import { useState, useTransition } from "react";
import { alternarTorneoActivo } from "./actions";

export function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await alternarTorneoActivo(id, activo);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
      >
        {activo ? "Desactivar" : "Activar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
