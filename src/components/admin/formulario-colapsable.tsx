"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

export function FormularioColapsable({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 border-t border-linea-2 pt-3 text-sm text-tinta-2 hover:text-azul"
      >
        <Plus
          size={13}
          strokeWidth={1.7}
          className="rounded-full border border-dashed border-current p-0.5"
        />
        {etiqueta}
      </button>
    );
  }

  return <div className="flex flex-col gap-3 border-t border-linea-2 pt-3">{children}</div>;
}
