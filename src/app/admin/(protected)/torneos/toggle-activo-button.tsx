"use client";

import { useTransition } from "react";
import { alternarTorneoActivo } from "./actions";

export function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => alternarTorneoActivo(id, activo))}
      disabled={pending}
      className="rounded border px-3 py-1 text-sm disabled:opacity-50"
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
