"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  onDelete,
  confirmMessage,
}: {
  onDelete: () => Promise<{ error?: string } | void>;
  confirmMessage: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result && result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-sm border border-vino px-3 py-1.5 text-sm font-medium text-vino hover:bg-vino hover:text-white disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.7} />
        {pending ? "Eliminando…" : "Eliminar"}
      </button>
      {error && <span className="text-xs text-vino">{error}</span>}
    </div>
  );
}
