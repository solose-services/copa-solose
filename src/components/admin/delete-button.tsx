"use client";

import { useState, useTransition } from "react";

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
        className="rounded border border-red-600 px-3 py-1 text-sm text-red-600 disabled:opacity-50"
      >
        {pending ? "Eliminando…" : "Eliminar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
