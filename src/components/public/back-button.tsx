"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ amarillo = false }: { amarillo?: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex w-fit items-center gap-1 py-1 font-tit text-[.72rem] uppercase tracking-[.1em]"
      style={{ color: amarillo ? "var(--vino)" : "var(--tinta-2)" }}
    >
      <ChevronLeft size={16} strokeWidth={2.2} />
      Regresar
    </button>
  );
}
