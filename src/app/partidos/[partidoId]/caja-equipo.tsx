"use client";

import { useState } from "react";

export function CajaEquipo({ nombre, logoUrl }: { nombre: string; logoUrl: string | null }) {
  const [fallo, setFallo] = useState(false);

  return (
    <div className="flex min-w-0 flex-col items-center gap-2.5">
      <div
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md font-tit text-3xl sm:h-24 sm:w-24 sm:text-5xl"
        style={{ background: "var(--vino)", color: "var(--amarillo)" }}
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
      <span className="max-w-full text-center font-tit text-sm uppercase leading-tight tracking-wide text-vino sm:text-lg">
        {nombre}
      </span>
    </div>
  );
}
