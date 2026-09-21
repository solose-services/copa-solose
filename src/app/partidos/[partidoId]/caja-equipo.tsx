"use client";

import { useState } from "react";

export function CajaEquipo({ nombre, logoUrl }: { nombre: string; logoUrl: string | null }) {
  const [fallo, setFallo] = useState(false);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md border font-tit text-lg"
        style={{
          borderColor: "var(--vino)",
          background: "color-mix(in srgb, var(--vino) 14%, var(--papel))",
          color: "var(--vino)",
        }}
      >
        {logoUrl && !fallo ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria pegada por el admin
          <img
            src={logoUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setFallo(true)}
          />
        ) : (
          nombre.charAt(0).toUpperCase()
        )}
      </div>
      <span
        className="font-tit text-[.68rem] uppercase tracking-wide"
        style={{ color: "rgba(255,255,255,.85)" }}
      >
        {nombre}
      </span>
    </div>
  );
}
