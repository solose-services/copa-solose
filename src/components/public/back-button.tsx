"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ oscuro = false }: { oscuro?: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex w-fit items-center gap-1 font-mono text-[.68rem] uppercase tracking-wider"
      style={{ color: oscuro ? "rgba(255,255,255,.75)" : "var(--tinta-2)" }}
    >
      <ChevronLeft size={14} strokeWidth={1.7} />
      Regresar
    </button>
  );
}
